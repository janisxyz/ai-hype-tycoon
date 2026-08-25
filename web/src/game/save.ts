import { createGame } from "./engine";
import type { GameState } from "./types";
import { SAVE_KEY, SAVE_VERSION } from "./types";

function defaults(partial: Partial<GameState>): GameState {
  return { ...createGame(partial.company ?? "Garage Intelligence", partial.seed ?? 1), ...partial, version: SAVE_VERSION };
}

function migrate(raw: GameState): GameState {
  const s = defaults(raw);
  if (!Array.isArray(s.employees)) s.employees = [];
  if (!Array.isArray(s.models)) s.models = [];
  if (!Array.isArray(s.news)) s.news = [];
  if (!s.flags) s.flags = {};
  if (!s.lastRealMs) s.lastRealMs = Date.now();
  return s;
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== "object") return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function writeSave(state: GameState): void {
  try {
    const blob = JSON.stringify(state);
    localStorage.setItem(`${SAVE_KEY}__bak`, localStorage.getItem(SAVE_KEY) ?? "");
    localStorage.setItem(SAVE_KEY, blob);
  } catch {
    /* private mode / quota */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function exportSave(state: GameState): string {
  return JSON.stringify(state, null, 2);
}
