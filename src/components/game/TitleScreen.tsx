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
    <div className="game-shell bg-bg">
      <div className="game-map">
        <TitleCampus />
      </div>
      <div className="game-hud-col">
        <div>
          <p className="kicker text-paper">3D idle campus</p>
          <h1 className="mt-2 font-display text-4xl leading-[0.95] italic text-paper sm:text-5xl">AI Hype Tycoon</h1>
        </div>
        <div className="game-panel">
          <p className="text-sm text-paper">Tap the bouncing Lab. Open Chat. Money starts tonight.</p>
          <label className="mt-4 block text-xs font-medium tracking-wide text-muted uppercase">
            Company
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              className="game-field"
            />
          </label>
          <button type="button" onClick={() => onStart(name)} className="game-cta">
            Play
          </button>
          {saved && (
            <button
              type="button"
              onClick={onContinue}
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-surface/80 text-sm font-medium text-fg"
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
  );
}
