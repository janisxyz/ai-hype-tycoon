import { useEffect, useRef, useState } from "react";
import { money } from "@/game/format";

type Pop = { id: number; text: string; good: boolean };

export function Juice({ cash, hype }: { cash: number; hype: number }) {
  const prev = useRef({ cash, hype, primed: false });
  const [pops, setPops] = useState<Pop[]>([]);

  useEffect(() => {
    if (!prev.current.primed) {
      prev.current = { cash, hype, primed: true };
      return;
    }
    const dc = cash - prev.current.cash;
    const dh = hype - prev.current.hype;
    prev.current = { cash, hype, primed: true };
    const next: Pop[] = [];
    const id = Date.now();
    if (Math.abs(dc) >= 400) {
      next.push({ id, text: `${dc > 0 ? "+" : ""}${money(dc)}`, good: dc > 0 });
    }
    if (Math.abs(dh) >= 2.5) {
      next.push({ id: id + 1, text: `${dh > 0 ? "+" : ""}${Math.round(dh)} hype`, good: dh > 0 });
    }
    if (!next.length) return;
    setPops((p) => [...p, ...next].slice(-5));
    const t = window.setTimeout(() => {
      setPops((p) => p.filter((x) => !next.some((n) => n.id === x.id)));
    }, 1400);
    return () => window.clearTimeout(t);
  }, [cash, hype]);

  if (!pops.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-24 z-40 flex flex-col items-end gap-1">
      {pops.map((p) => (
        <span key={p.id} className={`cash-pop font-mono text-sm ${p.good ? "text-sage" : "text-danger"}`}>
          {p.text}
        </span>
      ))}
    </div>
  );
}
