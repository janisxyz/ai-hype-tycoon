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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 sm:items-center">
      <div className="fade-up w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-soft">
        <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Decision</p>
        <h2 className="mt-2 font-display text-3xl italic leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="min-h-14 rounded-lg border border-border bg-elevated px-4 py-3 text-left transition-colors duration-150 hover:border-border-strong"
            >
              <span className="block text-sm font-medium text-paper">{c.label}</span>
              <span className="mt-0.5 block text-xs text-subtle">{c.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
