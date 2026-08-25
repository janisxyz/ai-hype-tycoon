import { dateLabel } from "@/game/format";
import type { NewsItem } from "@/game/types";

const TONE: Record<NewsItem["tone"], string> = {
  ok: "text-muted",
  good: "text-sage",
  bad: "text-danger",
  evil: "text-warn",
};

export function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Wire</h2>
      <ul className="mt-3 flex max-h-56 flex-col gap-3 overflow-y-auto pr-1 sm:max-h-72">
        {items.length === 0 && <li className="text-sm text-muted">The garage is quiet. For now.</li>}
        {items.map((n) => (
          <li key={n.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
            <p className="font-mono text-[10px] text-subtle">{dateLabel(n.day)}</p>
            <p className={`mt-1 text-sm leading-snug ${TONE[n.tone]}`}>{n.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
