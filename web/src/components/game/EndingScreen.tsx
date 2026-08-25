import { dateLabel, money, pct } from "@/game/format";
import type { EndingId } from "@/game/types";

export function EndingScreen({
  ending,
  copy,
  company,
  day,
  valuation,
  quality,
  onAgain,
}: {
  ending: EndingId;
  copy: { title: string; kicker: string; body: string };
  company: string;
  day: number;
  valuation: number;
  quality: number;
  onAgain: () => void;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <img
        src={ending === "bankrupt" || ending === "indicted" ? "/hq/garage.jpg" : "/hq/campus.jpg"}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/40" />
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-end px-5 pb-12 pt-16">
        <p className="font-mono text-[11px] tracking-[0.2em] text-paper/70 uppercase">{copy.kicker}</p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95]">{copy.title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-paper/80">{copy.body}</p>
        <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Company</dt>
            <dd>{company}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Last day</dt>
            <dd>{dateLabel(day)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Valuation</dt>
            <dd className="tabular">{money(valuation)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-subtle uppercase">Product quality</dt>
            <dd className="tabular">{pct(quality)}</dd>
          </div>
        </dl>
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
