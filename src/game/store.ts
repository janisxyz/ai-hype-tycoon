import { create } from "zustand";
import {
  advertise,
  burstCloud,
  buyGpu,
  catchUp,
  createGame,
  fakeBenchmark,
  farmWaitlist,
  fire,
  hire,
  launchProduct,
  openChat,
  pivot,
  raiseRound,
  resolveEvent,
  setProductPrice,
  setSpeed,
  setTrainPct,
  shipDemo,
  startTrain,
  stealPaper,
  tickDays,
} from "./engine";
import { clearSave, loadSave, writeSave } from "./save";
import type { GameState, GpuSkuId, ModelClassId, ProductKind, RoleId, Speed } from "./types";

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
  newGame: (company: string) => void;
  continueGame: () => boolean;
  abandon: () => void;
  tick: (days?: number) => void;
  hire: (role: RoleId) => void;
  fire: (id: string) => void;
  buyGpu: (sku: GpuSkuId, n?: number) => void;
  burstCloud: () => void;
  setTrainPct: (n: number) => void;
  train: (id: ModelClassId) => void;
  demo: (id: string) => void;
  launch: (id: string, kind: ProductKind) => void;
  openChat: (id: string) => void;
  advertise: (productId: string, packId: string) => void;
  setPrice: (productId: string, price: number) => void;
  raise: () => void;
  pivot: () => void;
  steal: () => void;
  fake: (id: string) => void;
  farm: () => void;
  choose: (id: string) => void;
  setSpeed: (s: Speed) => void;
  clearToast: () => void;
}

function applyResult(set: (p: Partial<GameStore>) => void, r: { state: GameState; toast: string | null; blocked: string | null }) {
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
  newGame: (company) => {
    const state = createGame(company);
    writeSave(state);
    set({ state, toast: "Tap the glowing Lab. Train. Then open Chat." });
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
  buyGpu: (sku, n = 1) => {
    const cur = get().state;
    if (cur) applyResult(set, buyGpu(cur, sku, n));
  },
  burstCloud: () => {
    const cur = get().state;
    if (cur) applyResult(set, burstCloud(cur));
  },
  setTrainPct: (n) => {
    const cur = get().state;
    if (cur) applyResult(set, setTrainPct(cur, n));
  },
  train: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, startTrain(cur, id));
  },
  demo: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, shipDemo(cur, id));
  },
  launch: (id, kind) => {
    const cur = get().state;
    if (cur) applyResult(set, launchProduct(cur, id, kind));
  },
  openChat: (id) => {
    const cur = get().state;
    if (cur) applyResult(set, openChat(cur, id));
  },
  advertise: (productId, packId) => {
    const cur = get().state;
    if (cur) applyResult(set, advertise(cur, productId, packId));
  },
  setPrice: (productId, price) => {
    const cur = get().state;
    if (cur) applyResult(set, setProductPrice(cur, productId, price));
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
  setSpeed: (speed) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: setSpeed(cur, speed) });
  },
  clearToast: () => set({ toast: null }),
}));
