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
        <div className="pointer-events-none">
          <p className="kicker text-gold">Frontier lab · idle campus</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-5xl leading-[0.9] italic text-paper sm:text-6xl">
            AI Hype Tycoon
          </h1>
          <p className="mt-3 max-w-sm text-sm text-paper/75">
            Raise. Hire. Ship vapor. Go public. The tape never ends.
          </p>
        </div>
        <div className="game-panel">
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { k: "01", v: "Raise" },
              { k: "02", v: "Ship" },
              { k: "03", v: "Loot" },
            ].map((item) => (
              <div key={item.k} className="rounded-xl border border-border bg-elevated/70 px-3 py-2">
                <p className="font-mono text-[10px] tracking-[0.16em] text-gold">{item.k}</p>
                <p className="mt-0.5 font-display text-lg italic leading-none text-paper">{item.v}</p>
              </div>
            ))}
          </div>
          <label className="block text-xs font-medium tracking-wide text-muted uppercase">
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
            <button
              type="button"
              onClick={onContinue}
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface/80 text-sm font-medium text-fg"
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
