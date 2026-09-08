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
    <div className="relative min-h-dvh overflow-hidden bg-sky">
      <img src="/hq/tower.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2a1c10] via-[#2a1c10]/55 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-end px-5 pb-12">
        <div className="game-panel">
          <p className="kicker">{copy.kicker}</p>
          <h1 className="mt-2 font-display text-4xl font-black leading-[0.95] sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-md text-sm font-bold text-muted">{copy.body}</p>
          <p className="mt-4 text-xs font-black">
            {company} · {money(valuation)} · {dateLabel(day)} · {ending}
          </p>
          <button type="button" onClick={onAgain} className="game-cta">
            Another garage
          </button>
        </div>
      </div>
    </div>
  );
}
