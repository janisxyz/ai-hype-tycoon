import { useMemo } from "react";
import type { TabId } from "@/game/types";
import { money } from "@/game/format";

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
  { tab: "lab", label: "Lab", x: -1.15, z: 1.05, w: 86, h: 64, d: 70, wall: "#d4785a", side: "#b8664c", roof: "#c45c4a" },
  { tab: "cluster", label: "GPUs", x: 1.2, z: 1.05, w: 98, h: 76, d: 78, wall: "#6a7a88", side: "#55626e", roof: "#3d4a56" },
  { tab: "floor", label: "HQ", x: 0, z: -0.15, w: 74, h: 96, d: 70, wall: "#f2efe6", side: "#d9d0bc", roof: "#5a9e6a" },
  { tab: "crew", label: "People", x: -1.15, z: -1.15, w: 84, h: 90, d: 70, wall: "#efe6d4", side: "#d4cbb8", roof: "#6d7c86" },
  { tab: "store", label: "Shop", x: 1.15, z: -1.15, w: 80, h: 58, d: 64, wall: "#efe6d4", side: "#d4c4a8", roof: "#c45c4a" },
  { tab: "shadow", label: "Dark", x: -2.05, z: 0.15, w: 54, h: 34, d: 48, wall: "#3a3430", side: "#2a2622", roof: "#1c1a16" },
];

function iso(x: number, z: number) {
  return { left: (x - z) * 78, top: (x + z) * 40 };
}

export function IsoFallback({
  selected,
  onSelect,
  preview,
  company,
  hintTab,
  earning,
}: {
  selected: TabId | null;
  onSelect: (tab: TabId) => void;
  preview?: boolean;
  company?: string;
  hintTab?: TabId;
  earning?: number;
}) {
  const walkers = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        delay: `${i * 0.9}s`,
        color: i % 3 === 0 ? "#4a7c59" : i % 3 === 1 ? "#c4785a" : "#f2efe6",
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
          const hint = hintTab === p.tab && !selected;
          return (
            <button
              key={p.tab}
              type="button"
              className={`iso-bldg ${on ? "is-on" : ""} ${hint ? "is-hint" : ""}`}
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
              <span className="iso-tag">{hint ? `Tap ${p.label}` : p.tab === "store" && earning && earning > 8 ? money(earning) + "/d" : p.label}</span>
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
