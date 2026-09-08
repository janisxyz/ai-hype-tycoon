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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2a1c10]/55 p-3 sm:items-center">
      <div className="sheet w-full max-w-lg rounded-3xl p-5">
        <p className="kicker">Decision</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight">{title}</h2>
        <p className="mt-3 text-sm font-bold text-muted">{body}</p>
        <div className="mt-5 flex flex-col gap-2">
          {choices.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="rounded-2xl border-[3px] border-ink px-4 py-3 text-left shadow-[0_4px_0_#2a1c10]"
              style={{ background: i === 0 ? "linear-gradient(180deg,#ffe56a,#ffc21a)" : "#fff8ea" }}
            >
              <span className="block text-sm font-black">{c.label}</span>
              <span className="mt-0.5 block text-xs font-bold text-muted">{c.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
