import { useState } from "react";
import { User } from "lucide-react";
import { CANDIDATES, type Candidate } from "@/data/candidates";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function CandidatePhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] w-full items-center justify-center border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-[#0b1220]",
        className
      )}
      aria-hidden
    >
      <div className="flex h-20 w-20 items-center justify-center border border-slate-700 bg-slate-900/80 text-slate-500">
        <User className="h-10 w-10" strokeWidth={1.25} />
      </div>
    </div>
  );
}

function verificationBadgeVariant(status: Candidate["verificationStatus"]) {
  return status === "Registry verified"
    ? "border-emerald-800/80 bg-emerald-950/40 text-emerald-200"
    : "border-amber-800/70 bg-amber-950/30 text-amber-200";
}

export function DirectoryPage() {
  const [manifesto, setManifesto] = useState<Candidate | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-50">Candidate directory</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400 leading-relaxed">
          Formal roster for institutional review. Profiles include registry verification posture and full manifesto text
          on demand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CANDIDATES.map((c) => (
          <Card key={c.id} className="flex flex-col overflow-hidden border-slate-800 bg-card/50 pt-0">
            <CandidatePhotoPlaceholder />
            <CardHeader className="space-y-3 px-4 pb-2 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-slate-50">{c.name}</h2>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Ballot #{c.id} · {c.jurisdiction}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                  #{c.id}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-slate-600 text-[10px] text-slate-200">
                  Party: {c.party}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", verificationBadgeVariant(c.verificationStatus))}
                >
                  {c.verificationStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-3 pt-0">
              <p className="text-xs leading-relaxed text-muted-foreground">{c.summary}</p>
            </CardContent>
            <CardFooter className="border-t border-slate-800 bg-slate-950/30 px-4 py-3">
              <Button type="button" className="w-full" variant="secondary" onClick={() => setManifesto(c)}>
                View manifesto
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={manifesto !== null} onOpenChange={(open) => !open && setManifesto(null)}>
        <DialogContent className="flex max-h-[min(88vh,720px)] flex-col gap-0 p-0 sm:max-w-2xl">
          {manifesto && (
            <>
              <DialogHeader>
                <DialogTitle>{manifesto.name}</DialogTitle>
                <DialogDescription>
                  {manifesto.party} · {manifesto.jurisdiction} · Ballot #{manifesto.id}
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto border-y border-slate-800 px-6 py-4">
                <div className="max-w-none space-y-4 text-sm leading-relaxed text-slate-300">
                  {manifesto.manifesto.split("\n\n").map((para, i) => (
                    <p key={i} className="whitespace-pre-wrap first:mt-0">
                      {para.trim()}
                    </p>
                  ))}
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <p className="text-[10px] text-slate-500">
                  Registry verification:{" "}
                  <span className="font-medium text-slate-400">{manifesto.verificationStatus}</span>
                </p>
                <Button type="button" variant="outline" onClick={() => setManifesto(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
