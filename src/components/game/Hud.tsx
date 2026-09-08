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
  const cards = state.gpus.h100 + state.gpus.b200 + state.gpus.gb200;
  const runway = d.burn > 0 ? Math.floor(state.cash / d.burn) : 999;
  const runwayPct = Math.max(6, Math.min(100, (runway / 180) * 100));

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-2 pt-2 sm:px-4">
      <div className="pointer-events-auto mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <div className="pill min-w-0 flex-1">
          <span className="pill-ico" style={{ background: "#ffe56a" }}>
            🏢
          </span>
          <span className="min-w-0">
            <span className="pill-k truncate">{cycle.title}</span>
            <span className="pill-v block truncate">{state.company}</span>
          </span>
          <span className="ml-auto font-black text-xs">D{state.day}</span>
        </div>
        <div className={`pill ${state.cash < d.burn * 14 ? "is-warn" : ""}`}>
          <span className="pill-ico" style={{ background: "#ffd24a" }}>
            💰
          </span>
          <span>
            <span className="pill-k">Cash</span>
            <span className="pill-v block">{money(state.cash)}</span>
          </span>
        </div>
        <div className={`pill hidden sm:flex ${profit < 0 ? "is-warn" : profit > 0 ? "is-good" : ""}`}>
          <span className="pill-ico" style={{ background: profit >= 0 ? "#7dff9a" : "#ff8a7a" }}>
            {profit >= 0 ? "📈" : "📉"}
          </span>
          <span>
            <span className="pill-k">P&L</span>
            <span className="pill-v block">
              {profit >= 0 ? "+" : ""}
              {money(profit)}
            </span>
          </span>
        </div>
        <div className="pill hidden sm:flex">
          <span className="pill-ico" style={{ background: "#8ec8ff" }}>
            👥
          </span>
          <span>
            <span className="pill-k">Users</span>
            <span className="pill-v block">{compact(state.users)}</span>
          </span>
        </div>
        <div className="pill hidden md:flex">
          <span className="pill-ico" style={{ background: "#7af0e8" }}>
            🖥️
          </span>
          <span>
            <span className="pill-k">GPUs</span>
            <span className="pill-v block">{cards}</span>
          </span>
        </div>
        <div className="pill hidden lg:flex">
          <span className="pill-ico" style={{ background: "#e0b0ff" }}>
            🦄
          </span>
          <span>
            <span className="pill-k">Value</span>
            <span className="pill-v block">{money(state.valuation)}</span>
          </span>
        </div>
        <div className="flex overflow-hidden rounded-full border-[3px] border-ink bg-paper shadow-[0_4px_0_#2a1c10]">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className={`h-10 min-w-10 px-2 text-xs font-black ${
                state.speed === sp ? "bg-gold text-ink" : "bg-transparent text-muted"
              }`}
            >
              {sp === 0 ? "II" : `${sp}×`}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-2 h-3 max-w-6xl overflow-hidden rounded-full border-2 border-ink bg-[#ead7b0]">
        <div className={`h-full ${runway < 30 ? "bg-danger" : "bg-accent"}`} style={{ width: `${runwayPct}%` }} />
      </div>
    </header>
  );
}
