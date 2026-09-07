import { createGame } from "./engine";
import type { GameState } from "./types";
import { SAVE_KEY, SAVE_VERSION } from "./types";

function defaults(partial: Partial<GameState>): GameState {
  return {
    ...createGame(partial.company ?? "Garage Intelligence", partial.seed ?? 1),
    ...partial,
    version: SAVE_VERSION,
  };
}

function migrate(raw: Partial<GameState> & { version?: number }): GameState {
  const s = defaults(raw);
  if (!Array.isArray(s.employees)) s.employees = [];
  s.employees = s.employees.map((e) => ({ ...e, morale: e.morale ?? 70 }));
  if (!Array.isArray(s.models)) s.models = [];
  s.models = s.models.map((m) => ({ ...m, launched: m.launched ?? false }));
  if (!Array.isArray(s.news)) s.news = [];
  if (!Array.isArray(s.products)) s.products = [];
  if (!Array.isArray(s.competitors)) s.competitors = [];
  if (!Array.isArray(s.gpuOrders)) s.gpuOrders = [];
  if (!Array.isArray(s.milestones)) s.milestones = [];
  if (!Array.isArray(s.history)) s.history = [s.valuation];
  if (!s.flags) s.flags = {};
  if (!s.lastRealMs) s.lastRealMs = Date.now();
  if (!s.market) s.market = "quiet";
  if (s.marketDaysLeft == null) s.marketDaysLeft = 40;
  if (s.morale == null) s.morale = 70;
  if (s.shares == null) s.shares = 10_000_000;
  return s;
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem("ai-hype-tycoon-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
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
    localStorage.removeItem("ai-hype-tycoon-v1");
  } catch {
    /* ignore */
  }
}
