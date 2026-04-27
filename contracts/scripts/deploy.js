const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

/**
 * Set or replace KEY=value in a .env file (creates file / parent dirs if missing).
 * Values are trimmed; no accidental leading/trailing spaces (avoids subtle RPC/address bugs).
 * @param {string} filePath
 * @param {string} key
 * @param {string} value
 */
function upsertEnvVar(filePath, key, value) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }
  const v = String(value).trim();
  const line = `${key}=${v}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    if (content.length > 0 && !content.endsWith("\n")) {
      content += "\n";
    }
    content += `${line}\n`;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Writes repo-root deployment metadata (single source of truth for “what did we last deploy?”).
 * @param {string} repoRoot
 * @param {Record<string, unknown>} payload
 */
function writeDeploymentArtifact(repoRoot, payload) {
  const dir = path.join(repoRoot, "deployments");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, "localhost.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return filePath;
}

/**
 * Keeps backend + frontend in sync after every deploy (Hardhat resets state on restart).
 * @param {object} opts
 * @param {string} opts.repoRoot
 * @param {string} opts.checksumAddress
 * @param {number} opts.chainId
 */
function syncBackendEnv({ repoRoot, checksumAddress, chainId }) {
  const backendEnv = path.join(repoRoot, "backend", ".env");
  upsertEnvVar(backendEnv, "CONTRACT_ADDRESS", checksumAddress);
  upsertEnvVar(backendEnv, "CHAIN_ID", String(chainId));
  return { backendEnv };
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const sponsor = process.env.SPONSOR_ADDRESS
    ? process.env.SPONSOR_ADDRESS.trim()
    : deployer.address;

  const now = Math.floor(Date.now() / 1000);
  const demo =
    process.env.DEMO === "true" ||
    process.env.DEMO === "1" ||
    String(process.env.DEMO ?? "").toLowerCase() === "true";

  let commitDeadline;
  let revealDeadline;
  if (demo) {
    commitDeadline = now + 5 * 60;
    revealDeadline = commitDeadline + 60 * 60;
    console.log("DEMO=true: commit window ~5 minutes; reveal window ends ~1 hour after commitDeadline.");
  } else {
    commitDeadline = now + 120;
    revealDeadline = commitDeadline + 300;
    console.log(
      "Default (short showcase): commit window 120s; reveal closes 300s after commitDeadline (~7 min total)."
    );
  }

  const maxCandidateId = 32;

  const Factory = await hre.ethers.getContractFactory("BlindVoteElection");
  const election = await Factory.deploy(sponsor, commitDeadline, revealDeadline, maxCandidateId);
  await election.waitForDeployment();
  const rawAddress = await election.getAddress();
  const checksumAddress = hre.ethers.getAddress(rawAddress);

  const netName = hre.network.name;
  const chainId = Number(hre.network.config.chainId ?? 31337);

  console.log("BlindVoteElection:", checksumAddress);
  console.log("Sponsor:", sponsor);
  console.log("DEMO mode:", demo);
  console.log("commitDeadline:", commitDeadline);
  console.log("revealDeadline:", revealDeadline);

  const repoRoot = path.resolve(__dirname, "..", "..");

  const { backendEnv } = syncBackendEnv({
    repoRoot,
    checksumAddress,
    chainId,
  });

  const artifactPath = writeDeploymentArtifact(repoRoot, {
    name: "BlindVoteElection",
    address: checksumAddress,
    network: netName,
    chainId,
    sponsor,
    demo,
    commitDeadline,
    revealDeadline,
    maxCandidateId,
    updatedAt: new Date().toISOString(),
  });

  console.log("");
  console.log("Auto-config:");
  console.log("  artifact:     ", artifactPath);
  console.log("  backend .env: ", backendEnv, "(CONTRACT_ADDRESS, CHAIN_ID)");
  console.log("");
  console.log(
    "Restart the backend once so it reloads .env / deployments/localhost.json. Frontend loads the contract from GET /api/config — refresh the browser; no frontend .env edits needed."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
