import { API_BASE } from "@/web3/chain";

function url(path: string) {
  return `${API_BASE}${path}`;
}

export type Health = {
  ok: boolean;
  chainId: number;
  contractConfigured: boolean;
  timestamp: number;
};

export async function fetchHealth(): Promise<Health> {
  const r = await fetch(url("/health"));
  if (!r.ok) throw new Error("health failed");
  return r.json() as Promise<Health>;
}

export async function fetchAllowlisted(address: string): Promise<boolean> {
  const r = await fetch(url(`/api/allowlist/${address}`));
  if (!r.ok) return false;
  const j = (await r.json()) as { allowed?: boolean };
  return Boolean(j.allowed);
}

export async function relayCommit(body: {
  voter: string;
  commitment: string;
  deadline: number;
  signature: string;
}): Promise<{ ok?: boolean; txHash?: string; error?: string; queueId?: number }> {
  const r = await fetch(url("/api/relay/commit"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) return { error: (j as { error?: string }).error ?? r.statusText };
  return j as { ok: boolean; txHash?: string; queueId?: number };
}

export async function fetchCommitQueue() {
  const r = await fetch(url("/api/audit/commits"));
  if (!r.ok) throw new Error("commits audit failed");
  return r.json() as Promise<{
    items: Array<{
      id: number;
      voter_address: string;
      commitment: string;
      deadline: number;
      status: string;
      tx_hash: string | null;
      error: string | null;
      created_at: number;
      updated_at: number;
    }>;
  }>;
}

export type ParticipationStats = {
  totalRegisteredVoters: number;
  activeCommitments: number;
  verifiedReveals: number;
  updatedAt: number;
};

export async function fetchParticipationStats(): Promise<ParticipationStats> {
  const r = await fetch(url("/api/stats"));
  if (!r.ok) throw new Error("stats failed");
  return r.json() as Promise<ParticipationStats>;
}

export async function fetchAuditLogs() {
  const r = await fetch(url("/api/audit/logs"));
  if (!r.ok) throw new Error("logs audit failed");
  return r.json() as Promise<{
    items: Array<{ id: number; event_type: string; payload: string | null; created_at: number }>;
  }>;
}
