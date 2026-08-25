export const SAVE_VERSION = 1 as const;
export const SAVE_KEY = "ai-hype-tycoon-v1";

export type Speed = 0 | 1 | 2 | 4;
export type Tone = "ok" | "good" | "bad" | "evil";
export type TabId = "ops" | "lab" | "people" | "shadow";

export type RoundId =
  | "friends"
  | "preseed"
  | "seed"
  | "a"
  | "b"
  | "c"
  | "ipo";

export type Stage = "garage" | "loft" | "office" | "warehouse" | "campus" | "tower";

export type EndingId =
  | "ipo"
  | "acquired"
  | "bankrupt"
  | "indicted"
  | "useful"
  | "acquihire"
  | "nationalized";

export type RoleId =
  | "researcher"
  | "gpu"
  | "hype"
  | "safety"
  | "mill"
  | "exec"
  | "demo"
  | "legal";

export type ModelSpecId = "toy" | "small" | "mid" | "huge" | "agi";

export interface Employee {
  id: string;
  roleId: RoleId;
  name: string;
  hiredOn: number;
}

export interface ModelJob {
  specId: ModelSpecId;
  remaining: number;
  total: number;
}

export interface FinishedModel {
  id: string;
  specId: ModelSpecId;
  quality: number;
  shipped: boolean;
  fakeBench: boolean;
}

export interface NewsItem {
  id: string;
  day: number;
  text: string;
  tone: Tone;
}

export interface Effect {
  cash?: number;
  hype?: number;
  quality?: number;
  research?: number;
  compute?: number;
  gpus?: number;
  scandal?: number;
  heat?: number;
  evil?: number;
  waitlist?: number;
  valuationMul?: number;
  flag?: string;
  log?: string;
  logTone?: Tone;
  ending?: EndingId;
  shortageDays?: number;
  acquireOffer?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  hint: string;
  effects: Effect;
}

export interface GameEventDef {
  id: string;
  title: string;
  body: string;
  weight: number;
  minDay?: number;
  require?: (s: GameState) => boolean;
  choices: EventChoice[];
}

export interface GameState {
  version: typeof SAVE_VERSION;
  seed: number;
  rng: number;
  day: number;
  speed: Speed;
  company: string;
  cash: number;
  equity: number;
  hype: number;
  quality: number;
  research: number;
  compute: number;
  gpus: number;
  scandal: number;
  heat: number;
  evil: number;
  valuation: number;
  lastRound: RoundId | null;
  nextRound: RoundId;
  pivots: number;
  lastPivotDay: number;
  gpuShortageUntil: number;
  employees: Employee[];
  training: ModelJob | null;
  models: FinishedModel[];
  demoCooldown: number;
  waitlistCooldown: number;
  stealCooldown: number;
  fakeCooldown: number;
  news: NewsItem[];
  eventId: string | null;
  waitlist: number;
  papersStolen: number;
  fakeBenches: number;
  daysBroke: number;
  flags: Record<string, boolean>;
  ending: EndingId | null;
  acquireOffer: number;
  lastRealMs: number;
}

export interface RoleDef {
  id: RoleId;
  name: string;
  blurb: string;
  signing: number;
  salaryMo: number;
  research: number;
  hype: number;
  quality: number;
  computeEff: number;
  heat: number;
  scandalDecay: number;
  demoBoost: number;
}

export interface ModelSpec {
  id: ModelSpecId;
  name: string;
  blurb: string;
  days: number;
  compute: number;
  researchNeed: number;
  qualityCap: number;
  hypeOnShip: number;
}

export interface RoundDef {
  id: RoundId;
  name: string;
  blurb: string;
  minHype: number;
  minValuation: number;
  raise: number;
  dilution: number;
}

export interface ActionResult {
  state: GameState;
  toast: string | null;
  blocked: string | null;
}
