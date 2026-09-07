import { familyFrom } from "./content";
import { SAVE_KEY, SAVE_VERSION, type GameState } from "./types";

export function writeSave(state: GameState): void {
  try {
    const payload = { ...state, lastRealMs: Date.now() };
    const json = JSON.stringify(payload);
    localStorage.setItem(`${SAVE_KEY}:bak`, localStorage.getItem(SAVE_KEY) ?? json);
    localStorage.setItem(SAVE_KEY, json);
  } catch {
    /* private mode / quota */
  }
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || parsed.version !== SAVE_VERSION) return null;
    if (!parsed.gpus || typeof parsed.trainPct !== "number") return null;
    parsed.gpus = { h100: parsed.gpus.h100 ?? 0, b200: parsed.gpus.b200 ?? 0, gb200: parsed.gpus.gb200 ?? 0 };
    parsed.products = parsed.products ?? [];
    parsed.models = parsed.models ?? [];
    parsed.gpuOrders = parsed.gpuOrders ?? [];
    parsed.milestones = parsed.milestones ?? [];
    parsed.history = parsed.history ?? [];
    parsed.flags = parsed.flags ?? {};
    if (parsed.company) parsed.family = familyFrom(parsed.company);
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(`${SAVE_KEY}:bak`);
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}
