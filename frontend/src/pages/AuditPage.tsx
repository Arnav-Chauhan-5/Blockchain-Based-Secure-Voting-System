import { useCallback, useEffect, useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCommitQueue, fetchAuditLogs } from "@/services/api";
import { cn } from "@/lib/utils";

type QueueItem = Awaited<ReturnType<typeof fetchCommitQueue>>["items"][number];

function truncateAddress(addr: string) {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTsUtc(ms: number) {
  try {
    return new Date(ms).toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return "—";
  }
}

function OnChainStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "submitted") {
    return (
      <Badge className="border border-emerald-800 bg-emerald-950/60 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
        Confirmed
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge
        variant="outline"
        className="border-slate-600 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-slate-300"
      >
        Pending
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-800/80 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-amber-200"
    >
      Failed
    </Badge>
  );
}

export function AuditPage() {
  const [commits, setCommits] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof fetchAuditLogs>>["items"]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const [c, l] = await Promise.all([fetchCommitQueue(), fetchAuditLogs()]);
      setCommits(c.items);
      setLogs(l.items);
      setLastRefresh(Date.now());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Audit hub</h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400 leading-relaxed">
            Live blinded commitments as they enter the relayer queue. Hashes only — no candidate payloads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading
            </span>
          )}
          {!loading && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Radio className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              Live
              {lastRefresh && (
                <span className="font-mono text-slate-600">
                  · {formatTsUtc(lastRefresh)} UTC
                </span>
              )}
            </span>
          )}
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => void refresh()}>
            Refresh now
          </Button>
        </div>
      </div>

      {err && <p className="text-xs text-amber-300">{err}</p>}

      <Card className="border-slate-800">
        <CardHeader className="space-y-1 border-b border-slate-800 py-3">
          <CardTitle className="text-sm">Commit queue</CardTitle>
          <CardDescription className="text-[11px]">
            High-density feed · {commits.length} row{commits.length === 1 ? "" : "s"} (max 500 from API)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[min(70vh,560px)] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 border-b border-slate-800 bg-[#0b1220] shadow-sm">
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="whitespace-nowrap px-2 py-1.5">#</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Voter</th>
                  <th className="min-w-[200px] px-2 py-1.5">Commitment hash</th>
                  <th className="whitespace-nowrap px-2 py-1.5">Timestamp</th>
                  <th className="whitespace-nowrap px-2 py-1.5">On-chain</th>
                </tr>
              </thead>
              <tbody>
                {commits.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-slate-800/90 align-middle text-[10px] leading-tight text-slate-300",
                      i % 2 === 0 ? "bg-[#0F172A]/40" : "bg-transparent"
                    )}
                  >
                    <td className="whitespace-nowrap px-2 py-1 font-mono text-slate-500">{row.id}</td>
                    <td className="whitespace-nowrap px-2 py-1 font-mono text-slate-200" title={row.voter_address}>
                      {truncateAddress(row.voter_address)}
                    </td>
                    <td className="max-w-[1px] px-2 py-1 font-mono text-[9px] text-slate-400 break-all">
                      {row.commitment}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1 font-mono text-slate-500">
                      {formatTsUtc(row.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1">
                      <OnChainStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
                {commits.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[11px] text-slate-500">
                      No blinded submissions yet. Open the voting dashboard and post a commit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800">
        <CardHeader className="border-b border-slate-800 py-3">
          <CardTitle className="text-sm">Audit log</CardTitle>
          <CardDescription className="text-[11px]">Operator events (same poll interval)</CardDescription>
        </CardHeader>
        <CardContent className="max-h-64 overflow-auto p-0">
          <table className="w-full border-collapse text-left text-[10px]">
            <thead className="sticky top-0 bg-[#0b1220] text-slate-500">
              <tr>
                <th className="px-2 py-1.5 font-medium">id</th>
                <th className="px-2 py-1.5 font-medium">type</th>
                <th className="px-2 py-1.5 font-medium">time</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 40).map((row) => (
                <tr key={row.id} className="border-b border-slate-800/80 text-slate-400">
                  <td className="px-2 py-1 font-mono">{row.id}</td>
                  <td className="px-2 py-1">{row.event_type}</td>
                  <td className="px-2 py-1 font-mono text-slate-500">{formatTsUtc(row.created_at)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-center text-slate-500">
                    No events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
