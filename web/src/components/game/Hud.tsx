import { dailyBurn } from "@/game/engine";
import { dateLabel, money, pct } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState, Speed } from "@/game/types";

function Chip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">{label}</p>
      <p className={`tabular truncate font-mono text-sm sm:text-[15px] ${warn ? "text-danger" : "text-paper"}`}>
        {value}
      </p>
    </div>
  );
}

export function Hud({ state }: { state: GameState }) {
  const setSpeed = useGame((s) => s.setSpeed);
  const burn = dailyBurn(state);
  const runway = burn > 0 ? Math.floor(state.cash / burn) : 999;
  const speeds: Speed[] = [0, 1, 2, 4];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg italic leading-none">{state.company}</p>
          <p className="mt-1 font-mono text-[11px] text-subtle">{dateLabel(state.day)}</p>
        </div>
        <div className="hidden grid-cols-4 gap-5 sm:grid">
          <Chip label="Cash" value={money(state.cash)} warn={state.cash < burn * 10} />
          <Chip label="Hype" value={pct(state.hype)} />
          <Chip label="Value" value={money(state.valuation)} />
          <Chip label="Runway" value={runway > 800 ? "—" : `${runway}d`} warn={runway < 21} />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-elevated p-1">
          {speeds.map((sp) => (
            <button
              key={sp}
              type="button"
              aria-label={sp === 0 ? "Pause" : `${sp} times speed`}
              onClick={() => setSpeed(sp)}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm px-2 font-mono text-xs ${
                state.speed === sp ? "bg-paper text-ink" : "text-muted"
              }`}
            >
              {sp === 0 ? "II" : `${sp}x`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 border-t border-border px-3 py-2 sm:hidden">
        <Chip label="Cash" value={money(state.cash)} warn={state.cash < burn * 10} />
        <Chip label="Hype" value={pct(state.hype)} />
        <Chip label="Value" value={money(state.valuation)} />
        <Chip label="Runway" value={runway > 800 ? "—" : `${runway}d`} warn={runway < 21} />
      </div>
    </header>
  );
}
