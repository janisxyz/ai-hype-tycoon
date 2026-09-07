import {
  AD_PACKS,
  API_TOK_PER_USER_DAY,
  CHAT_DAU_DIV,
  CHAT_USERS_PER_LIVE,
  COMPANY_SEEDS,
  ENT_DAU_DIV,
  EVENTS,
  FIRST_NAMES,
  GPU_SKUS,
  LAST_NAMES,
  MODEL_CLASSES,
  PEAK_CONC_DIV,
  RIVAL_NAMES,
  ROLES,
  ROUNDS,
  classById,
  cycleMultiple,
  familyFrom,
  headcountCap,
  modelName,
  productName,
  rentPerDay,
  roleById,
  skuById,
  stageFor,
} from "./content";
import { clamp } from "./format";
import type {
  ActionResult,
  AdForecast,
  Derived,
  Effect,
  GameState,
  GpuSkuId,
  ModelClassId,
  Product,
  ProductKind,
  RoleId,
  Speed,
  StaffTotals,
} from "./types";
import { SAVE_VERSION } from "./types";

export const DAY_MS = 3000;
const BROKE_LIMIT = 90;
const HYPE_DECAY = 0.05;

function mix(n: number): [number, number] {
  let a = (n + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const v = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [a, v];
}

function roll(s: GameState): [GameState, number] {
  const [rng, v] = mix(s.rng);
  return [{ ...s, rng }, v];
}

function news(s: GameState, text: string, tone: GameState["news"][number]["tone"] = "ok"): GameState {
  const [n, v] = roll(s);
  const item = { id: `n-${n.day}-${Math.floor(v * 1e9)}`, day: n.day, text, tone };
  return { ...n, news: [item, ...n.news].slice(0, 56) };
}

function mark(s: GameState, id: string): GameState {
  if (s.milestones.includes(id)) return s;
  return { ...s, milestones: [...s.milestones, id] };
}

function gpuCount(s: GameState): number {
  return s.gpus.h100 + s.gpus.b200 + s.gpus.gb200;
}

export function staffTotals(s: GameState): StaffTotals {
  const moraleMul = 0.72 + (s.morale / 100) * 0.4;
  const t: StaffTotals = {
    salary: 0,
    research: 0,
    hype: 0,
    quality: 0,
    engineer: 0,
    researcher: 0,
    heat: 0,
    scandalDecay: 0,
    demo: 0,
    product: 0,
    sales: 0,
    growth: 0,
  };
  for (const e of s.employees) {
    const role = roleById(e.roleId);
    const m = (e.morale / 100) * moraleMul;
    if (e.id !== "founder") t.salary += role.salaryMo;
    t.research += role.research * m;
    t.hype += role.hype * m;
    t.quality += role.quality * m;
    t.engineer += role.computeEff;
    t.heat += role.heat;
    t.scandalDecay += role.scandalDecay;
    t.demo += role.demoBoost;
    t.product += role.product * m;
    t.sales += role.sales * m;
    if (role.id === "researcher" || role.id === "mill") t.researcher += m;
    if (role.id === "hype") t.growth += m;
  }
  return t;
}

export function clusterPower(s: GameState) {
  const t = staffTotals(s);
  const eng = 1 + t.engineer;
  let trainRaw = 0;
  let inferB200 = 0;
  let power = 0;
  for (const sku of GPU_SKUS) {
    const n = s.gpus[sku.id];
    trainRaw += n * sku.train;
    inferB200 += n * sku.infer;
    power += n * sku.powerDay;
  }
  const share = clamp(s.trainPct / 100, 0, 1);
  const researcherMul = 1 + t.researcher * 0.35;
  const trainPower = trainRaw * share * eng * researcherMul;
  const prodB200 = inferB200 * (1 - share) * eng;
  const trainB200 = inferB200 * share;
  return { trainRaw, trainPower, inferB200, prodB200, trainB200, power, eng, researcherMul, share };
}

export function productLoad(s: GameState, p: Product) {
  return productDemandB200(s, p);
}

function productDemandB200(s: GameState, p: Product): { b200: number; concurrent: number; tokPerSec: number } {
  const model = s.models.find((m) => m.id === p.modelId);
  const cls = classById(model?.classId ?? "mini");
  if (p.kind === "api") {
    const tokDay = p.users * API_TOK_PER_USER_DAY * (0.65 + p.quality / 180);
    const tokPerSec = tokDay / 86400;
    const b200 = tokPerSec / Math.max(40, cls.tokPerSecPerB200);
    return { b200, concurrent: tokPerSec / 22, tokPerSec };
  }
  const dau = p.users / (p.kind === "enterprise" ? ENT_DAU_DIV : CHAT_DAU_DIV);
  const concurrent = dau / PEAK_CONC_DIV;
  const b200 = concurrent / Math.max(1, cls.concurrentPerB200);
  return { b200, concurrent, tokPerSec: concurrent * 18 };
}

export function servingCapacity(s: GameState, classId: ModelClassId = "mini") {
  const c = clusterPower(s);
  const cls = classById(classId);
  const live = c.prodB200 * cls.concurrentPerB200;
  const users = live * CHAT_USERS_PER_LIVE;
  const tokS = c.prodB200 * cls.tokPerSecPerB200;
  return { live, users, tokS, b200: c.prodB200 };
}

export function derive(s: GameState): Derived {
  const t = staffTotals(s);
  const c = clusterPower(s);
  const stage = stageFor(s);
  const rent = rentPerDay(stage);
  const payroll = t.salary / 30;
  const burn = payroll + c.power + rent;
  let demandB200 = 0;
  let concurrentUsed = 0;
  let tokUsed = 0;
  let concurrentCap = 0;
  let tokCap = 0;
  for (const p of s.products) {
    const d = productDemandB200(s, p);
    demandB200 += d.b200;
    concurrentUsed += d.concurrent;
    tokUsed += d.tokPerSec;
  }
  if (s.products.length === 0) {
    concurrentCap = c.prodB200 * 520;
    tokCap = c.prodB200 * 9000;
  } else {
    let mixLive = 0;
    let mixTok = 0;
    for (const p of s.products) {
      const model = s.models.find((m) => m.id === p.modelId);
      const cls = classById(model?.classId ?? "mini");
      mixLive += cls.concurrentPerB200;
      mixTok += cls.tokPerSecPerB200;
    }
    mixLive /= s.products.length;
    mixTok /= s.products.length;
    concurrentCap = c.prodB200 * mixLive;
    tokCap = c.prodB200 * mixTok;
  }
  const utilProd = c.prodB200 < 0.04 ? (demandB200 > 0.02 ? 1.4 : 0) : demandB200 / Math.max(0.04, c.prodB200);
  const utilTrain = s.training ? (c.trainPower > 0.04 ? 1 : 0) : 0;
  const cards = gpuCount(s);
  const utilAll = cards === 0 ? 0 : (s.trainPct / 100) * utilTrain + (1 - s.trainPct / 100) * clamp(utilProd, 0, 1.4);
  const servedFrac = utilProd <= 1 ? 1 : 1 / utilProd;
  const latencyMs = utilProd < 0.55 ? 90 : utilProd < 0.85 ? 160 : utilProd < 1 ? 380 : 380 + (utilProd - 1) * 2400;
  const revenue = dailyRevenue(s, servedFrac);
  const profit = revenue - burn;
  const runway = burn <= 0 ? 999 : Math.max(0, Math.floor(s.cash / burn));
  const trainDaysLeft = s.training ? Math.max(1, Math.ceil(s.training.remaining / Math.max(0.08, c.trainPower))) : null;
  const liveCapMini = c.prodB200 * 520;
  const usersFitMini = liveCapMini * CHAT_USERS_PER_LIVE;
  const usersFitCurrent = concurrentCap * CHAT_USERS_PER_LIVE;
  const idleTrain = !s.training && s.trainPct > 8;
  const idleServe = s.products.length === 0 && s.trainPct < 92;

  let hint = "Tap the bouncing Lab. Open Chat. Money starts.";
  let hintTab: Derived["hintTab"] = "lab";
  if (s.training) {
    hint =
      c.trainPower < 0.08
        ? "Slide GPUs toward Train — the job is starved."
        : `${s.training.name} is cooking · ~${trainDaysLeft}d.`;
    hintTab = c.trainPower < 0.08 ? "cluster" : "lab";
  } else if (s.models.length === 0) {
    hint = "Tap the bouncing Lab. Train your first 8B.";
    hintTab = "lab";
  } else if (s.products.length === 0) {
    hint = "Your 8B is ready. Tap Lab, then Open Chat.";
    hintTab = "lab";
  } else if (s.trainPct > 78 && demandB200 > 0.05) {
    hint = "Chat is live but racks are training. Tap GPUs → Serve.";
    hintTab = "cluster";
  } else if (c.prodB200 < 0.05 && s.products.length > 0) {
    hint = "Nothing is serving. Tap GPUs and slide toward Serve.";
    hintTab = "cluster";
  } else if (utilProd > 1.05) {
    hint = `Cluster is full (${Math.round(utilProd * 100)}%). Buy another card.`;
    hintTab = "cluster";
  } else if (revenue < burn * 0.4 && s.products.length > 0) {
    hint = "Tap Shop and run ads. More users, more rent.";
    hintTab = "store";
  } else if (s.cash < burn * 18 && s.nextRound) {
    hint = `Runway ${runway}d. Tap HQ and raise.`;
    hintTab = "floor";
  } else if (s.products.length > 0 && s.models.every((m) => m.classId === "mini") && s.research >= 18) {
    hint = "You're making money. Tap Lab and train a 13B.";
    hintTab = "lab";
  } else {
    hint = profit >= 0 ? "You're making money. Buy GPUs or hire." : "Tap Shop, run ads, watch the till.";
    hintTab = profit >= 0 ? "cluster" : "store";
  }

  return {
    stage,
    payroll,
    power: c.power,
    rent,
    burn,
    revenue,
    profit,
    runway,
    trainPower: c.trainPower,
    trainDaysLeft,
    researcherMul: c.researcherMul,
    engineerMul: c.eng,
    trainShare: c.share,
    b200eq: c.inferB200,
    prodB200: c.prodB200,
    trainB200: c.trainB200,
    demandB200,
    utilProd,
    utilTrain,
    utilAll,
    idleTrain,
    idleServe,
    concurrentCap,
    concurrentUsed,
    tokPerSecCap: tokCap,
    tokPerSecUsed: tokUsed,
    latencyMs,
    servedFrac,
    liveCapMini,
    usersFitMini,
    usersFitCurrent,
    hint,
    hintTab,
  };
}

function payingFrac(p: Product, t: StaffTotals, s: GameState): number {
  const model = s.models.find((m) => m.id === p.modelId);
  const cls = classById(model?.classId ?? "mini");
  const q = p.quality / 100;
  const ref = p.kind === "api" ? cls.apiPrice : p.kind === "enterprise" ? cls.entPrice : cls.chatPrice;
  const priceMul = clamp(Math.pow(ref / Math.max(0.08, p.price), 0.55), 0.4, 1.7);
  if (p.kind === "chat") return clamp((0.16 + q * 0.18 + t.product * 0.05 + s.hype / 500) * priceMul, 0.1, 0.42);
  if (p.kind === "api") return 1;
  return clamp((0.72 + t.sales * 0.08 + q * 0.1) * Math.min(1.15, priceMul), 0.35, 1);
}

export function dailyRevenue(s: GameState, servedFrac = 1): number {
  if (s.products.length === 0) return 0;
  const t = staffTotals(s);
  let sum = 0;
  for (const p of s.products) {
    const serve = servedFrac;
    const users = p.users * serve;
    if (p.kind === "chat") {
      sum += users * payingFrac(p, t, s) * p.price / 30;
    } else if (p.kind === "api") {
      const tokDay = users * API_TOK_PER_USER_DAY * (0.65 + p.quality / 180);
      sum += (tokDay / 1_000_000) * p.price;
    } else {
      sum += users * payingFrac(p, t, s) * p.price / 30;
    }
  }
  return sum * (0.82 + s.quality / 400 + t.product * 0.12);
}

export function valuationOf(s: GameState): number {
  const arr = dailyRevenue(s) * 365;
  const multiple = cycleMultiple(s.market) * (1 + s.hype / 240) * (1 - s.scandal / 280) * (s.listed ? 0.86 : 1);
  const cards = gpuCount(s);
  const narrative = s.hype * 16_000 + s.models.length * 220_000 + cards * 28_000 + s.users * 18;
  const cash = Math.max(0, s.cash) * 0.5;
  const listed = s.listed ? s.stockPrice * s.shares : 0;
  const priv = Math.max(90_000, arr * Math.max(5, multiple) + narrative + cash);
  return s.listed ? Math.max(priv * 0.4, listed) : priv;
}

export function createGame(company: string, seed = Math.floor(Math.random() * 1e9) + 1): GameState {
  const name = company.trim() || COMPANY_SEEDS[seed % COMPANY_SEEDS.length]!;
  const family = familyFrom(name);
  const rivals = RIVAL_NAMES.map((n, i) => ({
    id: `riv-${i}`,
    name: n,
    hype: 6 + ((seed >> (i * 3)) % 12),
    valuation: 400_000 + ((seed >> (i * 5)) % 900_000),
  }));
  let s: GameState = {
    version: SAVE_VERSION,
    seed,
    rng: seed,
    day: 0,
    speed: 1,
    company: name,
    family,
    cash: 500_000,
    equity: 1,
    hype: 12,
    quality: 12,
    research: 48,
    compute: 80,
    gpus: { h100: 2, b200: 0, gb200: 0 },
    trainPct: 35,
    gpuOrders: [],
    scandal: 0,
    heat: 2,
    evil: 0,
    valuation: 280_000,
    lastRound: null,
    nextRound: "friends",
    pivots: 0,
    lastPivotDay: -90,
    gpuShortageUntil: 0,
    employees: [{ id: "founder", roleId: "researcher", name: "You", hiredOn: 0, morale: 80 }],
    training: null,
    models: [
      {
        id: "m-founding",
        classId: "mini",
        name: modelName(family, classById("mini"), 1),
        version: 1,
        quality: 32,
        shipped: false,
        fakeBench: false,
        trainedOn: 0,
      },
    ],
    products: [],
    users: 0,
    revenueToday: 0,
    burnToday: 0,
    listed: false,
    stockPrice: 0,
    shares: 10_000_000,
    market: "quiet",
    marketDaysLeft: 48,
    competitors: rivals,
    morale: 76,
    milestones: [],
    history: [],
    demoCooldown: 0,
    adCooldown: 0,
    stealCooldown: 0,
    fakeCooldown: 0,
    news: [],
    eventId: null,
    waitlist: 900,
    papersStolen: 0,
    fakeBenches: 0,
    daysBroke: 0,
    flags: {},
    ending: null,
    acquireOffer: 0,
    lastRealMs: Date.now(),
    gen: 0,
  };
  s = news(s, `${s.company} opens on a green lot. An 8B is already on disk.`);
  s = news(s, "Tap the bouncing Lab. Open Chat. Watch the till fill.", "good");
  return { ...s, valuation: valuationOf(s) };
}

export function applyEffect(state: GameState, fx: Effect): GameState {
  let s: GameState = {
    ...state,
    cash: state.cash + (fx.cash ?? 0),
    hype: clamp(state.hype + (fx.hype ?? 0), 0, 100),
    quality: clamp(state.quality + (fx.quality ?? 0), 0, 100),
    research: Math.max(0, state.research + (fx.research ?? 0)),
    compute: Math.max(0, state.compute + (fx.compute ?? 0)),
    scandal: clamp(state.scandal + (fx.scandal ?? 0), 0, 100),
    heat: clamp(state.heat + (fx.heat ?? 0), 0, 100),
    evil: Math.max(0, state.evil + (fx.evil ?? 0)),
    waitlist: Math.max(0, state.waitlist + (fx.waitlist ?? 0)),
    morale: clamp(state.morale + (fx.morale ?? 0), 0, 100),
  };
  if (fx.gpus) s = { ...s, gpus: { ...s.gpus, h100: s.gpus.h100 + fx.gpus } };
  if (fx.users) {
    if (s.products.length) {
      const add = Math.floor(fx.users / s.products.length);
      s = { ...s, products: s.products.map((p) => ({ ...p, users: p.users + add })), users: s.users + fx.users };
    } else s = { ...s, waitlist: s.waitlist + fx.users };
  }
  if (fx.valuationMul) s = { ...s, valuation: Math.max(0, s.valuation * fx.valuationMul) };
  if (fx.shortageDays) s = { ...s, gpuShortageUntil: Math.max(s.gpuShortageUntil, s.day + fx.shortageDays) };
  if (fx.log) s = news(s, fx.log, fx.logTone ?? "ok");
  if (fx.ending) s = { ...s, ending: fx.ending, speed: 0 };
  if (fx.acquireOffer) {
    const offer = s.valuation * (0.9 + s.hype / 400);
    s = { ...s, acquireOffer: offer, eventId: "acquire-close", speed: 0 };
  }
  return s;
}

function tickProducts(s: GameState): GameState {
  const t = staffTotals(s);
  const d0 = derive(s);
  if (s.products.length === 0) {
    const organic = s.waitlist * 0.006 + s.hype * 0.8;
    return { ...s, waitlist: Math.floor(s.waitlist + organic), users: 0, revenueToday: 0 };
  }
  const served = d0.servedFrac;
  const churn = clamp(0.004 - s.quality / 2600 + s.scandal / 3800 + (d0.latencyMs > 500 ? 0.01 : 0) - t.product * 0.002, 0.0008, 0.03);
  const growth = 0.022 + s.hype / 4000 + t.product * 0.006 + t.sales * 0.004 + t.growth * 0.008;
  let wait = s.waitlist;
  const products = s.products.map((p) => {
    const convert = Math.min(wait * (0.028 + s.hype / 1800 + (p.adUntil > s.day ? 0.03 : 0)), wait * 0.18);
    wait -= convert;
    const inbound = p.adUntil > s.day ? p.adDaily : Math.max(120, Math.floor(80 + s.hype * 1.4 + t.growth * 8));
    const nextUsers = Math.max(0, Math.floor(p.users * (1 + growth - churn) * (0.82 + 0.18 * served) + convert + inbound));
    return { ...p, users: nextUsers };
  });
  wait = Math.max(0, Math.floor(wait + s.hype * 0.8 + t.growth * 10));
  const users = products.reduce((a, p) => a + p.users, 0);
  const next = { ...s, products, users, waitlist: wait };
  const rev = dailyRevenue(next, derive(next).servedFrac);
  return { ...next, revenueToday: rev };
}

function tickTraining(s: GameState): GameState {
  if (!s.training) {
    const c = clusterPower(s);
    return { ...s, compute: s.compute + c.trainPower * 0.9 };
  }
  const c = clusterPower(s);
  if (c.trainPower < 0.06) {
    if (s.day % 6 === 0) return news(s, "Training is starved of silicon. Slide the cluster toward training.", "bad");
    return s;
  }
  const rem = s.training.remaining - c.trainPower;
  if (rem > 0) return { ...s, training: { ...s.training, remaining: rem }, compute: s.compute + c.trainPower * 0.15 };
  const cls = classById(s.training.classId);
  const ratio = Math.min(1, s.research / Math.max(1, cls.researchNeed));
  const q = clamp(
    cls.qualityCap * 0.32 + s.quality * 0.28 + ratio * 18 + c.researcherMul * 5 + (s.training.version - 1) * 2.4,
    6,
    cls.qualityCap,
  );
  const model = {
    id: `m-${s.day}-${s.training.classId}-${s.gen}`,
    classId: s.training.classId,
    name: s.training.name,
    version: s.training.version,
    quality: q,
    shipped: false,
    fakeBench: false,
    trainedOn: s.day,
  };
  let out = news(
    {
      ...s,
      models: [...s.models, model],
      training: null,
      research: Math.max(0, s.research - cls.researchNeed * 0.12),
      quality: clamp(s.quality + 1.4, 0, 100),
    },
    `${model.name} finished. Tap Open Chat — that is the till.`,
    "good",
  );
  out = mark(out, "first_model");
  return out;
}

function tickMarket(s: GameState): GameState {
  if (s.marketDaysLeft > 1) return { ...s, marketDaysLeft: s.marketDaysLeft - 1 };
  const [n, v] = roll(s);
  let next: GameState["market"] = n.market;
  if (n.market === "mania") next = v < 0.7 ? "boom" : "winter";
  else if (n.market === "boom") next = v < 0.45 ? "mania" : v < 0.75 ? "quiet" : "winter";
  else if (n.market === "quiet") next = v < 0.35 ? "boom" : v < 0.78 ? "quiet" : "winter";
  else next = v < 0.55 ? "quiet" : "winter";
  const dur = 40 + Math.floor(v * 70);
  let out: GameState = { ...n, market: next, marketDaysLeft: dur };
  if (next !== s.market) out = news(out, `Tape shift: ${next}.`, next === "winter" ? "bad" : "ok");
  return out;
}

function tickRivals(s: GameState): GameState {
  const [n, r] = roll(s);
  let out: GameState = {
    ...n,
    competitors: n.competitors.map((c, i) => {
      const drift = (r - 0.45) * 0.4 + i * 0.05;
      const hype = clamp(c.hype + drift, 2, 96);
      const g = 1 + (n.market === "mania" ? 0.012 : n.market === "boom" ? 0.007 : n.market === "winter" ? -0.004 : 0.002);
      return { ...c, hype, valuation: Math.max(120_000, c.valuation * g * (1 + hype / 800)) };
    }),
  };
  if (out.day > 20 && out.day % 37 === 0 && out.competitors.length) {
    const rival = out.competitors[out.day % out.competitors.length]!;
    out = news(out, `${rival.name} just raised into the same tape.`);
  }
  return out;
}

function fails(s: GameState): GameState {
  if (s.ending) return s;
  if (s.scandal >= 96 && s.evil >= 52) return { ...s, ending: "indicted", speed: 0 };
  if (s.cash < 0) {
    const broke = s.daysBroke + 1;
    return broke >= BROKE_LIMIT ? { ...s, daysBroke: broke, ending: "bankrupt", speed: 0 } : { ...s, daysBroke: broke };
  }
  return { ...s, daysBroke: 0 };
}

function maybeEvent(state: GameState): GameState {
  if (state.eventId || state.ending) return state;
  if (state.day < 12 || state.day % 18 !== 0) return state;
  const [s0, r] = roll(state);
  const chance = 0.22 + s0.evil * 0.002 + s0.hype * 0.001 + s0.scandal * 0.0015;
  if (r > chance) return s0;
  const eligible = EVENTS.filter((ev) => {
    if (s0.day < (ev.minDay ?? 0)) return false;
    if (ev.require && !ev.require(s0)) return false;
    if (ev.publicOnly && !s0.listed) return false;
    if (["gpu-shortage", "cloud-bill", "earnings"].includes(ev.id)) return true;
    return !s0.flags[`ev-${ev.id}`];
  });
  if (!eligible.length) return s0;
  const sum = eligible.reduce((a, e) => a + e.weight, 0);
  const [s1, pick] = roll(s0);
  let cursor = pick * sum;
  let chosen = eligible[0]!;
  for (const ev of eligible) {
    cursor -= ev.weight;
    if (cursor <= 0) {
      chosen = ev;
      break;
    }
  }
  return { ...s1, eventId: chosen.id, speed: 0, flags: { ...s1.flags, [`ev-${chosen.id}`]: true } };
}

export function tickDay(state: GameState): GameState {
  if (state.ending || state.eventId) return state;
  let s: GameState = { ...state, day: state.day + 1 };
  const t = staffTotals(s);

  const arrived = s.gpuOrders.filter((o) => o.remaining <= 1);
  const pending = s.gpuOrders.map((o) => ({ ...o, remaining: o.remaining - 1 })).filter((o) => o.remaining > 0);
  if (arrived.length) {
    const gpus = { ...s.gpus };
    for (const o of arrived) gpus[o.sku] += o.qty;
    const n = arrived.reduce((a, o) => a + o.qty, 0);
    s = news({ ...s, gpus, gpuOrders: pending }, `${n} accelerator${n > 1 ? "s" : ""} landed.`, "good");
  } else s = { ...s, gpuOrders: pending };

  const shortage = s.day < s.gpuShortageUntil;
  const c = clusterPower(s);
  s = {
    ...s,
    compute: s.compute + (shortage ? c.trainPower * 0.3 : 0),
    research: s.research + t.research,
    hype: clamp(s.hype + t.hype - HYPE_DECAY - s.scandal * 0.012, 0, 100),
    quality: clamp(s.quality + t.quality * 0.16, 0, 100),
    heat: clamp(s.heat + t.heat * 0.2 - 0.04, 0, 100),
    scandal: clamp(s.scandal - t.scandalDecay * 0.18 - 0.05, 0, 100),
    morale: clamp(s.morale + (s.cash > 0 ? 0.04 : -0.12), 0, 100),
    demoCooldown: Math.max(0, s.demoCooldown - 1),
    adCooldown: Math.max(0, s.adCooldown - 1),
    stealCooldown: Math.max(0, s.stealCooldown - 1),
    fakeCooldown: Math.max(0, s.fakeCooldown - 1),
  };

  s = tickTraining(s);
  s = tickProducts(s);
  const d = derive(s);
  s = { ...s, cash: s.cash + s.revenueToday - d.burn, burnToday: d.burn };
  if (s.revenueToday > 4) s = mark(s, "first_rev");
  if (s.users >= 1_000_000) s = mark(s, "million_users");

  s = tickMarket(s);
  s = tickRivals(s);
  if (s.listed) {
    const fair = valuationOf({ ...s, listed: false }) / Math.max(1, s.shares);
    const noise = (s.hype - 40) / 8000 - s.scandal / 12000;
    s = { ...s, stockPrice: Math.max(0.4, s.stockPrice * 0.97 + fair * 0.03 + noise * s.stockPrice) };
  }
  s = { ...s, valuation: valuationOf(s), history: [...s.history, s.valuation].slice(-90) };
  s = fails(s);
  if (!s.ending) s = maybeEvent(s);
  if (s.day > 0 && s.day % 30 === 0) {
    s = news(s, `Month close. Burn ${Math.round(d.burn)}/day. Rev ${Math.round(s.revenueToday)}/day.`);
  }
  return s;
}

export function tickDays(s: GameState, n: number): GameState {
  let cur = s;
  for (let i = 0; i < n; i++) {
    if (cur.ending || cur.eventId) break;
    cur = tickDay(cur);
  }
  return cur;
}

export function catchUp(s: GameState): GameState {
  const elapsed = Date.now() - (s.lastRealMs || Date.now());
  const days = Math.min(24, Math.floor(elapsed / DAY_MS));
  if (days < 2) return { ...s, lastRealMs: Date.now() };
  return { ...tickDays(s, days), lastRealMs: Date.now() };
}

function ok(state: GameState, toast: string | null): ActionResult {
  return { state: { ...state, valuation: valuationOf(state) }, toast, blocked: null };
}
function no(state: GameState, blocked: string): ActionResult {
  return { state, toast: null, blocked };
}

export function hire(s: GameState, roleId: RoleId): ActionResult {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return no(s, "Unknown role.");
  const cap = headcountCap(stageFor(s));
  if (s.employees.length >= cap) return no(s, "No seats. Raise or grow the office.");
  if (s.cash < role.signing) return no(s, "Need a signing bonus.");
  let [a, v1] = roll(s);
  let [b, v2] = roll(a);
  const name = `${FIRST_NAMES[Math.floor(v1 * FIRST_NAMES.length) % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(v2 * LAST_NAMES.length) % LAST_NAMES.length]}`;
  const person = { id: `e-${b.day}-${b.employees.length}`, roleId, name, hiredOn: b.day, morale: 72 };
  let out = news(
    { ...b, cash: b.cash - role.signing, employees: [...b.employees, person], morale: clamp(b.morale + 1.4, 0, 100) },
    `${name} joins as ${role.name}.`,
    "good",
  );
  out = mark(out, "first_hire");
  return ok(out, `${name} is in.`);
}

export function fire(s: GameState, id: string): ActionResult {
  if (id === "founder") return no(s, "You cannot fire yourself.");
  const emp = s.employees.find((e) => e.id === id);
  if (!emp) return no(s, "Already gone.");
  const out = news(
    { ...s, employees: s.employees.filter((e) => e.id !== id), cash: s.cash - 3200, morale: clamp(s.morale - 8, 0, 100) },
    `${emp.name} is pursuing other opportunities.`,
    "bad",
  );
  return ok(out, `${emp.name} packed a box.`);
}

export function buyGpu(s: GameState, sku: GpuSkuId, qty = 1): ActionResult {
  const def = skuById(sku);
  if (!def.unlock(s)) return no(s, "Not on the allocation list yet.");
  if (s.day < s.gpuShortageUntil) return no(s, "Shortage. Brokers only.");
  const cost = def.price * qty;
  if (s.cash < cost) return no(s, `Need ${cost.toLocaleString("en-US")} for silicon.`);
  const out = news(
    { ...s, cash: s.cash - cost, gpuOrders: [...s.gpuOrders, { sku, qty, remaining: def.lead }] },
    `Ordered ${qty}× ${def.name}. ${def.lead} days out.`,
  );
  return ok(out, `${def.name} inbound.`);
}

export function burstCloud(s: GameState): ActionResult {
  const cost = s.day < s.gpuShortageUntil ? 28_000 : 11_500;
  if (s.cash < cost) return no(s, "Cloud would like to be paid first.");
  const out = news({ ...s, cash: s.cash - cost, compute: s.compute + 48 }, "Rented a burst of someone else's cluster.");
  return ok(out, "Burst scheduled.");
}

export function setTrainPct(s: GameState, pct: number): ActionResult {
  const trainPct = Math.round(clamp(pct, 0, 100));
  return ok({ ...s, trainPct }, trainPct >= 70 ? "Most of the cluster is training." : trainPct <= 30 ? "Most of the cluster is serving users." : "Split set.");
}

export function startTrain(s: GameState, classId: ModelClassId): ActionResult {
  if (s.training) return no(s, "A job is already on the cluster.");
  const cls = MODEL_CLASSES.find((c) => c.id === classId);
  if (!cls) return no(s, "Unknown class.");
  if (!cls.unlock(s)) return no(s, "Ship a smaller model first.");
  const firstMini = classId === "mini" && s.models.length === 0;
  if (!firstMini && s.research < cls.researchNeed) return no(s, `Need ${cls.researchNeed} research.`);
  if (!firstMini && s.compute < cls.computeNeed) return no(s, `Need ${cls.computeNeed} compute. Buy GPUs.`);
  const version = s.models.filter((m) => m.classId === classId).length + 1;
  const name = modelName(s.family, cls, version);
  let cur = s;
  if (cur.trainPct < 20) cur = { ...cur, trainPct: 55 };
  const c = clusterPower(cur);
  if (c.trainPower < 0.08) return no(s, "No GPUs on Train. Tap GPUs and slide toward Train.");
  const job = { classId, name, version, remaining: cls.flopNeed, total: cls.flopNeed };
  const days = Math.max(1, Math.ceil(cls.flopNeed / c.trainPower));
  const out = news(
    { ...cur, compute: Math.max(0, cur.compute - (firstMini ? 0 : cls.computeNeed)), training: job, gen: cur.gen + 1 },
    `Training ${name}. ~${days}d.`,
  );
  return ok(out, `${name} is cooking (~${days}d).`);
}

export function shipDemo(s: GameState, modelId: string): ActionResult {
  if (s.demoCooldown > 0) return no(s, "Demo team is recovering.");
  const model = s.models.find((m) => m.id === modelId);
  if (!model) return no(s, "No such weights.");
  const cls = classById(model.classId);
  const t = staffTotals(s);
  const [n, r] = roll(s);
  const chance = clamp(0.28 + t.demo + model.quality / 140 + n.hype / 240 - n.heat / 200, 0.1, 0.92);
  const viral = r < chance;
  const flop = r > chance + 0.4;
  const gain = cls.hypeOnShip * (viral ? 1 : flop ? 0.18 : 0.45);
  let out: GameState = {
    ...n,
    hype: clamp(n.hype + gain, 0, 100),
    demoCooldown: 10,
    models: n.models.map((m) => (m.id === modelId ? { ...m, shipped: true } : m)),
    waitlist: n.waitlist + (viral ? 3600 + Math.floor(n.hype * 32) : flop ? 220 : 780),
  };
  if (flop) out = news({ ...out, heat: clamp(out.heat + 6, 0, 100) }, `Live demo of ${model.name} ate itself.`, "bad");
  else if (viral) out = news(out, `${model.name} demo went feral. Waitlist is moving.`, "good");
  else out = news(out, `${model.name} demo was fine. Waitlist ticked up.`);
  return ok(out, flop ? "It flopped." : viral ? "It went viral." : "Polite applause.");
}

export function launchProduct(s: GameState, modelId: string, kind: ProductKind): ActionResult {
  const model = s.models.find((m) => m.id === modelId);
  if (!model) return no(s, "Train something first.");
  if (s.products.some((p) => p.modelId === modelId && p.kind === kind)) return no(s, "Already live as that product.");
  const cls = classById(model.classId);
  const t = staffTotals(s);
  const shipped = s.models.map((m) => (m.id === modelId ? { ...m, shipped: true } : m));
  const convert = Math.floor(s.waitlist * clamp(0.22 + model.quality / 180 + s.hype / 300 + t.sales * 0.04, 0.14, 0.55));
  const seedUsers =
    kind === "enterprise"
      ? Math.max(12, Math.floor(convert * 0.06 + t.sales * 8))
      : kind === "api"
        ? Math.max(80, Math.floor(convert * 0.28))
        : Math.max(8000, convert + 2500);
  const price = kind === "chat" ? cls.chatPrice : kind === "api" ? cls.apiPrice : cls.entPrice;
  const product: Product = {
    id: `p-${s.day}-${kind}-${model.id}`,
    modelId,
    kind,
    name: productName(model.name, kind),
    users: seedUsers,
    price,
    quality: model.quality,
    adUntil: 0,
    adDaily: 0,
  };
  const trainPct = Math.min(s.trainPct, 40);
  let out: GameState = {
    ...s,
    models: shipped,
    products: [...s.products, product],
    waitlist: Math.max(0, s.waitlist - convert),
    users: s.users + seedUsers,
    quality: clamp(s.quality + 1.5, 0, 100),
    trainPct,
    hype: clamp(s.hype + 4, 0, 100),
  };
  out = mark(out, "first_product");
  const line =
    kind === "api"
      ? `${product.name} is live. Devs pay per million tokens.`
      : kind === "enterprise"
        ? `${product.name} is live. Seats, not screenshots.`
        : `${product.name} is live. ${seedUsers} people walked in. You are making money.`;
  out = news(out, line, "good");
  out = { ...out, revenueToday: dailyRevenue(out, derive(out).servedFrac) };
  return ok(out, `${product.name} is charging. Watch the till.`);
}

export function openChat(s: GameState, modelId: string): ActionResult {
  return launchProduct(s, modelId, "chat");
}

export function forecastAd(s: GameState, productId: string, packId: string): AdForecast | null {
  const p = s.products.find((x) => x.id === productId);
  const pack = AD_PACKS.find((a) => a.id === packId);
  if (!p || !pack) return null;
  const t = staffTotals(s);
  const lift = 0.7 + s.hype / 180 + t.growth * 0.15 + p.quality / 220;
  const users = Math.floor(pack.users * lift * (p.kind === "enterprise" ? 0.08 : p.kind === "api" ? 0.22 : 1));
  const daily = Math.max(12, Math.floor(users / pack.days));
  const pay = payingFrac(p, t, s);
  let extraRev = 0;
  if (p.kind === "chat") extraRev = users * pay * p.price / 30;
  else if (p.kind === "api") {
    const tokDay = users * API_TOK_PER_USER_DAY * (0.65 + p.quality / 180);
    extraRev = (tokDay / 1_000_000) * p.price;
  } else extraRev = users * pay * p.price / 30;
  extraRev *= 0.82 + s.quality / 400 + t.product * 0.12;
  return { users, daily, spend: pack.spend, days: pack.days, extraRev, cac: users > 0 ? pack.spend / users : pack.spend };
}

export function productPayShare(s: GameState, p: Product): number {
  return payingFrac(p, staffTotals(s), s);
}

export function advertise(s: GameState, productId: string, packId: string): ActionResult {
  const p = s.products.find((x) => x.id === productId);
  if (!p) return no(s, "Launch a product first.");
  const pack = AD_PACKS.find((a) => a.id === packId);
  if (!pack) return no(s, "Unknown campaign.");
  if (s.adCooldown > 0) return no(s, "A campaign is still running.");
  if (s.cash < pack.spend) return no(s, "Cannot float the ads.");
  const t = staffTotals(s);
  const lift = 0.7 + s.hype / 180 + t.growth * 0.15 + p.quality / 220;
  const users = Math.floor(pack.users * lift * (p.kind === "enterprise" ? 0.08 : p.kind === "api" ? 0.22 : 1));
  const daily = Math.max(12, Math.floor(users / pack.days));
  const products = s.products.map((x) =>
    x.id === productId ? { ...x, adUntil: s.day + pack.days, adDaily: daily } : x,
  );
  const out = news(
    { ...s, cash: s.cash - pack.spend, products, adCooldown: pack.days, hype: clamp(s.hype + 2.2, 0, 100) },
    `${pack.name} is live on ${p.name}. ~${daily}/day inbound.`,
    "good",
  );
  return ok(out, "Campaign running.");
}

export function setProductPrice(s: GameState, productId: string, price: number): ActionResult {
  const p = s.products.find((x) => x.id === productId);
  if (!p) return no(s, "No such product.");
  const lo = p.kind === "api" ? 0.08 : p.kind === "enterprise" ? 24 : 6;
  const hi = p.kind === "api" ? 40 : p.kind === "enterprise" ? 2400 : 80;
  const next = clamp(price, lo, hi);
  const products = s.products.map((x) => (x.id === productId ? { ...x, price: next } : x));
  return ok({ ...s, products }, p.kind === "api" ? `API ${next.toFixed(2)} / 1M tok` : `${Math.round(next)} / mo`);
}

export function raiseRound(s: GameState): ActionResult {
  const round = ROUNDS.find((r) => r.id === s.nextRound);
  if (!round) return no(s, "No round on the calendar.");
  if (s.hype < round.minHype) return no(s, `Need hype ${round.minHype}+ (have ${Math.floor(s.hype)}).`);
  if (s.valuation < round.minValuation) return no(s, "Valuation is not a story yet.");
  if (round.id === "ipo") {
    const primary = Math.round(s.valuation * 0.11);
    const listed: GameState = {
      ...s,
      lastRound: "ipo",
      nextRound: "secondary",
      listed: true,
      cash: s.cash + primary,
      equity: s.equity * (1 - round.dilution),
      shares: Math.round(s.shares * (1 + round.dilution)),
      stockPrice: s.valuation / Math.max(1, s.shares),
      hype: clamp(s.hype + 8, 0, 100),
    };
    const out = mark(news({ ...listed, valuation: valuationOf(listed) }, `S-1 effective. ${s.company} is public.`, "good"), "ipo");
    return ok(out, "You are public. The company keeps going.");
  }
  if (round.id === "secondary") {
    if (!s.listed) return no(s, "List first.");
    const amt = Math.round(s.valuation * 0.07);
    const out = news(
      {
        ...s,
        cash: s.cash + amt,
        lastRound: "secondary",
        nextRound: "secondary",
        equity: s.equity * (1 - round.dilution),
        shares: Math.round(s.shares * (1 + round.dilution)),
        stockPrice: s.stockPrice * 0.97,
      },
      "Follow-on closed.",
      "good",
    );
    return ok(out, "Follow-on is in.");
  }
  const idx = ROUNDS.findIndex((r) => r.id === round.id) + 1;
  const next = ROUNDS[idx]?.id ?? "ipo";
  const boost = s.market === "mania" ? 1.18 : s.market === "boom" ? 1.08 : s.market === "winter" ? 0.78 : 1;
  const amt = Math.round(round.raise * boost);
  const out = news(
    {
      ...s,
      cash: s.cash + amt,
      equity: s.equity * (1 - round.dilution),
      lastRound: round.id,
      nextRound: next,
      hype: clamp(s.hype + 5, 0, 100),
      morale: clamp(s.morale + 6, 0, 100),
    },
    `Closed ${round.name}.`,
    "good",
  );
  if (out.valuation >= 1_000_000_000 || amt + out.cash > 0) {
    /* unicorn check after val refresh in ok() */
  }
  const done = ok(out, `${round.name} is in the bank.`);
  if (done.state.valuation >= 1_000_000_000) done.state = mark(done.state, "unicorn");
  return done;
}

export function pivot(s: GameState): ActionResult {
  if (s.day - s.lastPivotDay < 90) return no(s, "You just pivoted.");
  let out: GameState = {
    ...s,
    pivots: s.pivots + 1,
    lastPivotDay: s.day,
    quality: clamp(s.quality * 0.42, 2, 22),
    hype: clamp(s.hype + 8 - s.pivots * 1.5, 0, 100),
    research: s.research * 0.62,
  };
  if (s.pivots >= 4) out = { ...out, scandal: clamp(out.scandal + 6, 0, 100) };
  return ok(news(out, "New thesis. Same GPUs."), "You pivoted.");
}

export function stealPaper(s: GameState): ActionResult {
  if (s.stealCooldown > 0) return no(s, "The copier is overheated.");
  if (!s.employees.some((e) => e.roleId === "researcher" || e.roleId === "mill")) return no(s, "Need someone who can read a PDF.");
  const [n, r] = roll(s);
  const mill = n.employees.filter((e) => e.roleId === "mill").length;
  let out: GameState = {
    ...n,
    research: n.research + 22 + mill * 7,
    evil: n.evil + 5,
    papersStolen: n.papersStolen + 1,
    stealCooldown: 16,
  };
  if (r < 0.2 + out.papersStolen * 0.035) {
    out = news({ ...out, scandal: clamp(out.scandal + 12, 0, 100) }, "You lifted a paper — and they noticed.", "evil");
    return ok(out, "Stolen — and noticed.");
  }
  return ok(news(out, "A related-work section appeared overnight.", "evil"), "Knowledge, acquired.");
}

export function fakeBenchmark(s: GameState, modelId: string): ActionResult {
  if (s.fakeCooldown > 0) return no(s, "The leaderboard is watching.");
  if (!s.models.some((m) => m.id === modelId)) return no(s, "Train something first.");
  const [n, r] = roll(s);
  let out: GameState = {
    ...n,
    hype: clamp(n.hype + 11, 0, 100),
    evil: n.evil + 7,
    fakeBenches: n.fakeBenches + 1,
    fakeCooldown: 20,
    models: n.models.map((m) => (m.id === modelId ? { ...m, fakeBench: true } : m)),
  };
  if (r < 0.28) out = news({ ...out, scandal: clamp(out.scandal + 9, 0, 100) }, "SOTA claimed. The chart is a fiction.", "evil");
  else out = news(out, "New SOTA.", "evil");
  return ok(out, r < 0.28 ? "The chart is a fiction." : "Leaderboard updated itself.");
}

export function farmWaitlist(s: GameState): ActionResult {
  if (s.adCooldown > 0) return no(s, "The funnel is still loud.");
  if (s.cash < 7500) return no(s, "Engagement farming is not free.");
  const out = news(
    {
      ...s,
      cash: s.cash - 7500,
      waitlist: s.waitlist + 4800,
      hype: clamp(s.hype + 3, 0, 100),
      quality: clamp(s.quality - 1.1, 0, 100),
      adCooldown: 8,
      evil: s.evil + 1.4,
    },
    "Waitlist ads. Half are bots.",
    "evil",
  );
  return ok(out, "Funnel is loud.");
}

export function resolveEvent(s: GameState, choiceId: string): ActionResult {
  if (s.eventId === "acquire-close") {
    if (choiceId === "take") {
      const out = news({ ...s, ending: "acquired", eventId: null, speed: 0 }, "Acquired.", "good");
      return ok(out, "You sold.");
    }
    const out = news({ ...s, eventId: null, speed: 1, hype: clamp(s.hype + 3, 0, 100) }, "You walked.");
    return ok(out, "Independence, expensive.");
  }
  const ev = EVENTS.find((e) => e.id === s.eventId);
  const choice = ev?.choices.find((c) => c.id === choiceId);
  if (!choice) return ok({ ...s, eventId: null, speed: 1 }, null);
  let out = applyEffect({ ...s, eventId: null, speed: 1 }, choice.effects);
  if (!out.eventId) out = { ...out, speed: out.ending ? 0 : 1 };
  return ok(out, choice.label);
}

export function setSpeed(s: GameState, speed: Speed): GameState {
  if (s.eventId || s.ending) return { ...s, speed: 0 };
  return { ...s, speed };
}

export function nextVersion(s: GameState, classId: ModelClassId): number {
  return s.models.filter((m) => m.classId === classId).length + 1;
}
