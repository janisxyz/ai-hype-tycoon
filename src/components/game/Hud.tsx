import { Pause, Play } from "lucide-react";
import { MARKET_COPY } from "@/game/content";
import { derive } from "@/game/engine";
import { compact, money } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState, Speed } from "@/game/types";

const SPEEDS: Speed[] = [0, 1, 2, 4];

export function Hud({ state }: { state: GameState }) {
  const d = derive(state);
  const setSpeed = useGame((s) => s.setSpeed);
  const profit = d.profit;
  const cycle = MARKET_COPY[state.market];
  const runway = d.burn > 0 ? Math.floor(state.cash / d.burn) : 999;
  const runwayPct = Math.max(4, Math.min(100, (runway / 180) * 100));

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-3 sm:px-5">
      <div className="glass hud-bar mx-auto max-w-6xl">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg italic leading-none sm:text-xl">{state.company}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
            <span>Day {state.day}</span>
            <span className="rounded-full border border-gold/30 px-2 py-0.5 text-gold">{cycle.title}</span>
            {state.listed && <span className="text-accent">Public</span>}
          </p>
        </div>
        <Stat k="Cash" v={money(state.cash)} warn={state.cash < d.burn * 14} />
        <Stat k="P&L" v={`${profit >= 0 ? "+" : ""}${money(profit)}`} warn={profit < 0} good={profit > 0} />
        <Stat k="Users" v={compact(state.users)} className="hidden sm:flex" />
        <Stat k="Value" v={money(state.valuation)} className="hidden md:flex" />
        <div className="flex rounded-xl border border-border bg-elevated/80 p-0.5">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-mono text-xs ${
                state.speed === sp ? "bg-paper text-ink" : "text-muted"
              }`}
            >
              {sp === 0 ? <Pause className="h-3.5 w-3.5" /> : sp === 1 ? <Play className="h-3.5 w-3.5" /> : `${sp}x`}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-2 h-1 max-w-6xl overflow-hidden rounded-full bg-elevated/80">
        <div className={`h-full ${runway < 30 ? "bg-danger" : "bg-gold"}`} style={{ width: `${runwayPct}%` }} />
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
      <span className={`tabular text-sm font-medium ${warn ? "text-danger" : good ? "text-good" : "text-paper"}`}>{v}</span>
    </div>
  );
}
