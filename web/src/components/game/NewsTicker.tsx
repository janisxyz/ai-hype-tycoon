import type { NewsItem } from "@/game/types";

const TONE: Record<NewsItem["tone"], string> = {
  ok: "text-muted",
  good: "text-sage",
  bad: "text-danger",
  evil: "text-warn",
};

export function NewsTicker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;
  const shown = items.slice(0, 6);
  return (
    <div className="overflow-hidden border-t border-border bg-bg/75 py-2 backdrop-blur-sm">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap px-4 font-mono text-[11px]">
        {[0, 1].map((copy) => (
          <span key={copy} className="flex gap-8">
            {shown.map((n) => (
              <span key={`${copy}-${n.id}`} className={TONE[n.tone]}>
                D{n.day} · {n.text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
