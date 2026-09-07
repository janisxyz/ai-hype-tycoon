import { useMemo } from "react";
import type { TabId } from "@/game/types";

const PLOTS: {
  tab: TabId;
  label: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  wall: string;
  side: string;
  roof: string;
}[] = [
  { tab: "lab", label: "Lab", x: -1.15, z: 1.05, w: 78, h: 58, d: 64, wall: "#c4785a", side: "#a8664c", roof: "#b85c48" },
  { tab: "cluster", label: "Cluster", x: 1.2, z: 1.05, w: 92, h: 70, d: 72, wall: "#8b95a3", side: "#6f7884", roof: "#4a5160" },
  { tab: "floor", label: "HQ", x: 0, z: 0, w: 70, h: 36, d: 70, wall: "#efe6d4", side: "#d9d0bc", roof: "#8fad90" },
  { tab: "crew", label: "People", x: -1.15, z: -1.1, w: 80, h: 86, d: 68, wall: "#efe6d4", side: "#d4cbb8", roof: "#6d7c86" },
  { tab: "store", label: "Sell", x: 1.15, z: -1.1, w: 76, h: 54, d: 60, wall: "#d4a574", side: "#b88a5c", roof: "#c45c4a" },
  { tab: "shadow", label: "Dark", x: 1.85, z: 1.85, w: 54, h: 32, d: 48, wall: "#4a4744", side: "#35322f", roof: "#2a2724" },
];

function iso(x: number, z: number) {
  return { left: (x - z) * 74, top: (x + z) * 38 };
}

export function IsoFallback({
  selected,
  onSelect,
  preview,
  company,
}: {
  selected: TabId | null;
  onSelect: (tab: TabId) => void;
  preview?: boolean;
  company?: string;
}) {
  const walkers = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        delay: `${i * 1.1}s`,
        color: i % 3 === 0 ? "#8fad90" : i % 3 === 1 ? "#c4a574" : "#e7e2d6",
      })),
    [],
  );

  return (
    <div className="iso-scene" aria-hidden={preview}>
      <div className={`iso-stage ${preview ? "is-preview" : ""}`}>
        <div className="iso-ground">
          <div className="iso-road iso-road-x" />
          <div className="iso-road iso-road-z" />
          <div className="iso-plaza" />
        </div>
        {PLOTS.map((p) => {
          const pos = iso(p.x, p.z);
          const on = selected === p.tab;
          return (
            <button
              key={p.tab}
              type="button"
              className={`iso-bldg ${on ? "is-on" : ""}`}
              style={
                {
                  "--x": `${pos.left}px`,
                  "--y": `${pos.top}px`,
                  "--w": `${p.w}px`,
                  "--h": `${p.h}px`,
                  "--d": `${p.d}px`,
                  "--wall": p.wall,
                  "--side": p.side,
                  "--roof": p.roof,
                } as React.CSSProperties
              }
              onClick={() => onSelect(p.tab)}
            >
              <span className="iso-left" />
              <span className="iso-right" />
              <span className="iso-top" />
              <span className="iso-tag">{p.label}</span>
            </button>
          );
        })}
        {walkers.map((w) => (
          <span key={w.id} className="iso-walker" style={{ animationDelay: w.delay, background: w.color }} />
        ))}
        {company && <div className="iso-company">{company}</div>}
      </div>
    </div>
  );
}
