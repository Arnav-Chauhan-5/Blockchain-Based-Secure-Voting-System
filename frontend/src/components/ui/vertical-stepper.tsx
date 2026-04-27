import type { ReactNode } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepVisualState = "complete" | "active" | "upcoming" | "locked";

type VerticalStepProps = {
  stepNumber: number;
  title: string;
  description?: string;
  state: StepVisualState;
  isLast?: boolean;
  children: ReactNode;
};

function StepIndicator({
  stepNumber,
  state,
}: {
  stepNumber: number;
  state: StepVisualState;
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center border-2 text-xs font-semibold transition-colors";

  if (state === "complete") {
    return (
      <div
        className={cn(
          base,
          "border-emerald-700 bg-emerald-950/60 text-emerald-200"
        )}
        aria-label={`Step ${stepNumber} complete`}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div
        className={cn(base, "border-slate-700 bg-slate-950/50 text-slate-500")}
        aria-label={`Step ${stepNumber} locked`}
      >
        <Lock className="h-3.5 w-3.5" />
      </div>
    );
  }

  if (state === "active") {
    return (
      <div
        className={cn(
          base,
          "border-slate-200 bg-slate-900 text-slate-50 ring-2 ring-slate-600 ring-offset-2 ring-offset-[#0F172A]"
        )}
        aria-current="step"
      >
        {stepNumber}
      </div>
    );
  }

  return (
    <div
      className={cn(
        base,
        "border-slate-700 bg-transparent text-slate-500"
      )}
    >
      {stepNumber}
    </div>
  );
}

/**
 * Single step row for a vertical stepper (shadcn-styled, institutional).
 */
export function VerticalStep({
  stepNumber,
  title,
  description,
  state,
  isLast,
  children,
}: VerticalStepProps) {
  const dimmed = state === "upcoming" || state === "locked";

  return (
    <div className="relative flex gap-4">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <StepIndicator stepNumber={stepNumber} state={state} />
        {!isLast && (
          <div
            className={cn(
              "mt-2 w-px flex-1 min-h-[12px] bg-slate-800",
              state === "complete" && "bg-emerald-900/50"
            )}
            aria-hidden
          />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 pb-8",
          isLast && "pb-0",
          dimmed && "opacity-60"
        )}
      >
        <div className="mb-2">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function VerticalStepper({ children }: { children: ReactNode }) {
  return <div className="space-y-0">{children}</div>;
}
