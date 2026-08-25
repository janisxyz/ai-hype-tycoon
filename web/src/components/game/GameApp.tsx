import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { blip, unlockAudio } from "@/game/audio";
import { ENDING_COPY, EVENTS, stageCopy, stageFor } from "@/game/content";
import { writeSave, loadSave } from "@/game/save";
import { useGame } from "@/game/store";
import type { TabId } from "@/game/types";
import { Hud } from "./Hud";
import { HqCard } from "./HqCard";
import { NewsFeed } from "./NewsFeed";
import { OpsPanel, LabPanel, PeoplePanel, ShadowPanel } from "./panels";
import { EventDialog } from "./EventDialog";
import { EndingScreen } from "./EndingScreen";
import { TitleScreen } from "./TitleScreen";

const TABS: { id: TabId; label: string }[] = [
  { id: "ops", label: "Ops" },
  { id: "lab", label: "Lab" },
  { id: "people", label: "People" },
  { id: "shadow", label: "Shadow" },
];

export function GameApp() {
  const state = useGame((s) => s.state);
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);
  const [tab, setTab] = useState<TabId>("ops");
  const [hasSave, setHasSave] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasSave(!!loadSave());
  }, []);

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
        const dayMs = 850;
        while (acc >= dayMs) {
          acc -= dayMs;
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

  if (!mounted) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (!state) {
    return (
      <TitleScreen
        hasSave={hasSave}
        onStart={(name) => {
          unlockAudio();
          useGame.getState().newGame(name);
        }}
        onContinue={() => {
          unlockAudio();
          useGame.getState().continueGame();
        }}
      />
    );
  }

  if (state.ending) {
    const copy = ENDING_COPY[state.ending];
    return (
      <EndingScreen
        ending={state.ending}
        copy={copy}
        company={state.company}
        day={state.day}
        valuation={state.valuation}
        quality={state.quality}
        onAgain={() => {
          useGame.getState().abandon();
          setHasSave(false);
        }}
      />
    );
  }

  const stage = stageFor(state);
  const hq = stageCopy(stage);
  const ev = state.eventId === "acquire-close"
    ? {
        id: "acquire-close",
        title: "The term sheet is real",
        body: `They will pay ${Math.round(state.acquireOffer).toLocaleString("en-US")} and fold ${state.company} into a tooltip. Your garage becomes a slide in someone else's all-hands.`,
        choices: [
          { id: "take", label: "Sign", hint: "Soft landing. Logo dies politely." },
          { id: "walk", label: "Walk", hint: "Stay independent. Burn continues." },
        ],
      }
    : EVENTS.find((e) => e.id === state.eventId);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Hud state={state} />
      <main className="mx-auto grid max-w-6xl gap-4 px-3 pb-28 pt-3 sm:px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pb-10">
        <div className="flex flex-col gap-4">
          <HqCard state={state} hq={hq} />
          <NewsFeed items={state.news} />
        </div>
        <section className="rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="mb-3 flex gap-1 rounded-lg bg-elevated p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-11 flex-1 rounded-md px-2 text-sm font-medium transition-colors duration-150 ${
                  tab === t.id ? "bg-paper text-ink" : "text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "ops" && <OpsPanel state={state} />}
          {tab === "lab" && <LabPanel state={state} />}
          {tab === "people" && <PeoplePanel state={state} />}
          {tab === "shadow" && <ShadowPanel state={state} />}
        </section>
      </main>

      <footer className="hidden px-5 pb-6 text-xs text-subtle lg:flex lg:justify-between">
        <span>Autosaves on this device.</span>
        <Link to="/privacy" className="hover:text-muted">
          Privacy
        </Link>
      </footer>

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
          className="fade-up pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto w-max max-w-[min(92vw,28rem)] rounded-md border border-border bg-elevated px-4 py-2 text-sm text-paper shadow-soft lg:bottom-8"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
