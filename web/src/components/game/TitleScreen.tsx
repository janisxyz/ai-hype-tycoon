import { useState } from "react";
import { COMPANY_SEEDS } from "@/game/content";
import { loadSave } from "@/game/save";

export function TitleScreen({
  hasSave,
  onStart,
  onContinue,
}: {
  hasSave: boolean;
  onStart: (name: string) => void;
  onContinue: () => void;
}) {
  const saved = hasSave ? loadSave() : null;
  const [name, setName] = useState(COMPANY_SEEDS[Math.floor(Math.random() * COMPANY_SEEDS.length)]!);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <img
        src="/hq/garage.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-end px-5 pb-10 pt-16 sm:justify-center sm:pb-16">
        <p className="font-mono text-[11px] tracking-[0.22em] text-paper/80 uppercase">From a garage, a round</p>
        <h1 className="mt-3 font-display text-[3.1rem] leading-[0.95] tracking-[-0.03em] italic sm:text-6xl">
          AI Hype Tycoon
        </h1>
        <p className="mt-5 max-w-md text-sm text-paper/80 sm:text-base">
          Raise, hire, train, demo, lie a little. Go public while the product still needs a human behind
          the curtain.
        </p>
        <label className="mt-8 block text-xs font-medium tracking-wide text-muted uppercase">
          Company
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            className="mt-2 min-h-12 w-full rounded-lg border border-border bg-surface/90 px-3 font-sans text-base text-fg outline-none focus:border-border-strong"
          />
        </label>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onStart(name)}
            className="min-h-12 rounded-lg bg-paper px-5 text-sm font-semibold text-ink transition-transform duration-150 active:scale-[0.98]"
          >
            Open the garage
          </button>
          {saved && (
            <button
              type="button"
              onClick={onContinue}
              className="min-h-12 rounded-lg border border-border bg-surface/80 px-5 text-sm font-medium text-fg transition-colors duration-150 hover:border-border-strong"
            >
              Continue {saved.company}
            </button>
          )}
        </div>
        <ul className="mt-8 grid gap-2 text-xs text-muted sm:grid-cols-3">
          <li className="rounded-md border border-border bg-bg/50 px-3 py-2">Fake benchmarks</li>
          <li className="rounded-md border border-border bg-bg/50 px-3 py-2">GPU shortages</li>
          <li className="rounded-md border border-border bg-bg/50 px-3 py-2">Alignment theater</li>
        </ul>
      </div>
    </div>
  );
}
