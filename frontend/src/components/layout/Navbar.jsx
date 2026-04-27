import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  ["/", "Overview"],
  ["/vote", "Vote"],
  ["/audit", "Audit"],
  ["/directory", "Directory"],
  ["/docs", "Docs"],
];

/**
 * Primary institutional navigation (sharp borders, high contrast).
 */
export function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-t border-slate-800/80 bg-[#0F172A]" aria-label="Primary">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2 text-xs font-medium">
        {NAV.map(([to, label]) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "px-3 py-1.5 border transition-colors",
                active
                  ? "border-slate-500 bg-slate-900 text-slate-50"
                  : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900/60 hover:text-slate-200"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
