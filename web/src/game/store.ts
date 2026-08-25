import { create } from "zustand";
import {
  burstCloud,
  buyGpu,
  catchUp,
  createGame,
  fakeBenchmark,
  farmWaitlist,
  fire,
  hire,
  pivot,
  raiseRound,
  resolveEvent,
  setSpeed,
  shipDemo,
  startTrain,
  stealPaper,
  tickDays,
} from "./engine";
import { clearSave, loadSave, writeSave } from "./save";
import type { GameState, ModelSpecId, RoleId, Speed } from "./types";

let lastWrite = 0;

function persist(state: GameState) {
  const now = Date.now();
  if (now - lastWrite < 1200) return;
  lastWrite = now;
  writeSave(state);
}

export interface GameStore {
  state: GameState | null;
  toast: string | null;
  boot: () => void;
  newGame: (company: string) => void;
  continueGame: () => boolean;
  abandon: () => void;
  apply: (next: GameState, toast?: string | null) => void;
  tick: (days?: number) => void;
  hire: (role: RoleId) => void;
  fire: (id: string) => void;
  buyGpu: (n?: number) => void;
  burstCloud: () => void;
  train: (id: ModelSpecId) => void;
  demo: (id: string) => void;
  raise: () => void;
  pivot: () => void;
  steal: () => void;
  fake: (id: string) => void;
  farm: () => void;
  choose: (id: string) => void;
  setSpeed: (s: Speed) => void;
  clearToast: () => void;
}

export const useGame = create<GameStore>((set, get) => ({
  state: null,
  toast: null,
  boot: () => {
    const saved = loadSave();
    if (saved && !saved.ending) set({ state: catchUp(saved) });
  },
  newGame: (company) => {
    const state = createGame(company);
    writeSave(state);
    set({ state, toast: "The garage is yours." });
  },
  continueGame: () => {
    const saved = loadSave();
    if (!saved) return false;
    set({ state: catchUp(saved) });
    return true;
  },
  abandon: () => {
    clearSave();
    set({ state: null, toast: null });
  },
  apply: (next, toast) => {
    persist(next);
    set({ state: next, toast: toast ?? get().toast });
  },
  tick: (days = 1) => {
    const cur = get().state;
    if (!cur || cur.ending || cur.eventId) return;
    const next = { ...tickDays(cur, days), lastRealMs: Date.now() };
    persist(next);
    set({ state: next });
  },
  hire: (role) => {
    const cur = get().state;
    if (!cur) return;
    const r = hire(cur, role);
    if (r.blocked) {
      set({ toast: r.blocked });
      return;
    }
    persist(r.state);
    set({ state: r.state, toast: r.toast });
  },
  fire: (id) => {
    const cur = get().state;
    if (!cur) return;
    const r = fire(cur, id);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  buyGpu: (n = 1) => {
    const cur = get().state;
    if (!cur) return;
    const r = buyGpu(cur, n);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  burstCloud: () => {
    const cur = get().state;
    if (!cur) return;
    const r = burstCloud(cur);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  train: (id) => {
    const cur = get().state;
    if (!cur) return;
    const r = startTrain(cur, id);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  demo: (id) => {
    const cur = get().state;
    if (!cur) return;
    const r = shipDemo(cur, id);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  raise: () => {
    const cur = get().state;
    if (!cur) return;
    const r = raiseRound(cur);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  pivot: () => {
    const cur = get().state;
    if (!cur) return;
    const r = pivot(cur);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  steal: () => {
    const cur = get().state;
    if (!cur) return;
    const r = stealPaper(cur);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  fake: (id) => {
    const cur = get().state;
    if (!cur) return;
    const r = fakeBenchmark(cur, id);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  farm: () => {
    const cur = get().state;
    if (!cur) return;
    const r = farmWaitlist(cur);
    persist(r.state);
    set({ state: r.state, toast: r.toast ?? r.blocked });
  },
  choose: (id) => {
    const cur = get().state;
    if (!cur) return;
    const r = resolveEvent(cur, id);
    persist(r.state);
    set({ state: r.state, toast: r.toast });
  },
  setSpeed: (s) => {
    const cur = get().state;
    if (!cur) return;
    const next = setSpeed(cur, s);
    set({ state: next });
  },
  clearToast: () => set({ toast: null }),
}));
