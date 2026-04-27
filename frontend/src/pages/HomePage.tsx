import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Loader2, ShieldCheck, Users, Vote } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchParticipationStats, type ParticipationStats } from "@/services/api";

function formatInt(n: number) {
  return new Intl.NumberFormat().format(n);
}

export function HomePage() {
  const [stats, setStats] = useState<ParticipationStats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchParticipationStats()
        .then((s) => {
          if (!cancelled) {
            setStats(s);
            setStatsErr(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setStatsErr("Stats unavailable (start the relayer API)");
            setStats(null);
          }
        })
        .finally(() => {
          if (!cancelled) setStatsLoading(false);
        });
    };
    load();
    const id = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2 border border-slate-800 bg-card/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">Blind-Sponsor commit–reveal voting</h1>
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            Institutional preview
          </Badge>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Voters bind choices with cryptographic commitments. A designated sponsor pays gas to register commitments while
          remaining blind to plaintext votes. After the commit window, voters reveal locally held secrets so the contract
          can verify and tally—without the sponsor ever learning how anyone voted.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild>
            <Link to="/vote">Enter voting booth</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/audit">Open transparency hub</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/directory">Candidate directory</Link>
          </Button>
        </div>
      </div>

      {/* Live participation hero */}
      <section className="relative overflow-hidden border border-slate-800 bg-gradient-to-br from-[#0b1220] via-[#0F172A] to-slate-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-slate-800/60 opacity-40" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border border-slate-800/40 opacity-30" />
        <div className="relative px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                  Live participation
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  Network pulse
                </h2>
                <p className="mt-1 max-w-xl text-xs text-slate-400 leading-relaxed">
                  Aggregates from the relayer registry and on-chain tallies. Refreshes every 10 seconds while this page
                  is open.
                </p>
              </div>
              {statsLoading && (
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading metrics
                </span>
              )}
            </div>

            {statsErr && (
              <p className="mt-4 text-xs text-amber-300" role="status">
                {statsErr}
              </p>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-slate-800 bg-slate-950/50 px-4 py-5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Total registered voters</span>
                </div>
                <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-slate-50">
                  {stats ? formatInt(stats.totalRegisteredVoters) : statsLoading ? "—" : "0"}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">Allowlist rows in relayer database</p>
              </div>
              <div className="border border-slate-800 bg-slate-950/50 px-4 py-5">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Active commitments</span>
                </div>
                <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-slate-50">
                  {stats ? formatInt(stats.activeCommitments) : statsLoading ? "—" : "0"}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">Queue items pending or confirmed on-chain</p>
              </div>
              <div className="border border-slate-800 bg-slate-950/50 px-4 py-5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Vote className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Verified reveals</span>
                </div>
                <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-slate-50">
                  {stats ? formatInt(stats.verifiedReveals) : statsLoading ? "—" : "0"}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">Sum of on-chain candidate tallies</p>
              </div>
            </div>

            {stats && (
              <p className="mt-4 font-mono text-[10px] text-slate-600">
                Last update {new Date(stats.updatedAt).toISOString().replace("T", " ").slice(0, 19)} UTC
              </p>
            )}
          </div>
        </div>
      </section>

      {/* How it works — plain English */}
      <section>
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-50">How it works</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400 leading-relaxed">
            A three-step flow designed for voters who are not cryptography experts. The system hides your choice until
            you are ready to disclose it publicly on-chain.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-slate-800 bg-card/40">
            <CardHeader className="pb-2">
              <div className="flex h-9 w-9 items-center justify-center border border-slate-600 bg-slate-900 text-sm font-bold text-slate-100">
                1
              </div>
              <CardTitle className="pt-3 text-sm">Prove you are eligible</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Connect a wallet that your institution has pre-approved. Think of it like showing ID at the door—only
                registered participants can move forward.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              No vote is recorded in this step. We only confirm that your address appears on the official allowlist
              maintained by the relayer.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-card/40">
            <CardHeader className="pb-2">
              <div className="flex h-9 w-9 items-center justify-center border border-slate-600 bg-slate-900 text-sm font-bold text-slate-100">
                2
              </div>
              <CardTitle className="pt-3 text-sm">Lock in your choice—without exposing it</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Your computer creates a random secret and combines it with your candidate selection to produce a
                one-way fingerprint. You sign that fingerprint; the sponsor pays the network fee to post it.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              The sponsor sees only the fingerprint, not who you picked. Save your secret somewhere safe—you will need
              it to open your vote later.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-card/40">
            <CardHeader className="pb-2">
              <div className="flex h-9 w-9 items-center justify-center border border-slate-600 bg-slate-900 text-sm font-bold text-slate-100">
                3
              </div>
              <CardTitle className="pt-3 text-sm">Reveal when the commit period ends</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                After the deadline, you publish your candidate and secret. The public ledger checks that they match the
                fingerprint you submitted earlier; if they match, your vote is counted.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Anyone can audit the math. The tally updates transparently while keeping earlier commitments blind until
              you choose to reveal.
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border border-dashed border-slate-800 bg-slate-950/30 px-4 py-3 text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">At a glance</span>
          <Separator orientation="vertical" className="hidden h-4 sm:block bg-slate-700" />
          <span>Eligibility → blind fingerprint → timed reveal → public tally</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm">Phase I — Commit</CardTitle>
            <CardDescription className="text-xs">EIP-712 typed data, relayer broadcast</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            The voter samples a secret, hashes with their candidate identifier, and signs a structured payload. Only
            the hash transits through the sponsor path.
          </CardContent>
        </Card>
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm">Phase II — Reveal</CardTitle>
            <CardDescription className="text-xs">On-chain verification</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            After the commit deadline, the voter discloses the candidate id and secret. The contract recomputes the
            commitment and increments tallies on success.
          </CardContent>
        </Card>
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm">Participation economics</CardTitle>
            <CardDescription className="text-xs">Sponsored commitments</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Commit transactions are submitted by the institutional sponsor key. Voters still perform reveal with their
            own wallets unless a separate sponsorship path is added.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trust posture</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-400">
            <li>Allowlist enforced at the relayer API</li>
            <li>Contract enforces sponsor-only commit ingress</li>
            <li>SQLite audit trail for queue and operator events</li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transparency</div>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            The audit hub streams blinded commitments as they are queued and confirmed. Pair with your block explorer
            for full chain-of-custody review.
          </p>
        </div>
      </div>
    </div>
  );
}
