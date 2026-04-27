import "dotenv/config";
import cors from "cors";
import express from "express";
import { openDb, seedAllowlist, isAllowlisted, logAudit } from "./db.js";
import { loadLocalDeployment } from "./deployment.js";
import { buildDomain, verifyCommitSignature } from "./eip712.js";
import { createRelayer } from "./relayer.js";
import { sumVerifiedReveals } from "./stats.js";

const PORT = Number(process.env.PORT ?? 8787);
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const SPONSOR_PK = process.env.SPONSOR_PRIVATE_KEY ?? "";

const deployment = loadLocalDeployment();

const CHAIN_ID = Number(
  process.env.CHAIN_ID && process.env.CHAIN_ID.trim() !== ""
    ? process.env.CHAIN_ID
    : (deployment?.chainId ?? 31337)
);

const CONTRACT_ADDRESS = (
  process.env.CONTRACT_ADDRESS?.trim() ||
  deployment?.address ||
  ""
).trim();

if (deployment?.address && !process.env.CONTRACT_ADDRESS?.trim()) {
  console.log(`Contract address from deployments/localhost.json → ${CONTRACT_ADDRESS}`);
}

const db = openDb();

const allowEnv = process.env.ALLOWLIST ?? "";
seedAllowlist(
  db,
  allowEnv.split(",").map((s) => s.trim()).filter(Boolean)
);

let relayer = null;
if (CONTRACT_ADDRESS && SPONSOR_PK) {
  relayer = createRelayer(RPC_URL, SPONSOR_PK, CONTRACT_ADDRESS);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "64kb" }));

app.get("/api/config", (_req, res) => {
  res.json({
    contractAddress: CONTRACT_ADDRESS || null,
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    source: process.env.CONTRACT_ADDRESS?.trim()
      ? "env"
      : deployment?.address
        ? "deployments/localhost.json"
        : "none",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    chainId: CHAIN_ID,
    contractConfigured: Boolean(CONTRACT_ADDRESS && SPONSOR_PK),
    timestamp: Date.now(),
  });
});

app.get("/api/stats", async (_req, res) => {
  const totalRegisteredVoters = db.prepare("SELECT COUNT(*) AS c FROM allowlist").get().c;
  const activeCommitments = db
    .prepare(
      `SELECT COUNT(*) AS c FROM commit_queue WHERE status IN ('pending', 'submitted')`
    )
    .get().c;

  let verifiedReveals = 0;
  if (CONTRACT_ADDRESS) {
    try {
      verifiedReveals = await sumVerifiedReveals(RPC_URL, CONTRACT_ADDRESS);
    } catch {
      verifiedReveals = 0;
    }
  }

  res.json({
    totalRegisteredVoters,
    activeCommitments,
    verifiedReveals,
    updatedAt: Date.now(),
  });
});

app.get("/api/allowlist/:address", (req, res) => {
  const addr = req.params.address;
  const allowed = isAllowlisted(db, addr);
  logAudit(db, "allowlist_check", { address: addr, allowed });
  res.json({ address: addr, allowed });
});

app.post("/api/relay/commit", async (req, res) => {
  const { voter, commitment, deadline, signature } = req.body ?? {};

  if (!voter || !deadline || !signature) {
    return res.status(400).json({ error: "missing voter, deadline, or signature" });
  }

  if (!isAllowlisted(db, voter)) {
    logAudit(db, "relay_commit_denied", { reason: "not_allowlisted", voter });
    return res.status(403).json({ error: "voter not on allowlist" });
  }

  if (!commitment || typeof commitment !== "string" || !commitment.startsWith("0x")) {
    return res.status(400).json({ error: "invalid commitment" });
  }

  if (!CONTRACT_ADDRESS) {
    return res.status(503).json({ error: "CONTRACT_ADDRESS not configured" });
  }

  const domain = buildDomain(CHAIN_ID, CONTRACT_ADDRESS);
  const ok = verifyCommitSignature(
    domain,
    commitment,
    deadline,
    voter,
    signature
  );

  if (!ok) {
    logAudit(db, "relay_commit_denied", { reason: "bad_signature", voter });
    return res.status(401).json({ error: "signature verification failed" });
  }

  const now = Date.now();
  const ins = db.prepare(`
    INSERT INTO commit_queue (voter_address, commitment, deadline, signature, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `);
  const info = ins.run(
    voter.toLowerCase(),
    commitment,
    Number(deadline),
    signature,
    now,
    now
  );

  logAudit(db, "commit_queued", {
    id: info.lastInsertRowid,
    voter,
    commitment,
  });

  if (!relayer) {
    return res.status(503).json({
      error: "relayer wallet not configured",
      queueId: info.lastInsertRowid,
    });
  }

  try {
    const tx = await relayer.contract.submitCommit(
      voter,
      commitment,
      BigInt(deadline),
      signature
    );
    const receipt = await tx.wait();
    const txHash = receipt?.hash ?? tx.hash;

    db.prepare(
      `UPDATE commit_queue SET status = 'submitted', tx_hash = ?, updated_at = ?, error = NULL WHERE id = ?`
    ).run(txHash, Date.now(), info.lastInsertRowid);

    logAudit(db, "commit_submitted", { queueId: info.lastInsertRowid, txHash });

    return res.json({
      ok: true,
      queueId: info.lastInsertRowid,
      txHash,
    });
  } catch (e) {
    const msg = e?.shortMessage ?? e?.message ?? String(e);
    db.prepare(
      `UPDATE commit_queue SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`
    ).run(msg, Date.now(), info.lastInsertRowid);
    logAudit(db, "commit_failed", { queueId: info.lastInsertRowid, error: msg });
    return res.status(502).json({ error: msg, queueId: info.lastInsertRowid });
  }
});

app.get("/api/audit/commits", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, voter_address, commitment, deadline, status, tx_hash, error, created_at, updated_at
       FROM commit_queue ORDER BY id DESC LIMIT 500`
    )
    .all();
  res.json({ items: rows });
});

app.get("/api/audit/logs", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, event_type, payload, created_at FROM audit_logs ORDER BY id DESC LIMIT 500`
    )
    .all();
  res.json({ items: rows });
});

app.listen(PORT, () => {
  console.log(`Relayer API http://127.0.0.1:${PORT}`);
});
