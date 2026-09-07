export const SAVE_VERSION = 4 as const;
export const SAVE_KEY = "ai-hype-tycoon-v4";

export type Speed = 0 | 1 | 2 | 4;
export type Tone = "ok" | "good" | "bad" | "evil";
export type TabId = "floor" | "lab" | "cluster" | "store" | "crew" | "shadow";
export type MarketCycle = "winter" | "quiet" | "boom" | "mania";
export type Stage = "garage" | "loft" | "office" | "warehouse" | "campus" | "tower";
export type GpuSkuId = "h100" | "b200" | "gb200";
export type ModelClassId = "mini" | "small" | "pro" | "max" | "ultra" | "titan";
export type ProductKind = "chat" | "api" | "enterprise";

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
  | "product"
  | "safety"
  | "mill"
  | "exec"
  | "demo"
  | "legal"
  | "sales";

export interface Employee {
  id: string;
  roleId: RoleId;
  name: string;
  hiredOn: number;
  morale: number;
}

export interface GpuOrder {
  sku: GpuSkuId;
  qty: number;
  remaining: number;
}

export interface ModelJob {
  classId: ModelClassId;
  name: string;
  version: number;
  remaining: number;
  total: number;
}

export interface FinishedModel {
  id: string;
  classId: ModelClassId;
  name: string;
  version: number;
  quality: number;
  shipped: boolean;
  fakeBench: boolean;
  trainedOn: number;
}

export interface Product {
  id: string;
  modelId: string;
  kind: ProductKind;
  name: string;
  users: number;
  price: number;
  quality: number;
  adUntil: number;
  adDaily: number;
}

export interface Competitor {
  id: string;
  name: string;
  hype: number;
  valuation: number;
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
  family: string;
  cash: number;
  equity: number;
  hype: number;
  quality: number;
  research: number;
  compute: number;
  gpus: Record<GpuSkuId, number>;
  trainPct: number;
  gpuOrders: GpuOrder[];
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
  burnToday: number;
  listed: boolean;
  stockPrice: number;
  shares: number;
  market: MarketCycle;
  marketDaysLeft: number;
  competitors: Competitor[];
  morale: number;
  milestones: string[];
  history: number[];
  demoCooldown: number;
  adCooldown: number;
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
  gen: number;
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
  sales: number;
}

export interface GpuSku {
  id: GpuSkuId;
  name: string;
  blurb: string;
  price: number;
  lead: number;
  powerDay: number;
  train: number;
  infer: number;
  unlock: (s: GameState) => boolean;
}

export interface ModelClass {
  id: ModelClassId;
  label: string;
  params: string;
  blurb: string;
  flopNeed: number;
  computeNeed: number;
  researchNeed: number;
  qualityCap: number;
  hypeOnShip: number;
  concurrentPerB200: number;
  tokPerSecPerB200: number;
  minServe: number;
  chatPrice: number;
  apiPrice: number;
  entPrice: number;
  unlock: (s: GameState) => boolean;
}

export interface AdPack {
  id: string;
  name: string;
  blurb: string;
  spend: number;
  users: number;
  days: number;
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

export interface StaffTotals {
  salary: number;
  research: number;
  hype: number;
  quality: number;
  engineer: number;
  researcher: number;
  heat: number;
  scandalDecay: number;
  demo: number;
  product: number;
  sales: number;
  growth: number;
}

export interface Derived {
  stage: Stage;
  payroll: number;
  power: number;
  rent: number;
  burn: number;
  revenue: number;
  profit: number;
  runway: number;
  trainPower: number;
  trainDaysLeft: number | null;
  researcherMul: number;
  engineerMul: number;
  trainShare: number;
  b200eq: number;
  prodB200: number;
  trainB200: number;
  demandB200: number;
  utilProd: number;
  utilTrain: number;
  utilAll: number;
  idleTrain: boolean;
  idleServe: boolean;
  concurrentCap: number;
  concurrentUsed: number;
  tokPerSecCap: number;
  tokPerSecUsed: number;
  latencyMs: number;
  servedFrac: number;
  liveCapMini: number;
  usersFitMini: number;
  usersFitCurrent: number;
  hint: string;
  hintTab: TabId;
}

export interface ActionResult {
  state: GameState;
  toast: string | null;
  blocked: string | null;
}

export interface AdForecast {
  users: number;
  daily: number;
  spend: number;
  days: number;
  extraRev: number;
  cac: number;
}
