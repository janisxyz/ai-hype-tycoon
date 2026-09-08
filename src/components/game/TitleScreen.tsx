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
    <div className="game-shell">
      <div className="game-map">
        <TitleCampus />
      </div>
      <div className="game-hud-col">
        <div className="game-panel max-w-md">
          <p className="kicker">Idle campus tycoon</p>
          <h1 className="mt-1 font-display text-4xl font-black leading-[0.95] sm:text-5xl">AI Hype Tycoon</h1>
        </div>
        <div className="game-panel max-w-md">
          <p className="text-sm font-extrabold">Tap the bouncing Lab. Open Chat. Cash starts tonight.</p>
          <label className="mt-4 block text-xs font-black tracking-wide text-muted uppercase">
            Company
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              className="game-field"
            />
          </label>
          <button type="button" onClick={() => onStart(name)} className="game-cta">
            Open the garage
          </button>
          {saved && (
            <button type="button" onClick={onContinue} className="game-cta" style={{ background: "linear-gradient(180deg,#8ec8ff,#4aa6ff)" }}>
              Continue {saved.company}
              <span className="ml-2 text-xs">
                {dateLabel(saved.day)} · {money(saved.valuation)}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
