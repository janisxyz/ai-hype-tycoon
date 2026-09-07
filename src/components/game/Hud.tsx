import { derive } from "@/game/engine";
import { compact, money } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState, Speed } from "@/game/types";

const SPEEDS: Speed[] = [0, 1, 2, 4];

export function Hud({ state }: { state: GameState }) {
  const d = derive(state);
  const setSpeed = useGame((s) => s.setSpeed);
  const profit = d.profit;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-3 sm:px-5">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center gap-3 rounded-xl border border-border bg-bg/70 px-3 py-1.5 shadow-soft backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base italic leading-none sm:text-lg">{state.company}</p>
          <p className="mt-0.5 font-mono text-xs tabular tracking-wide text-subtle uppercase">Day {state.day}</p>
        </div>
        <Stat k="Cash" v={money(state.cash)} warn={state.cash < d.burn * 14} />
        <Stat k="P&L" v={`${profit >= 0 ? "+" : ""}${money(profit)}`} warn={profit < 0} good={profit > 0} />
        <Stat k="Users" v={compact(state.users)} className="hidden sm:flex" />
        <Stat k="Value" v={money(state.valuation)} className="hidden md:flex" />
        <div className="flex rounded-md border border-border bg-surface p-0.5">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className={`h-8 min-w-8 rounded-sm px-2 font-mono text-xs ${
                state.speed === sp ? "bg-paper text-ink" : "text-muted"
              }`}
            >
              {sp === 0 ? "II" : `${sp}x`}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Stat({
  k,
  v,
  warn,
  good,
  className = "",
}: {
  k: string;
  v: string;
  warn?: boolean;
  good?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span className="kicker">{k}</span>
      <span className={`tabular text-sm ${warn ? "text-danger" : good ? "text-good" : "text-paper"}`}>{v}</span>
    </div>
  );
}
