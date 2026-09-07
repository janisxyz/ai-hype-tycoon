import { dateLabel, money } from "@/game/format";
import type { EndingId } from "@/game/types";

export function EndingScreen({
  ending,
  copy,
  company,
  day,
  valuation,
  onAgain,
}: {
  ending: EndingId;
  copy: { title: string; kicker: string; body: string };
  company: string;
  day: number;
  valuation: number;
  quality?: number;
  onAgain: () => void;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <img src="/hq/tower.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-end px-5 pb-12">
        <p className="font-mono text-[11px] tracking-[0.2em] text-paper/70 uppercase">{copy.kicker}</p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95]">{copy.title}</h1>
        <p className="mt-5 max-w-md text-sm text-paper/80">{copy.body}</p>
        <p className="mt-6 font-mono text-xs text-subtle">
          {company} · {money(valuation)} · {dateLabel(day)} · {ending}
        </p>
        <button
          type="button"
          onClick={onAgain}
          className="mt-8 min-h-12 rounded-lg bg-paper px-5 text-sm font-semibold text-ink"
        >
          Another garage
        </button>
      </div>
    </div>
  );
}
