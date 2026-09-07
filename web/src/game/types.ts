export const SAVE_VERSION = 2 as const;
export const SAVE_KEY = "ai-hype-tycoon-v2";

export type Speed = 0 | 1 | 2 | 4;
export type Tone = "ok" | "good" | "bad" | "evil";
export type TabId = "floor" | "lab" | "crew" | "market" | "shadow";
export type MarketCycle = "winter" | "quiet" | "boom" | "mania";
export type Stage = "garage" | "loft" | "office" | "warehouse" | "campus" | "tower";
export type Era = "garage" | "startup" | "scale" | "public" | "empire";

export type RoundId =
  | "friends"
  | "preseed"
  | "seed"
  | "a"
  | "b"
  | "c"
  | "ipo"
  | "secondary";

export type EndingId = "bankrupt" | "indicted" | "acquired";

export type RoleId =
  | "researcher"
  | "gpu"
  | "hype"
  | "safety"
  | "mill"
  | "exec"
  | "demo"
  | "legal"
  | "product";

export type ModelSpecId = "toy" | "small" | "mid" | "huge" | "agi" | "titan" | "sovereign";

export interface Employee {
  id: string;
  roleId: RoleId;
  name: string;
  hiredOn: number;
  morale: number;
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
  launched: boolean;
}

export interface Product {
  id: string;
  name: string;
  modelId: string;
  users: number;
  arpu: number;
  quality: number;
}

export interface GpuOrder {
  qty: number;
  remaining: number;
}

export interface Competitor {
  id: string;
  name: string;
  hype: number;
  valuation: number;
  stage: string;
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
  users?: number;
  morale?: number;
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
  publicOnly?: boolean;
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
  products: Product[];
  users: number;
  revenueToday: number;
  listed: boolean;
  stockPrice: number;
  shares: number;
  market: MarketCycle;
  marketDaysLeft: number;
  competitors: Competitor[];
  gpuOrders: GpuOrder[];
  morale: number;
  milestones: string[];
  history: number[];
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
  product: number;
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
  arpu: number;
  unlock: (s: GameState) => boolean;
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
