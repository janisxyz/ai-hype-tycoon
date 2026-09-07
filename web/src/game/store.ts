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
  launchProduct,
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
  if (now - lastWrite < 1400) return;
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
  tick: (days?: number) => void;
  hire: (role: RoleId) => void;
  fire: (id: string) => void;
  buyGpu: (n?: number) => void;
  burstCloud: () => void;
  train: (id: ModelSpecId) => void;
  demo: (id: string) => void;
  launch: (id: string) => void;
  raise: () => void;
  pivot: () => void;
  steal: () => void;
  fake: (id: string) => void;
  farm: () => void;
  choose: (id: string) => void;
  setSpeed: (s: Speed) => void;
  clearToast: () => void;
}

function applyResult(
  set: (p: Partial<GameStore>) => void,
  r: { state: GameState; toast: string | null; blocked: string | null },
) {
  if (r.blocked) {
    set({ toast: r.blocked });
    return;
  }
  persist(r.state);
  set({ state: r.state, toast: r.toast });
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
  tick: (days = 1) => {
    const cur = get().state;
    if (!cur || cur.ending || cur.eventId) return;
    const next = { ...tickDays(cur, days), lastRealMs: Date.now() };
    persist(next);
    set({ state: next });
  },
  hire: (role) => {
    const cur = get().state;
    if (cur) applyResult(set, hire(cur, role));
  },
  fire: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, fire(cur, id));
  },
  buyGpu: (n = 1) => {
    const cur = get().state;
    if (cur) applyResult(set, buyGpu(cur, n));
  },
  burstCloud: () => {
    const cur = get().state;
    if (cur) applyResult(set, burstCloud(cur));
  },
  train: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, startTrain(cur, id));
  },
  demo: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, shipDemo(cur, id));
  },
  launch: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, launchProduct(cur, id));
  },
  raise: () => {
    const cur = get().state;
    if (cur) applyResult(set, raiseRound(cur));
  },
  pivot: () => {
    const cur = get().state;
    if (cur) applyResult(set, pivot(cur));
  },
  steal: () => {
    const cur = get().state;
    if (cur) applyResult(set, stealPaper(cur));
  },
  fake: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, fakeBenchmark(cur, id));
  },
  farm: () => {
    const cur = get().state;
    if (cur) applyResult(set, farmWaitlist(cur));
  },
  choose: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, resolveEvent(cur, id));
  },
  setSpeed: (s) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: setSpeed(cur, s) });
  },
  clearToast: () => set({ toast: null }),
}));
