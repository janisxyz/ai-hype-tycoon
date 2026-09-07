function Ring({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "paper" | "sage" | "danger" | "warn";
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const stroke =
    tone === "sage"
      ? "var(--color-sage)"
      : tone === "danger"
        ? "var(--color-danger)"
        : tone === "warn"
          ? "var(--color-warn)"
          : "var(--color-paper)";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 56 56" className="h-14 w-14">
        <circle cx="28" cy="28" r={r} fill="none" className="stroke-elevated" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          transform="rotate(-90 28 28)"
        />
        <text x="28" y="31" textAnchor="middle" className="fill-paper" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          {Math.round(v)}
        </text>
      </svg>
      <span className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">{label}</span>
    </div>
  );
}

export function Meters({
  hype,
  quality,
  scandal,
  morale,
}: {
  hype: number;
  quality: number;
  scandal: number;
  morale: number;
}) {
  return (
    <div className="flex justify-around gap-2 rounded-xl border border-border bg-surface/80 px-2 py-3">
      <Ring value={hype} label="Hype" tone="paper" />
      <Ring value={quality} label="Quality" tone="sage" />
      <Ring value={scandal} label="Scandal" tone="danger" />
      <Ring value={morale} label="Morale" tone="warn" />
    </div>
  );
}
