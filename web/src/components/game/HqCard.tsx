import { dailyBurn } from "@/game/engine";
import { compact, money, pct } from "@/game/format";
import { ROUNDS } from "@/game/content";
import type { GameState } from "@/game/types";

export function HqCard({
  state,
  hq,
}: {
  state: GameState;
  hq: { title: string; line: string; image: string };
}) {
  const burn = dailyBurn(state);
  const round = ROUNDS.find((r) => r.id === state.nextRound);
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative h-40 sm:h-52">
        <img src={hq.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="font-mono text-[10px] tracking-[0.18em] text-paper/80 uppercase">{hq.title}</p>
          <h2 className="font-display text-2xl italic leading-tight">{state.company}</h2>
        </div>
      </div>
      <p className="px-4 pt-3 text-sm text-muted">{hq.line}</p>
      <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-b-xl bg-border sm:grid-cols-4">
        <Stat k="Burn / day" v={money(burn)} />
        <Stat k="Quality" v={pct(state.quality)} />
        <Stat k="Compute" v={compact(state.compute)} />
        <Stat k="Waitlist" v={compact(state.waitlist)} />
      </dl>
      {round && (
        <p className="px-4 py-3 font-mono text-[11px] text-subtle">
          Next: {round.name} · hype {round.minHype}+ · you own {Math.round(state.equity * 100)}%
        </p>
      )}
    </article>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-elevated px-4 py-3">
      <dt className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">{k}</dt>
      <dd className="tabular mt-1 font-mono text-sm text-paper">{v}</dd>
    </div>
  );
}
