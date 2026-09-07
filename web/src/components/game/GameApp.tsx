import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, FlaskConical, Landmark, Skull, Users } from "lucide-react";
import { blip, unlockAudio } from "@/game/audio";
import { DAY_MS, EVENTS, FAIL_COPY, MILESTONE_COPY } from "@/game/content";
import { writeSave, loadSave } from "@/game/save";
import { useGame } from "@/game/store";
import type { TabId } from "@/game/types";
import { Hud } from "./Hud";
import { HqScene } from "./HqScene";
import { FloorPanel, LabPanel, CrewPanel, MarketPanel, ShadowPanel } from "./panels";
import { EventDialog } from "./EventDialog";
import { EndingScreen } from "./EndingScreen";
import { TitleScreen } from "./TitleScreen";
import { Juice } from "./Juice";

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "floor", label: "Floor", icon: Building2 },
  { id: "lab", label: "Lab", icon: FlaskConical },
  { id: "crew", label: "Crew", icon: Users },
  { id: "market", label: "Tape", icon: Landmark },
  { id: "shadow", label: "Shadow", icon: Skull },
];

export function GameApp() {
  const state = useGame((s) => s.state);
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);
  const [tab, setTab] = useState<TabId>("floor");
  const [hasSave, setHasSave] = useState(false);
  const seenMilestones = useRef<Set<string>>(new Set());
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
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
        hasSave={hasSave}
        onStart={(name) => {
          unlockAudio();
          seenMilestones.current = new Set();
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
    const copy = FAIL_COPY[state.ending];
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

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Hud state={state} />
      <Juice cash={state.cash} hype={state.hype} />
      <main className="mx-auto grid max-w-6xl gap-4 px-3 pb-28 pt-3 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:pb-10">
        <HqScene state={state} tab={tab} onTab={setTab} />
        <section className="rounded-xl border border-border bg-surface p-3 sm:p-4">
          <p className="mb-3 hidden font-mono text-[10px] tracking-[0.16em] text-subtle uppercase lg:block">
            {TABS.find((t) => t.id === tab)?.label}
          </p>
          {tab === "floor" && <FloorPanel state={state} />}
          {tab === "lab" && <LabPanel state={state} />}
          {tab === "crew" && <CrewPanel state={state} />}
          {tab === "market" && <MarketPanel state={state} />}
          {tab === "shadow" && <ShadowPanel state={state} />}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-sm lg:hidden">
        <div className="grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] ${
                  on ? "text-paper" : "text-subtle"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <footer className="hidden px-5 pb-6 text-xs text-subtle lg:flex lg:justify-between">
        <span>Autosaves on this device. Timeline never caps.</span>
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

      {banner && (
        <div className="fade-up pointer-events-none fixed inset-x-0 top-20 z-40 mx-auto w-max max-w-[min(92vw,24rem)] rounded-lg border border-sage/40 bg-surface px-4 py-3 text-center shadow-soft">
          <p className="font-display text-xl italic">{banner.title}</p>
          <p className="mt-1 text-xs text-muted">{banner.body}</p>
        </div>
      )}
    </div>
  );
}
