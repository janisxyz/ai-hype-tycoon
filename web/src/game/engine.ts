import {
  COMPANY_SEEDS,
  DAY_MS,
  EVENTS,
  FIRST_NAMES,
  LAST_NAMES,
  MARKET_COPY,
  MODELS,
  RIVAL_NAMES,
  ROLES,
  ROUNDS,
  cycleMultiple,
  eraFor,
  headcountCap,
  rentPerDay,
  stageFor,
} from "./content";
import { clamp } from "./format";
import type {
  ActionResult,
  Competitor,
  Effect,
  Employee,
  EndingId,
  GameState,
  MarketCycle,
  ModelSpecId,
  NewsItem,
  RoleId,
  RoundId,
  Tone,
} from "./types";
import { SAVE_VERSION } from "./types";

export const GPU_COST = 16_000;
export const GPU_POWER_DAY = 8;
export const GPU_YIELD = 6.2;
export const CLOUD_BURST_COST = 12_000;
export const CLOUD_BURST_COMPUTE = 42;
export const HYPE_DECAY = 0.11;
export const BROKE_LIMIT = 36;
export const GPU_LEAD_DAYS = 5;

function mixRng(n: number): { rng: number; value: number } {
  let a = (n + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { rng: a, value };
}

export function roll(state: GameState): { state: GameState; value: number } {
  const { rng, value } = mixRng(state.rng);
  return { state: { ...state, rng }, value };
}

function uid(state: GameState, prefix: string): { state: GameState; id: string } {
  const r = roll(state);
  return { state: r.state, id: `${prefix}-${r.state.day}-${Math.floor(r.value * 1e9)}` };
}

function pushNews(state: GameState, text: string, tone: Tone): GameState {
  const u = uid(state, "n");
  const item: NewsItem = { id: u.id, day: u.state.day, text, tone };
  return { ...u.state, news: [item, ...u.state.news].slice(0, 56) };
}

function mark(state: GameState, id: string): GameState {
  if (state.milestones.includes(id)) return state;
  return { ...state, milestones: [...state.milestones, id] };
}

export function applyEffect(state: GameState, fx: Effect): GameState {
  let s = { ...state };
  if (fx.cash) s.cash += fx.cash;
  if (fx.hype) s.hype = clamp(s.hype + fx.hype, 0, 100);
  if (fx.quality) s.quality = clamp(s.quality + fx.quality, 0, 100);
  if (fx.research) s.research = Math.max(0, s.research + fx.research);
  if (fx.compute) s.compute = Math.max(0, s.compute + fx.compute);
  if (fx.gpus) s.gpus = Math.max(0, s.gpus + fx.gpus);
  if (fx.scandal) s.scandal = clamp(s.scandal + fx.scandal, 0, 100);
  if (fx.heat) s.heat = clamp(s.heat + fx.heat, 0, 100);
  if (fx.evil) s.evil = Math.max(0, s.evil + fx.evil);
  if (fx.waitlist) s.waitlist = Math.max(0, s.waitlist + fx.waitlist);
  if (fx.users) s.users = Math.max(0, s.users + fx.users);
  if (fx.morale) {
    s.morale = clamp(s.morale + fx.morale, 0, 100);
    s.employees = s.employees.map((e) => ({ ...e, morale: clamp(e.morale + fx.morale!, 8, 100) }));
  }
  if (fx.valuationMul) s.valuation = Math.max(0, s.valuation * fx.valuationMul);
  if (fx.flag) s.flags = { ...s.flags, [fx.flag]: true };
  if (fx.shortageDays) s.gpuShortageUntil = Math.max(s.gpuShortageUntil, s.day + fx.shortageDays);
  if (fx.log) s = pushNews(s, fx.log, fx.logTone ?? "ok");
  if (fx.ending) s.ending = fx.ending;
  if (fx.acquireOffer) {
    const offer = Math.round(s.valuation * (0.9 + s.hype / 400));
    s.acquireOffer = offer;
    s.eventId = "acquire-close";
    s.speed = 0;
  }
  return s;
}

export function count(state: GameState, role: RoleId): number {
  return state.employees.filter((e) => e.roleId === role).length;
}

export function totals(state: GameState) {
  const moraleMul = 0.7 + (state.morale / 100) * 0.45;
  return state.employees.reduce(
    (acc, e) => {
      const role = ROLES.find((r) => r.id === e.roleId);
      if (!role) return acc;
      const m = (e.morale / 100) * moraleMul;
      acc.salary += role.salaryMo;
      acc.research += role.research * m;
      acc.hype += role.hype * m;
      acc.quality += role.quality * m;
      acc.eff += role.computeEff;
      acc.heat += role.heat;
      acc.scandalDecay += role.scandalDecay;
      acc.demo += role.demoBoost;
      acc.product += role.product * m;
      return acc;
    },
    { salary: 0, research: 0, hype: 0, quality: 0, eff: 1, heat: 0, scandalDecay: 0, demo: 0, product: 0 },
  );
}

export function dailyBurn(state: GameState): number {
  const t = totals(state);
  return t.salary / 30 + state.gpus * GPU_POWER_DAY + rentPerDay(stageFor(state));
}

export function dailyRevenue(state: GameState): number {
  if (!state.products.length) return 0;
  const t = totals(state);
  const q = 0.45 + state.quality / 180 + t.product * 0.4;
  return state.products.reduce((n, p) => n + p.users * p.arpu * q, 0);
}

export function recalcValuation(state: GameState): number {
  const arr = dailyRevenue(state) * 365;
  const multiple =
    cycleMultiple(state.market) * (1 + state.hype / 220) * (1 - state.scandal / 280) * (state.listed ? 0.85 : 1);
  const narrative = state.hype * 18_000 + state.models.length * 180_000 + state.gpus * 22_000;
  const cash = Math.max(0, state.cash) * 0.55;
  const listed = state.listed ? state.stockPrice * state.shares : 0;
  const privateVal = Math.max(80_000, arr * Math.max(4, multiple) + narrative + cash);
  return state.listed ? Math.max(privateVal * 0.35, listed) : privateVal;
}

function seedCompetitors(seed: number): Competitor[] {
  return RIVAL_NAMES.map((name, i) => ({
    id: `riv-${i}`,
    name,
    hype: 6 + ((seed >> (i * 3)) % 12),
    valuation: 400_000 + ((seed >> (i * 5)) % 900_000),
    stage: "garage",
  }));
}

export function createGame(company: string, seed = Date.now()): GameState {
  const name = company.trim() || COMPANY_SEEDS[seed % COMPANY_SEEDS.length]!;
  const founder: Employee = { id: "founder", roleId: "researcher", name: "You", hiredOn: 0, morale: 78 };
  let s: GameState = {
    version: SAVE_VERSION,
    seed,
    rng: seed >>> 0,
    day: 0,
    speed: 1,
    company: name,
    cash: 110_000,
    equity: 1,
    hype: 8,
    quality: 6,
    research: 14,
    compute: 48,
    gpus: 1,
    scandal: 0,
    heat: 3,
    evil: 0,
    valuation: 280_000,
    lastRound: null,
    nextRound: "friends",
    pivots: 0,
    lastPivotDay: -90,
    gpuShortageUntil: 0,
    employees: [founder],
    training: null,
    models: [],
    products: [],
    users: 0,
    revenueToday: 0,
    listed: false,
    stockPrice: 0,
    shares: 10_000_000,
    market: "quiet",
    marketDaysLeft: 48,
    competitors: seedCompetitors(seed),
    gpuOrders: [],
    morale: 74,
    milestones: [],
    history: [280_000],
    demoCooldown: 0,
    waitlistCooldown: 0,
    stealCooldown: 0,
    fakeCooldown: 0,
    news: [],
    eventId: null,
    waitlist: 90,
    papersStolen: 0,
    fakeBenches: 0,
    daysBroke: 0,
    flags: {},
    ending: null,
    acquireOffer: 0,
    lastRealMs: Date.now(),
  };
  s = pushNews(s, `${s.company} opens in a garage. One card is already humming.`, "ok");
  s.valuation = recalcValuation(s);
  s.history = [s.valuation];
  return s;
}

function pickName(state: GameState): { state: GameState; name: string } {
  let s = state;
  const a = roll(s);
  s = a.state;
  const b = roll(s);
  s = b.state;
  const first = FIRST_NAMES[Math.floor(a.value * FIRST_NAMES.length)]!;
  const last = LAST_NAMES[Math.floor(b.value * LAST_NAMES.length)]!;
  return { state: s, name: `${first} ${last}` };
}

function nextCycle(cur: MarketCycle, value: number): MarketCycle {
  if (cur === "mania") return value < 0.7 ? "boom" : "winter";
  if (cur === "boom") return value < 0.45 ? "mania" : value < 0.75 ? "quiet" : "winter";
  if (cur === "quiet") return value < 0.35 ? "boom" : value < 0.78 ? "quiet" : "winter";
  return value < 0.55 ? "quiet" : "winter";
}

function tickMarket(state: GameState): GameState {
  let s = state;
  if (s.marketDaysLeft > 1) return { ...s, marketDaysLeft: s.marketDaysLeft - 1 };
  const r = roll(s);
  s = r.state;
  const next = nextCycle(s.market, r.value);
  const dur = 40 + Math.floor(r.value * 70);
  s = { ...s, market: next, marketDaysLeft: dur };
  if (next !== state.market) {
    s = pushNews(s, `Tape shift: ${MARKET_COPY[next].title}. ${MARKET_COPY[next].line}`, next === "winter" ? "bad" : "ok");
  }
  return s;
}

function tickCompetitors(state: GameState): GameState {
  const r = roll(state);
  let s = r.state;
  s = {
    ...s,
    competitors: s.competitors.map((c, i) => {
      const drift = (r.value - 0.45) * 0.4 + (i * 0.05);
      const hype = clamp(c.hype + drift, 2, 96);
      const growth = 1 + (s.market === "mania" ? 0.012 : s.market === "boom" ? 0.007 : s.market === "winter" ? -0.004 : 0.002);
      return { ...c, hype, valuation: Math.max(120_000, c.valuation * growth * (1 + hype / 800)) };
    }),
  };
  if (s.day > 20 && s.day % 37 === 0) {
    const rival = s.competitors[s.day % s.competitors.length]!;
    s = pushNews(s, `${rival.name} just raised into the same tape you are on.`, "ok");
  }
  if (s.morale < 38 && s.employees.length > 2 && r.value < 0.08) {
    const victim = s.employees.find((e) => e.id !== "founder");
    if (victim) {
      s = {
        ...s,
        employees: s.employees.filter((e) => e.id !== victim.id),
        morale: clamp(s.morale - 6, 0, 100),
      };
      s = pushNews(s, `${victim.name} left for ${s.competitors[0]!.name}. The offer included compute without asking.`, "bad");
    }
  }
  return s;
}

function tickProducts(state: GameState): GameState {
  if (!state.products.length) {
    const organic = state.waitlist * 0.0018 + state.hype * 0.35;
    return { ...state, waitlist: Math.floor(state.waitlist + organic), users: 0, revenueToday: 0 };
  }
  const t = totals(state);
  const churn = clamp(0.006 - state.quality / 2800 + state.scandal / 4200 - t.product * 0.002, 0.001, 0.03);
  const growth = 0.0016 + state.hype / 14000 + t.product * 0.003;
  const convert = Math.min(state.waitlist * (0.01 + state.hype / 2500), state.waitlist * 0.08);
  const products = state.products.map((p) => {
    const users = Math.max(0, Math.floor(p.users * (1 + growth - churn) + convert / state.products.length));
    return { ...p, users };
  });
  const users = products.reduce((n, p) => n + p.users, 0);
  const next: GameState = {
    ...state,
    products,
    users,
    waitlist: Math.max(0, Math.floor(state.waitlist - convert + state.hype * 0.45)),
  };
  next.revenueToday = dailyRevenue(next);
  return next;
}

function maybeEvent(state: GameState): GameState {
  if (state.eventId || state.ending) return state;
  if (state.day < 12 || state.day % 18 !== 0) return state;
  const r = roll(state);
  let s = r.state;
  const chance = 0.22 + s.evil * 0.002 + s.hype * 0.001 + s.scandal * 0.0015;
  if (r.value > chance) return s;
  const eligible = EVENTS.filter((ev) => {
    if (ev.minDay && s.day < ev.minDay) return false;
    if (ev.publicOnly && !s.listed) return false;
    if (ev.require && !ev.require(s)) return false;
    if (s.flags[`ev-${ev.id}`] && ev.id !== "gpu-shortage" && ev.id !== "cloud-bill" && ev.id !== "earnings") return false;
    return true;
  });
  if (!eligible.length) return s;
  const weightSum = eligible.reduce((n, e) => n + e.weight, 0);
  const pick = roll(s);
  s = pick.state;
  let cursor = pick.value * weightSum;
  let chosen = eligible[0]!;
  for (const ev of eligible) {
    cursor -= ev.weight;
    if (cursor <= 0) {
      chosen = ev;
      break;
    }
  }
  s.eventId = chosen.id;
  s.speed = 0;
  s.flags = { ...s.flags, [`ev-${chosen.id}`]: true };
  return s;
}

function checkFails(state: GameState): GameState {
  if (state.ending) return state;
  if (state.scandal >= 96 && state.evil >= 52) {
    return { ...state, ending: "indicted", speed: 0 };
  }
  if (state.cash < 0) {
    const broke = state.daysBroke + 1;
    if (broke >= BROKE_LIMIT) return { ...state, daysBroke: broke, ending: "bankrupt", speed: 0 };
    return { ...state, daysBroke: broke };
  }
  return { ...state, daysBroke: 0 };
}

function checkMilestones(state: GameState): GameState {
  let s = state;
  if (s.employees.length >= 2) s = mark(s, "first_hire");
  if (s.models.length >= 1) s = mark(s, "first_model");
  if (s.products.length >= 1) s = mark(s, "first_product");
  if (s.users >= 1_000_000) s = mark(s, "million_users");
  if (s.valuation >= 1_000_000_000) s = mark(s, "unicorn");
  if (s.listed) s = mark(s, "ipo");
  if (s.quality >= 58 && s.scandal < 22 && s.products.length > 0) s = mark(s, "useful");
  return s;
}

export function tickDay(state: GameState): GameState {
  if (state.ending || state.eventId) return state;
  let s: GameState = { ...state, day: state.day + 1 };
  const t = totals(s);
  const burn = dailyBurn(s);

  const arrived = s.gpuOrders.filter((o) => o.remaining <= 1);
  const pending = s.gpuOrders
    .map((o) => ({ ...o, remaining: o.remaining - 1 }))
    .filter((o) => o.remaining > 0);
  if (arrived.length) {
    const qty = arrived.reduce((n, o) => n + o.qty, 0);
    s = { ...s, gpus: s.gpus + qty, gpuOrders: pending };
    s = pushNews(s, `${qty} accelerator${qty > 1 ? "s" : ""} landed. The room got louder.`, "good");
  } else {
    s.gpuOrders = pending;
  }

  const shortage = s.day < s.gpuShortageUntil;
  const gpuYield = s.gpus * (shortage ? 0.32 : GPU_YIELD) * t.eff;
  s.compute += gpuYield;
  s.research += t.research;
  s.hype = clamp(s.hype + t.hype - HYPE_DECAY - s.scandal * 0.012, 0, 100);
  s.quality = clamp(s.quality + t.quality * 0.18, 0, 100);
  s.heat = clamp(s.heat + t.heat * 0.2 - 0.04, 0, 100);
  s.scandal = clamp(s.scandal - t.scandalDecay * 0.18 - 0.05, 0, 100);
  s.morale = clamp(s.morale + (s.cash > burn * 40 ? 0.04 : -0.08) + t.product * 0.02, 0, 100);

  s.demoCooldown = Math.max(0, s.demoCooldown - 1);
  s.waitlistCooldown = Math.max(0, s.waitlistCooldown - 1);
  s.stealCooldown = Math.max(0, s.stealCooldown - 1);
  s.fakeCooldown = Math.max(0, s.fakeCooldown - 1);

  s = tickProducts(s);
  s.cash += s.revenueToday - burn;

  if (s.training) {
    const job = { ...s.training, remaining: s.training.remaining - 1 };
    if (job.remaining <= 0) {
      const spec = MODELS.find((m) => m.id === job.specId)!;
      const ratio = Math.min(1, s.research / Math.max(1, spec.researchNeed));
      const q = clamp(spec.qualityCap * 0.38 + s.quality * 0.32 + ratio * 16, 4, spec.qualityCap);
      s.models = [
        ...s.models,
        { id: `m-${s.day}-${spec.id}`, specId: spec.id, quality: q, shipped: false, fakeBench: false, launched: false },
      ];
      s.training = null;
      s.research = Math.max(0, s.research - spec.researchNeed * 0.28);
      s = pushNews(s, `${spec.name} finished training. Eval loss is a vibe.`, "good");
    } else {
      s.training = job;
    }
  }

  s = tickMarket(s);
  s = tickCompetitors(s);

  if (s.listed) {
    const fair = recalcValuation({ ...s, listed: false }) / Math.max(1, s.shares);
    const noise = (s.hype - 40) / 8000 - s.scandal / 12000;
    s.stockPrice = Math.max(0.4, s.stockPrice * 0.97 + fair * 0.03 + noise * s.stockPrice);
  }

  s.valuation = recalcValuation(s);
  if (s.day % 7 === 0) s.history = [...s.history, s.valuation].slice(-64);

  s = checkFails(s);
  if (!s.ending) s = maybeEvent(s);
  s = checkMilestones(s);

  if (s.day > 0 && s.day % 30 === 0) {
    const tone: Tone = burn > s.cash / 25 ? "bad" : "ok";
    s = pushNews(
      s,
      `Month close. Burn ${Math.round(burn)}/day. Rev ${Math.round(s.revenueToday)}/day. ${eraFor(s)} era.`,
      tone,
    );
  }
  return s;
}

export function tickDays(state: GameState, n: number): GameState {
  let s = state;
  const cap = Math.min(n, 240);
  for (let i = 0; i < cap; i++) {
    if (s.ending || s.eventId) break;
    s = tickDay(s);
  }
  return s;
}

function ok(state: GameState, toast: string | null = null): ActionResult {
  return { state, toast, blocked: null };
}
function no(state: GameState, blocked: string): ActionResult {
  return { state, toast: null, blocked };
}

export function hire(state: GameState, roleId: RoleId): ActionResult {
  if (state.ending) return no(state, "The company is closed.");
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return no(state, "Unknown role.");
  const cap = headcountCap(stageFor(state));
  if (state.employees.length >= cap) {
    return no(state, `The ${stageFor(state)} only holds ${cap}. Raise or grow the office.`);
  }
  if (state.cash < role.signing) return no(state, `Need ${role.signing.toLocaleString("en-US")} for a signing bonus.`);
  const named = pickName(state);
  let s = named.state;
  const person: Employee = {
    id: `e-${s.day}-${s.employees.length}`,
    roleId,
    name: named.name,
    hiredOn: s.day,
    morale: 72,
  };
  s = { ...s, cash: s.cash - role.signing, employees: [...s.employees, person], morale: clamp(s.morale + 1.5, 0, 100) };
  s.valuation = recalcValuation(s);
  s = pushNews(s, `${person.name} joins as ${role.name}.`, "good");
  s = checkMilestones(s);
  return ok(s, `${person.name} is in.`);
}

export function fire(state: GameState, id: string): ActionResult {
  if (id === "founder") return no(state, "You cannot fire yourself.");
  const emp = state.employees.find((e) => e.id === id);
  if (!emp) return no(state, "Already gone.");
  let s: GameState = {
    ...state,
    employees: state.employees.filter((e) => e.id !== id),
    cash: state.cash - 3_500,
    morale: clamp(state.morale - 8, 0, 100),
  };
  s = pushNews(s, `${emp.name} is pursuing other opportunities. You paid for the laptop.`, "bad");
  s.valuation = recalcValuation(s);
  return ok(s, `${emp.name} packed a box.`);
}

export function buyGpu(state: GameState, n = 1): ActionResult {
  if (state.day < state.gpuShortageUntil) return no(state, "Shortage. Brokers only, and they are not taking calls.");
  const cost = GPU_COST * n;
  if (state.cash < cost) return no(state, "Not enough cash for silicon.");
  let s: GameState = {
    ...state,
    cash: state.cash - cost,
    gpuOrders: [...state.gpuOrders, { qty: n, remaining: GPU_LEAD_DAYS }],
  };
  s = pushNews(s, `Ordered ${n} accelerator${n > 1 ? "s" : ""}. ${GPU_LEAD_DAYS} days out.`, "ok");
  return ok(s, "Cards inbound.");
}

export function burstCloud(state: GameState): ActionResult {
  const cost = state.day < state.gpuShortageUntil ? CLOUD_BURST_COST * 2.4 : CLOUD_BURST_COST;
  if (state.cash < cost) return no(state, "Cloud would like to be paid first.");
  let s: GameState = { ...state, cash: state.cash - cost, compute: state.compute + CLOUD_BURST_COMPUTE };
  s = pushNews(s, "Rented a burst of someone else's cluster.", "ok");
  return ok(s, "Burst scheduled.");
}

export function startTrain(state: GameState, specId: ModelSpecId): ActionResult {
  if (state.training) return no(state, "A job is already on the cluster.");
  const spec = MODELS.find((m) => m.id === specId);
  if (!spec) return no(state, "Unknown recipe.");
  if (!spec.unlock(state)) return no(state, "Not unlocked yet. Raise, research, or wait.");
  if (state.research < spec.researchNeed) {
    return no(state, `Need ${Math.ceil(spec.researchNeed)} research. You have ${Math.floor(state.research)}.`);
  }
  if (state.compute < spec.compute) {
    return no(state, `Need ${spec.compute} compute. Buy cards or burst the cloud.`);
  }
  let s: GameState = {
    ...state,
    compute: state.compute - spec.compute,
    training: { specId, remaining: spec.days, total: spec.days },
  };
  s = pushNews(s, `Training ${spec.name}. The loss curve is a personality test.`, "ok");
  return ok(s, `${spec.name} is cooking.`);
}

export function shipDemo(state: GameState, modelId: string): ActionResult {
  if (state.demoCooldown > 0) return no(state, `Demo team is recovering (${state.demoCooldown}d).`);
  const model = state.models.find((m) => m.id === modelId);
  if (!model) return no(state, "No such weights.");
  const spec = MODELS.find((m) => m.id === model.specId)!;
  const t = totals(state);
  const r = roll(state);
  let s = r.state;
  const chance = clamp(0.24 + t.demo + model.quality / 160 + s.hype / 260 - s.heat / 200, 0.08, 0.9);
  const viral = r.value < chance;
  const flop = r.value > chance + 0.38;
  const hypeGain = viral ? spec.hypeOnShip : flop ? spec.hypeOnShip * 0.15 : spec.hypeOnShip * 0.4;
  s.hype = clamp(s.hype + hypeGain, 0, 100);
  s.demoCooldown = 12;
  s.models = s.models.map((m) => (m.id === modelId ? { ...m, shipped: true } : m));
  s.waitlist += viral ? 2800 + Math.round(s.hype * 28) : flop ? 180 : 520;
  if (flop) {
    s.heat = clamp(s.heat + 6, 0, 100);
    s = pushNews(s, `Live demo of ${spec.name} ate itself. The clip is immortal.`, "bad");
    s.valuation = recalcValuation(s);
    return ok(s, "It flopped.");
  }
  if (viral) {
    s = pushNews(s, `${spec.name} demo went feral. Waitlist is a weather system.`, "good");
    s.valuation = recalcValuation(s);
    return ok(s, "It went viral.");
  }
  s = pushNews(s, `${spec.name} demo was fine. Fine does not raise.`, "ok");
  s.valuation = recalcValuation(s);
  return ok(s, "Polite applause.");
}

export function launchProduct(state: GameState, modelId: string): ActionResult {
  const model = state.models.find((m) => m.id === modelId);
  if (!model) return no(state, "Train something first.");
  if (model.launched) return no(state, "Already a product.");
  if (!model.shipped) return no(state, "Demo it before you bill for it.");
  const spec = MODELS.find((m) => m.id === model.specId)!;
  const convert = Math.floor(state.waitlist * clamp(0.12 + model.quality / 220 + state.hype / 400, 0.06, 0.42));
  const product = {
    id: `p-${state.day}-${spec.id}`,
    name: spec.name,
    modelId,
    users: Math.max(40, convert),
    arpu: spec.arpu * (0.7 + model.quality / 200),
    quality: model.quality,
  };
  let s: GameState = {
    ...state,
    products: [...state.products, product],
    models: state.models.map((m) => (m.id === modelId ? { ...m, launched: true } : m)),
    waitlist: Math.max(0, state.waitlist - convert),
    users: state.users + product.users,
    quality: clamp(state.quality + 2, 0, 100),
  };
  s.revenueToday = dailyRevenue(s);
  s.valuation = recalcValuation(s);
  s = pushNews(s, `Launched ${spec.name} as a product. ${product.users.toLocaleString("en-US")} users walked in.`, "good");
  s = checkMilestones(s);
  return ok(s, `${spec.name} is live.`);
}

export function raiseRound(state: GameState): ActionResult {
  const round = ROUNDS.find((r) => r.id === state.nextRound);
  if (!round) return no(state, "No round on the calendar.");
  if (state.hype < round.minHype) return no(state, `Need hype ${round.minHype}. You have ${Math.round(state.hype)}.`);
  if (state.valuation < round.minValuation) return no(state, "Valuation is not a story they will sit through yet.");

  if (round.id === "ipo") {
    const primary = Math.round(state.valuation * 0.11);
    let s: GameState = {
      ...state,
      lastRound: "ipo",
      nextRound: "secondary",
      listed: true,
      cash: state.cash + primary,
      equity: state.equity * (1 - round.dilution),
      shares: Math.round(state.shares * (1 + round.dilution)),
      stockPrice: state.valuation / Math.max(1, state.shares),
      hype: clamp(state.hype + 8, 0, 100),
    };
    s.valuation = recalcValuation(s);
    s = pushNews(s, `S-1 effective. ${s.company} is public. The garage is now a brand film.`, "good");
    s = checkMilestones(s);
    return ok(s, "You are public. The company keeps going.");
  }

  if (round.id === "secondary") {
    if (!state.listed) return no(state, "List first.");
    const raise = Math.round(state.valuation * 0.07);
    let s: GameState = {
      ...state,
      cash: state.cash + raise,
      lastRound: "secondary",
      nextRound: "secondary",
      equity: state.equity * (1 - round.dilution),
      shares: Math.round(state.shares * (1 + round.dilution)),
      stockPrice: state.stockPrice * 0.97,
    };
    s.valuation = recalcValuation(s);
    s = pushNews(s, `Follow-on closed. ${raise.toLocaleString("en-US")} in.`, "good");
    return ok(s, "Follow-on is in.");
  }

  const nextIndex = ROUNDS.findIndex((r) => r.id === round.id) + 1;
  const next = (ROUNDS[nextIndex]?.id ?? "ipo") as RoundId;
  const cycleBoost = state.market === "mania" ? 1.18 : state.market === "boom" ? 1.08 : state.market === "winter" ? 0.78 : 1;
  const raise = Math.round(round.raise * cycleBoost);
  let s: GameState = {
    ...state,
    cash: state.cash + raise,
    equity: state.equity * (1 - round.dilution),
    lastRound: round.id,
    nextRound: next,
    hype: clamp(state.hype + 5, 0, 100),
    morale: clamp(state.morale + 6, 0, 100),
  };
  s.valuation = recalcValuation(s);
  s = pushNews(s, `Closed ${round.name}: ${raise.toLocaleString("en-US")} in, ${Math.round(round.dilution * 100)}% out.`, "good");
  return ok(s, `${round.name} is in the bank.`);
}

export function pivot(state: GameState): ActionResult {
  if (state.day - state.lastPivotDay < 90) {
    return no(state, `You just pivoted. ${90 - (state.day - state.lastPivotDay)}d of scar tissue left.`);
  }
  let s: GameState = {
    ...state,
    pivots: state.pivots + 1,
    lastPivotDay: state.day,
    quality: clamp(state.quality * 0.42, 2, 22),
    hype: clamp(state.hype + 8 - state.pivots * 1.5, 0, 100),
    research: state.research * 0.62,
  };
  if (state.pivots >= 4) s.scandal = clamp(s.scandal + 6, 0, 100);
  s = pushNews(s, "New thesis. Same GPUs. The deck has a different animal on the cover.", "ok");
  return ok(s, "You pivoted.");
}

export function stealPaper(state: GameState): ActionResult {
  if (state.stealCooldown > 0) return no(state, "The copier is overheated.");
  if (count(state, "researcher") + count(state, "mill") < 1) return no(state, "Need someone who can read a PDF.");
  const r = roll(state);
  let s = r.state;
  s.research += 22 + count(s, "mill") * 7;
  s.evil += 5;
  s.papersStolen += 1;
  s.stealCooldown = 16;
  if (r.value < 0.2 + s.papersStolen * 0.035) {
    s.scandal = clamp(s.scandal + 12, 0, 100);
    s = pushNews(s, "You lifted a paper. The figures still have their watermark.", "evil");
    return ok(s, "Stolen — and noticed.");
  }
  s = pushNews(s, "A related-work section appeared overnight. Very related.", "evil");
  return ok(s, "Knowledge, acquired.");
}

export function fakeBenchmark(state: GameState, modelId: string): ActionResult {
  if (state.fakeCooldown > 0) return no(state, "The leaderboard is suspicious of you this week.");
  const model = state.models.find((m) => m.id === modelId);
  if (!model) return no(state, "Train something before you lie about it.");
  const r = roll(state);
  let s = r.state;
  s.hype = clamp(s.hype + 11, 0, 100);
  s.evil += 7;
  s.fakeBenches += 1;
  s.fakeCooldown = 20;
  s.models = s.models.map((m) => (m.id === modelId ? { ...m, fakeBench: true } : m));
  s.valuation = recalcValuation(s);
  if (r.value < 0.28) {
    s.scandal = clamp(s.scandal + 9, 0, 100);
    s = pushNews(s, "SOTA claimed. A grad student in another timezone has questions.", "evil");
    return ok(s, "The chart is a fiction.");
  }
  s = pushNews(s, "New SOTA. The test set went to the same school as the train set.", "evil");
  return ok(s, "Leaderboard updated itself.");
}

export function farmWaitlist(state: GameState): ActionResult {
  if (state.waitlistCooldown > 0) return no(state, "The ads are still running.");
  const cost = 8_000;
  if (state.cash < cost) return no(state, "Engagement farming is not free.");
  let s: GameState = {
    ...state,
    cash: state.cash - cost,
    waitlist: state.waitlist + 5200,
    hype: clamp(state.hype + 3.5, 0, 100),
    quality: clamp(state.quality - 1.2, 0, 100),
    waitlistCooldown: 12,
    evil: state.evil + 1.5,
  };
  s = pushNews(s, "Waitlist ads. Half are bots. Bots have TAM too.", "evil");
  s.valuation = recalcValuation(s);
  return ok(s, "Funnel is loud.");
}

export function resolveEvent(state: GameState, choiceId: string): ActionResult {
  if (state.eventId === "acquire-close") {
    if (choiceId === "take") {
      let s: GameState = { ...state, ending: "acquired" as EndingId, eventId: null, speed: 0 };
      s = pushNews(s, `Acquired for a number with commas.`, "good");
      return ok(s, "You sold.");
    }
    let s: GameState = { ...state, eventId: null, speed: 1, hype: clamp(state.hype + 3, 0, 100) };
    s = pushNews(s, "You walked. The giant will be back, or it will crush you.", "ok");
    return ok(s, "Independence, expensive.");
  }
  const ev = EVENTS.find((e) => e.id === state.eventId);
  if (!ev) return ok({ ...state, eventId: null, speed: 1 });
  const choice = ev.choices.find((c) => c.id === choiceId) ?? ev.choices[0]!;
  let s = applyEffect({ ...state, eventId: null, speed: 1 }, choice.effects);
  if (!s.eventId) s.speed = s.ending ? 0 : 1;
  s.valuation = recalcValuation(s);
  s = checkMilestones(s);
  return ok(s);
}

export function setSpeed(state: GameState, speed: GameState["speed"]): GameState {
  if (state.ending || state.eventId) return { ...state, speed: 0 };
  return { ...state, speed };
}

export function catchUp(state: GameState): GameState {
  const elapsed = Date.now() - (state.lastRealMs || Date.now());
  const days = Math.min(20, Math.floor(elapsed / DAY_MS));
  if (days < 2) return { ...state, lastRealMs: Date.now() };
  const next = tickDays(state, days);
  return { ...next, lastRealMs: Date.now() };
}


