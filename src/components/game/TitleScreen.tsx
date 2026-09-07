import { useEffect, useState } from "react";
import { COMPANY_SEEDS } from "@/game/content";
import { loadSave } from "@/game/save";
import { dateLabel, money } from "@/game/format";
import type { GameState } from "@/game/types";
import { TitleCampus } from "./CampusMap";

export function TitleScreen({
  onStart,
  onContinue,
}: {
  hasSave?: boolean;
  onStart: (name: string) => void;
  onContinue: () => void;
}) {
  const [saved, setSaved] = useState<GameState | null>(null);
  const [name, setName] = useState(COMPANY_SEEDS[0]!);

  useEffect(() => {
    setName(COMPANY_SEEDS[Math.floor(Math.random() * COMPANY_SEEDS.length)]!);
    setSaved(loadSave());
  }, []);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <TitleCampus />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent pointer-events-none" />
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-between px-5 pb-8 pt-8">
        <div>
          <p className="kicker text-paper/80">Idle campus · 3D</p>
          <h1 className="mt-2 font-display text-4xl leading-[0.95] italic sm:text-5xl">AI Hype Tycoon</h1>
        </div>
        <div>
        <p className="max-w-md text-sm text-paper/80">
          Tap the glowing Lab. Train an 8B. Open Chat. Money starts the same night.
        </p>
        <label className="pointer-events-auto mt-5 block text-xs font-medium tracking-wide text-muted uppercase">
          Company
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            className="mt-2 min-h-12 w-full rounded-lg border border-border bg-surface/90 px-3 font-sans text-base text-fg outline-none focus:border-border-strong"
          />
        </label>
        <div className="pointer-events-auto mt-4 flex flex-col gap-2">
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
              className="min-h-12 rounded-lg border border-border bg-surface/80 px-5 text-sm font-medium text-fg"
            >
              Continue {saved.company}
              <span className="ml-2 text-subtle">
                {dateLabel(saved.day)} · {money(saved.valuation)}
              </span>
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
