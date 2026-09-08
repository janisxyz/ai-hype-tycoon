export function EventDialog({
  title,
  body,
  choices,
  onPick,
}: {
  title: string;
  body: string;
  choices: { id: string; label: string; hint: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 backdrop-blur-[3px] sm:items-center">
      <div className="w-full max-w-lg rounded-[24px] border border-gold/25 bg-surface p-6 shadow-soft">
        <p className="kicker">Term sheet</p>
        <h2 className="mt-2 font-display text-3xl italic leading-tight">{title}</h2>
        <p className="mt-3 text-sm text-muted">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          {choices.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                i === 0
                  ? "border-gold/40 bg-gold text-ink hover:brightness-105"
                  : "border-border bg-elevated hover:border-border-strong"
              }`}
            >
              <span className={`block text-sm font-semibold ${i === 0 ? "text-ink" : "text-paper"}`}>{c.label}</span>
              <span className={`mt-0.5 block text-xs ${i === 0 ? "text-ink/70" : "text-subtle"}`}>{c.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
