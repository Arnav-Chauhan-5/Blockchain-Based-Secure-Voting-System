import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VerticalStep, VerticalStepper, type StepVisualState } from "@/components/ui/vertical-stepper";
import { useWallet, getSigner } from "@/hooks/useWallet";
import { computeCommitment, generateSecretHex } from "@/web3/commitment";
import { buildCommitDomain, commitDeadlineSeconds, COMMIT_VOTE_TYPES } from "@/web3/eip712";
import { getContractAddress } from "@/web3/chain";
import { electionContract, latestChainTimestamp, readCommitRevealWindows } from "@/web3/contract";
import { fetchAllowlisted, relayCommit } from "@/services/api";

function isLikelyBytes32Hex(s: string): boolean {
  const x = s.trim();
  if (!x) return false;
  const h = x.startsWith("0x") ? x : `0x${x}`;
  return /^0x[0-9a-fA-F]{64}$/.test(h);
}

export function VotePage() {
  const { address, connect, error: walletError } = useWallet();
  const [allowlisted, setAllowlisted] = useState<boolean | null>(null);
  const [candidateId, setCandidateId] = useState("");
  const [secret, setSecret] = useState("");
  const [signature, setSignature] = useState("");
  const [sigDeadline, setSigDeadline] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sponsoredComplete, setSponsoredComplete] = useState(false);

  const [commitDeadline, setCommitDeadline] = useState<bigint | null>(null);
  const [chainNow, setChainNow] = useState<number>(0);

  useEffect(() => {
    if (!address) {
      setAllowlisted(null);
      return;
    }
    let cancelled = false;
    setAllowlisted(null);
    fetchAllowlisted(address).then((ok) => {
      if (!cancelled) setAllowlisted(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const [phase, ts] = await Promise.all([
          readCommitRevealWindows(),
          latestChainTimestamp(),
        ]);
        if (cancelled) return;
        if (phase) setCommitDeadline(phase.commitDeadline);
        setChainNow(ts);
      } catch {
        if (!cancelled) setChainNow(Math.floor(Date.now() / 1000));
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const revealOpen =
    commitDeadline != null && BigInt(chainNow) > commitDeadline;

  const commitmentLive = useMemo(() => {
    try {
      const id = BigInt(candidateId.trim());
      if (id <= 0n) return "";
      if (!isLikelyBytes32Hex(secret)) return "";
      const sec = secret.trim().startsWith("0x") ? secret.trim() : `0x${secret.trim()}`;
      return computeCommitment(id, sec);
    } catch {
      return "";
    }
  }, [candidateId, secret]);

  const identityState: StepVisualState = useMemo(() => {
    if (allowlisted === true) return "complete";
    if (!address) return "active";
    return "active";
  }, [address, allowlisted]);

  const commitState: StepVisualState = useMemo(() => {
    if (!allowlisted) return "locked";
    if (sponsoredComplete) return "complete";
    return "active";
  }, [allowlisted, sponsoredComplete]);

  const revealState: StepVisualState = useMemo(() => {
    if (!revealOpen) return "locked";
    return "active";
  }, [revealOpen]);

  const refreshAllowlist = useCallback(async () => {
    if (!address) return;
    setAllowlisted(null);
    const ok = await fetchAllowlisted(address);
    setAllowlisted(ok);
    if (!ok) setMsg("This wallet is not on the relayer allowlist.");
    else setMsg(null);
  }, [address]);

  const handleGenerateSecret = useCallback(() => {
    setSecret(generateSecretHex());
    setMsg(null);
    setSignature("");
    setSponsoredComplete(false);
    setTxHash(null);
  }, []);

  const blindedSubmission = useCallback(async () => {
    if (!address || !getContractAddress()) {
      setMsg("Connect wallet and ensure the relayer is running (contract from /api/config).");
      return;
    }
    if (!allowlisted) {
      setMsg("Complete identity verification first.");
      return;
    }
    let id: bigint;
    try {
      id = BigInt(candidateId.trim());
      if (id <= 0n) throw new Error("Invalid candidate id");
    } catch {
      setMsg("Enter a valid positive candidate id.");
      return;
    }
    let sec = secret.trim();
    if (!sec) {
      sec = generateSecretHex();
      setSecret(sec);
    }
    if (!isLikelyBytes32Hex(sec)) {
      setMsg("Secret must be 32 bytes hex (64 hex chars), or leave empty to auto-generate.");
      return;
    }
    const secNorm = sec.startsWith("0x") ? sec : `0x${sec}`;
    const c = computeCommitment(id, secNorm);
    const dl = commitDeadlineSeconds(3600);

    setBusy(true);
    setMsg(null);
    setTxHash(null);
    try {
      const signer = await getSigner();
      const domain = buildCommitDomain();
      const value = {
        commitment: c,
        deadline: BigInt(dl),
        voter: address,
      };
      const sig = await signer.signTypedData(domain, COMMIT_VOTE_TYPES, value);
      setSignature(sig);
      setSigDeadline(dl);

      const res = await relayCommit({
        voter: address,
        commitment: c,
        deadline: dl,
        signature: sig,
      });

      if (res.error) {
        setMsg(res.error);
        setSponsoredComplete(false);
        return;
      }

      setTxHash(res.txHash ?? null);
      setSponsoredComplete(true);
      setMsg(
        res.txHash
          ? "Blinded commitment confirmed on-chain via sponsor."
          : "Relay accepted; transaction hash pending."
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Blinded submission failed");
      setSponsoredComplete(false);
    } finally {
      setBusy(false);
    }
  }, [address, allowlisted, candidateId, secret]);

  const doReveal = useCallback(async () => {
    if (!address || !revealOpen) return;
    let id: bigint;
    try {
      id = BigInt(candidateId.trim());
      if (id <= 0n) throw new Error("bad id");
    } catch {
      setMsg("Enter the same candidate id used at commit time.");
      return;
    }
    const sec = secret.trim().startsWith("0x") ? secret.trim() : `0x${secret.trim()}`;
    if (!isLikelyBytes32Hex(sec)) {
      setMsg("Secret (bytes32) required to reveal.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const signer = await getSigner();
      const c = electionContract(signer);
      const tx = await c.reveal(id, sec);
      const receipt = await tx.wait();
      setMsg(`Reveal mined in block ${receipt?.blockNumber ?? "?"}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Reveal failed");
    } finally {
      setBusy(false);
    }
  }, [address, candidateId, secret, revealOpen]);

  const commitEndsLabel = useMemo(() => {
    if (commitDeadline == null) return null;
    const d = new Date(Number(commitDeadline) * 1000);
    return d.toISOString();
  }, [commitDeadline]);

  const secondsUntilReveal =
    commitDeadline != null && !revealOpen
      ? Math.max(0, Number(commitDeadline) - chainNow)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-50">Voter dashboard</h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-400 leading-relaxed">
          Three-phase flow: institutional allowlist, local blind hash + EIP-712, sponsor broadcast, then on-chain reveal
          after the commit window closes.
        </p>
      </div>

      <VerticalStepper>
        <VerticalStep
          stepNumber={1}
          title="Identity check"
          description="Wallet must appear on the relayer allowlist before blinded submission is permitted."
          state={identityState}
        >
          <Card className="border-slate-800 bg-card/40">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1">
                  <Label>Wallet</Label>
                  <Input
                    readOnly
                    value={address ?? ""}
                    placeholder="Not connected"
                    className="mt-1 font-mono text-[11px]"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={() => void connect()}>
                  Connect
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!address}
                  onClick={() => void refreshAllowlist()}
                >
                  Refresh check
                </Button>
              </div>

              {walletError && <p className="text-xs text-amber-300">{walletError}</p>}

              {address && allowlisted === null && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying allowlist…
                </div>
              )}

              {allowlisted === true && (
                <div className="flex items-center gap-2 rounded-sm border border-emerald-900/60 bg-emerald-950/30 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
                  <span className="text-sm font-medium text-emerald-100">Verified</span>
                  <Badge
                    variant="outline"
                    className="ml-auto border-emerald-800 text-[10px] text-emerald-200"
                  >
                    Allowlist match
                  </Badge>
                </div>
              )}

              {allowlisted === false && (
                <p className="text-xs text-amber-200">
                  Not verified: this address is not on the relayer allowlist.
                </p>
              )}
            </CardContent>
          </Card>
        </VerticalStep>

        <VerticalStep
          stepNumber={2}
          title="Blind commitment"
          description="Generate entropy, derive the commitment locally, then sign EIP-712. Only hash + signature reach the relayer."
          state={commitState}
        >
          <Card className="border-slate-800 bg-card/40">
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cid">Candidate id (uint256)</Label>
                  <Input
                    id="cid"
                    className="mt-1 font-mono text-xs"
                    value={candidateId}
                    onChange={(e) => {
                      setCandidateId(e.target.value);
                      setSignature("");
                      setSponsoredComplete(false);
                      setTxHash(null);
                    }}
                    placeholder="e.g. 2"
                    disabled={!allowlisted}
                  />
                </div>
                <div>
                  <Label htmlFor="sec">Secret (bytes32 hex)</Label>
                  <Input
                    id="sec"
                    className="mt-1 font-mono text-[10px]"
                    value={secret}
                    onChange={(e) => {
                      setSecret(e.target.value);
                      setSignature("");
                      setSponsoredComplete(false);
                      setTxHash(null);
                    }}
                    placeholder="Auto or paste 0x…"
                    disabled={!allowlisted}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!allowlisted || busy}
                  onClick={handleGenerateSecret}
                >
                  Generate secret
                </Button>
              </div>

              <div>
                <Label className="text-slate-500">Commitment hash (local)</Label>
                <div className="mt-1 break-all border border-slate-800 bg-slate-950/60 px-2 py-1.5 font-mono text-[10px] text-slate-400 min-h-[2.25rem]">
                  {commitmentLive || "—"}
                </div>
              </div>

              <Separator className="bg-slate-800" />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={!allowlisted || busy || !commitmentLive}
                  onClick={() => void blindedSubmission()}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Blinded submission"
                  )}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  Signs EIP-712, then submits the sponsored relayer transaction.
                </span>
              </div>

              {txHash && (
                <p className="text-[11px] font-mono text-emerald-400 break-all">tx: {txHash}</p>
              )}
              {msg && (
                <p className="text-[11px] text-slate-400" role="status">
                  {msg}
                </p>
              )}
              {signature && !busy && (
                <p className="text-[10px] text-slate-600">
                  Signature captured (deadline unix {sigDeadline}).
                </p>
              )}
            </CardContent>
          </Card>
        </VerticalStep>

        <VerticalStep
          stepNumber={3}
          title="Reveal"
          description="Available only after the on-chain commit window closes. Uses the same candidate id and secret as Phase 2."
          state={revealState}
          isLast
        >
          <Card className="relative overflow-hidden border-slate-800 bg-card/40">
            {!revealOpen && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0F172A]/85 px-4 text-center backdrop-blur-[1px]"
                aria-live="polite"
              >
                <Badge variant="outline" className="border-slate-600 text-slate-200">
                  Commit phase active
                </Badge>
                <p className="max-w-sm text-xs text-slate-400 leading-relaxed">
                  Reveal unlocks when chain time passes the contract&apos;s{" "}
                  <span className="font-mono text-slate-300">commitDeadline</span>.
                  {commitEndsLabel && (
                    <>
                      {" "}
                      Target: <span className="font-mono text-slate-300">{commitEndsLabel}</span>
                    </>
                  )}
                </p>
                {secondsUntilReveal > 0 && (
                  <p className="font-mono text-[11px] text-slate-500">
                    ≈ {secondsUntilReveal}s remaining (chain clock)
                  </p>
                )}
              </div>
            )}

            <CardContent className={`space-y-3 p-4 ${!revealOpen ? "pointer-events-none select-none opacity-40" : ""}`}>
              {!sponsoredComplete && revealOpen && (
                <p className="text-xs text-amber-200">
                  Warning: complete blinded submission first; otherwise the contract has no commitment for this wallet.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Candidate id</Label>
                  <Input
                    readOnly={false}
                    className="mt-1 font-mono text-xs"
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    disabled={!revealOpen}
                  />
                </div>
                <div>
                  <Label>Secret</Label>
                  <Input
                    className="mt-1 font-mono text-[10px]"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    disabled={!revealOpen}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={!revealOpen || busy || !address}
                onClick={() => void doReveal()}
              >
                Reveal vote (wallet gas)
              </Button>

              {getContractAddress() && (
                <p className="text-[10px] text-slate-600">
                  Contract{" "}
                  <span className="font-mono text-slate-500">{getContractAddress()}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </VerticalStep>
      </VerticalStepper>
    </div>
  );
}
