import { useEffect, useRef, useState } from "react";
import { Building2, Cpu, FlaskConical, Skull, Store, Users } from "lucide-react";
import { blip, unlockAudio } from "@/game/audio";
import { DAY_MS, EVENTS, FAIL_COPY, MILESTONE_COPY } from "@/game/content";
import { derive } from "@/game/engine";
import { writeSave } from "@/game/save";
import { useGame } from "@/game/store";
import type { TabId } from "@/game/types";
import { ActionSheet } from "./ActionSheet";
import { CampusMap } from "./CampusMap";
import { EndingScreen } from "./EndingScreen";
import { EventDialog } from "./EventDialog";
import { Hud } from "./Hud";
import { Juice } from "./Juice";
import { TitleScreen } from "./TitleScreen";

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "lab", label: "Lab", icon: FlaskConical },
  { id: "cluster", label: "GPUs", icon: Cpu },
  { id: "store", label: "Sell", icon: Store },
  { id: "crew", label: "Crew", icon: Users },
  { id: "floor", label: "HQ", icon: Building2 },
  { id: "shadow", label: "Dark", icon: Skull },
];

export function GameApp() {
  const state = useGame((s) => s.state);
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);
  const [tab, setTab] = useState<TabId>("lab");
  const [sheet, setSheet] = useState(false);
  const seenMilestones = useRef<Set<string>>(new Set());
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);
  const hadProduct = useRef(false);

  useEffect(() => {
    if (!state) {
      hadProduct.current = false;
      setSheet(false);
      return;
    }
    if (state.products.length > 0 && !hadProduct.current) {
      hadProduct.current = true;
      setSheet(false);
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(clearToast, 2800);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  useEffect(() => {
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const cur = useGame.getState().state;
      if (cur && cur.speed > 0 && !cur.eventId && !cur.ending) {
        acc += dt * 1000 * cur.speed;
        while (acc >= DAY_MS) {
          acc -= DAY_MS;
          useGame.getState().tick(1);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const flush = () => {
      const cur = useGame.getState().state;
      if (cur) writeSave({ ...cur, lastRealMs: Date.now() });
    };
    const onVis = () => {
      if (document.hidden) flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  useEffect(() => {
    if (toast) blip("ok");
  }, [toast]);

  useEffect(() => {
    if (!state) return;
    for (const id of state.milestones) {
      if (seenMilestones.current.has(id)) continue;
      seenMilestones.current.add(id);
      const copy = MILESTONE_COPY[id];
      if (copy) {
        setBanner(copy);
        blip("good");
        window.setTimeout(() => setBanner(null), 3200);
      }
    }
  }, [state]);

  if (!state) {
    return (
      <TitleScreen
        onStart={(name) => {
          unlockAudio();
          seenMilestones.current = new Set();
          useGame.getState().newGame(name);
          setTab("lab");
          setSheet(false);
        }}
        onContinue={() => {
          unlockAudio();
          useGame.getState().continueGame();
        }}
      />
    );
  }

  if (state.ending) {
    const copy = FAIL_COPY[state.ending];
    return (
      <EndingScreen
        ending={state.ending}
        copy={copy}
        company={state.company}
        day={state.day}
        valuation={state.valuation}
        onAgain={() => {
          useGame.getState().abandon();
        }}
      />
    );
  }

  const d = derive(state);
  const ev =
    state.eventId === "acquire-close"
      ? {
          id: "acquire-close",
          title: "The term sheet is real",
          body: `They will pay ${Math.round(state.acquireOffer).toLocaleString("en-US")} and fold ${state.company} into a tooltip. You can walk. The company can keep going.`,
          choices: [
            { id: "take", label: "Sign", hint: "Soft landing. This is an ending." },
            { id: "walk", label: "Walk", hint: "Stay independent. Burn continues." },
          ],
        }
      : EVENTS.find((e) => e.id === state.eventId);

  const open = (id: TabId) => {
    setTab(id);
    setSheet(true);
    blip("ok");
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <CampusMap state={state} selected={sheet ? tab : null} onSelect={open} />
      <Hud state={state} />
      <Juice cash={state.cash} rev={d.revenue} />

      {!sheet && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-2xl px-3">
            <button
              type="button"
              onClick={() => open(d.hintTab)}
              className="pointer-events-auto hint-pulse w-full rounded-lg border border-paper/50 bg-bg/80 px-4 py-3 text-left shadow-soft backdrop-blur-sm"
            >
              <p className="kicker text-paper">Tap the bouncing building</p>
              <p className="mt-0.5 text-sm text-paper">{d.hint}</p>
            </button>
          </div>
          <nav className="pointer-events-auto mt-2 border-t border-border bg-bg/80 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-sm">
            <div className="mx-auto grid max-w-2xl grid-cols-6">
              {TABS.map((t) => {
                const Icon = t.icon;
                const pulse = d.hintTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => open(t.id)}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                      pulse ? "text-accent" : "text-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      <ActionSheet tab={tab} open={sheet} state={state} onClose={() => setSheet(false)} />

      <a href="/privacy" className="absolute bottom-1 right-3 z-10 hidden text-xs text-subtle hover:text-muted lg:block">
        Privacy
      </a>

      {ev && (
        <EventDialog
          title={ev.title}
          body={ev.body}
          choices={ev.choices.map((c) => ({ id: c.id, label: c.label, hint: c.hint }))}
          onPick={(id) => useGame.getState().choose(id)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fade-up pointer-events-none fixed inset-x-0 bottom-36 z-40 mx-auto w-max max-w-[min(92vw,28rem)] rounded-md border border-border bg-elevated px-4 py-2 text-sm text-paper shadow-soft"
        >
          {toast}
        </div>
      )}

      {banner && (
        <div className="fade-up pointer-events-none fixed inset-x-0 top-24 z-40 mx-auto w-max max-w-[min(92vw,24rem)] rounded-lg border border-accent/40 bg-surface px-4 py-3 text-center shadow-soft">
          <p className="font-display text-xl italic">{banner.title}</p>
          <p className="mt-1 text-xs text-muted">{banner.body}</p>
        </div>
      )}
    </div>
  );
}
