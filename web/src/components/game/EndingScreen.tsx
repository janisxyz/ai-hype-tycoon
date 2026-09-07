import { money } from "@/game/format";

export function EndingScreen({
  copy,
  company,
  day,
  valuation,
  quality,
  onAgain,
}: {
  ending: string;
  copy: { title: string; kicker: string; body: string };
  company: string;
  day: number;
  valuation: number;
  quality: number;
  onAgain: () => void;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <img src="/hq/tower.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col justify-end px-5 pb-12">
        <p className="font-mono text-[11px] tracking-[0.2em] text-subtle uppercase">{copy.kicker}</p>
        <h1 className="mt-3 font-display text-5xl italic leading-none">{copy.title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted">{copy.body}</p>
        <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Day</dt>
            <dd className="font-mono text-paper">{day}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Value</dt>
            <dd className="font-mono text-paper">{money(valuation)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Quality</dt>
            <dd className="font-mono text-paper">{Math.round(quality)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onAgain}
          className="mt-8 min-h-12 rounded-lg bg-paper px-5 text-sm font-semibold text-ink"
        >
          New garage · {company}
        </button>
      </div>
    </div>
  );
}
