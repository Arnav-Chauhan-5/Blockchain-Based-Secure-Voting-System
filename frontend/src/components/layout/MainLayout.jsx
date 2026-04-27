import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/Navbar";
import { useWallet } from "@/hooks/useWallet";
import { fetchHealth } from "@/services/api";

const routeTitles = {
  "/": "Protocol Overview",
  "/vote": "Voting Booth",
  "/audit": "Transparency Hub",
  "/directory": "Candidate Bureau",
  "/docs": "Technical Library",
};

function crumbsForPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const items = [{ href: "/", label: "Home" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    items.push({ href: acc, label: routeTitles[acc] ?? seg });
  }
  return items;
}

function shortenAddress(addr) {
  if (!addr || addr.length < 12) return addr ?? "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Institutional shell: utility bar (system status + wallet), navbar, breadcrumbs, main, footer.
 */
export function MainLayout() {
  const location = useLocation();
  const crumbs = crumbsForPath(location.pathname);
  const { address, connect, error: walletError } = useWallet();
  const [healthOk, setHealthOk] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      fetchHealth()
        .then((h) => {
          if (!cancelled) setHealthOk(h?.ok === true);
        })
        .catch(() => {
          if (!cancelled) setHealthOk(false);
        });
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const statusLabel =
    healthOk === null ? "Verifying" : healthOk ? "Active" : "Degraded";
  const systemHealthy = healthOk === true;

  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A] text-slate-100">
      <header className="border-b border-slate-800 bg-[#0b1220]">
        {/* Top utility bar */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="font-semibold tracking-wide text-slate-200">BLINDVOTE</span>
            <Separator orientation="vertical" className="hidden h-4 sm:block bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-slate-500">System Status</span>
              <Badge
                variant={systemHealthy ? "default" : "outline"}
                className={
                  healthOk === null
                    ? "border-slate-600 text-slate-300"
                    : systemHealthy
                      ? "border-emerald-800 bg-emerald-950/50 text-emerald-200"
                      : "border-amber-800 text-amber-200"
                }
              >
                {statusLabel}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-sm border border-slate-700 bg-slate-950/40 px-2.5 py-1">
              <span className="text-slate-500">Wallet</span>
              <Separator orientation="vertical" className="h-4 bg-slate-700" />
              {address ? (
                <span className="font-mono text-[11px] text-slate-200" title={address}>
                  {shortenAddress(address)}
                </span>
              ) : (
                <span className="text-slate-500">Not connected</span>
              )}
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => void connect()}>
              {address ? "Reconnect" : "Connect"}
            </Button>
            <span className="hidden text-slate-600 sm:inline">|</span>
            <span className="hidden text-slate-500 sm:inline">{new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>
        {walletError && (
          <div className="border-t border-slate-800/80 bg-slate-950/30 px-4 py-1 text-[11px] text-amber-300">
            {walletError}
          </div>
        )}

        <Navbar />
      </header>

      <div className="border-b border-slate-800 bg-[#0b1220]/50">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <span key={c.href} className="contents">
                  {i > 0 && (
                    <BreadcrumbSeparator className="text-slate-600">
                      <span className="px-0.5">/</span>
                    </BreadcrumbSeparator>
                  )}
                  <BreadcrumbItem>
                    {i === crumbs.length - 1 ? (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={c.href}>{c.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-[#0b1220] text-xs text-slate-500">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-2 font-semibold text-slate-300">Protocol</div>
            <ul className="space-y-1">
              <li>
                <Link className="hover:text-slate-300" to="/">
                  Overview
                </Link>
              </li>
              <li>
                <Link className="hover:text-slate-300" to="/docs">
                  Architecture
                </Link>
              </li>
              <li>
                <Link className="hover:text-slate-300" to="/vote">
                  Voting booth
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-semibold text-slate-300">Transparency</div>
            <ul className="space-y-1">
              <li>
                <Link className="hover:text-slate-300" to="/audit">
                  Ledger & queue
                </Link>
              </li>
              <li>
                <Link className="hover:text-slate-300" to="/directory">
                  Candidates
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-semibold text-slate-300">Compliance notes</div>
            <p className="leading-relaxed">
              Demonstration deployment. Custody, KYC, and jurisdictional requirements are out of scope for this
              scaffold and must be supplied by your institution.
            </p>
          </div>
          <div>
            <div className="mb-2 font-semibold text-slate-300">Build</div>
            <p className="font-mono text-[11px] text-slate-400">portal v0.1.0</p>
            <p className="mt-2 font-mono text-[11px] text-slate-600">Solidity 0.8.24 · Cancun · EIP-712</p>
            <p className="mt-1 font-mono text-[11px] text-slate-600">Hardhat chainId 31337</p>
          </div>
        </div>
        <div className="border-t border-slate-800/80 py-3 text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} BlindVote reference implementation. All rights reserved by deploying
          organization.
        </div>
      </footer>
    </div>
  );
}
