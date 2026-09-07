import { useEffect, useRef, useState } from "react";
import { money } from "@/game/format";

interface Floater {
  id: number;
  text: string;
  tone: "good" | "bad";
  x: number;
}

export function Juice({ cash, rev }: { cash: number; hype?: number; rev: number }) {
  const prev = useRef(cash);
  const [bits, setBits] = useState<Floater[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    const d = cash - prev.current;
    prev.current = cash;
    if (Math.abs(d) < 40) return;
    const id = ++seq.current;
    const bit: Floater = {
      id,
      text: `${d > 0 ? "+" : ""}${money(d)}`,
      tone: d > 0 ? "good" : "bad",
      x: 18 + (id % 5) * 14,
    };
    setBits((b) => [...b.slice(-4), bit]);
    const t = window.setTimeout(() => setBits((b) => b.filter((x) => x.id !== id)), 1600);
    return () => window.clearTimeout(t);
  }, [cash]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-30 h-24 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className={`cash-float absolute font-mono text-sm ${b.tone === "good" ? "text-good" : "text-danger"}`}
          style={{ left: `${b.x}%` }}
        >
          {b.text}
        </span>
      ))}
      {rev > 20 && (
        <span className="sr-only">Daily revenue {money(rev)}</span>
      )}
    </div>
  );
}
