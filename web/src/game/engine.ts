import {
  COMPANY_SEEDS,
  ENDING_COPY,
  EVENTS,
  FIRST_NAMES,
  LAST_NAMES,
  MODELS,
  ROLES,
  ROUNDS,
  headcountCap,
  stageFor,
} from "./content";
import { clamp } from "./format";
import type {
  ActionResult,
  Effect,
  Employee,
  EndingId,
  GameState,
  ModelSpecId,
  NewsItem,
  RoleId,
  RoundId,
  Tone,
} from "./types";
import { SAVE_VERSION } from "./types";

const GPU_COST = 14_000;
const GPU_POWER_DAY = 22;
const CLOUD_BURST_COST = 9_500;
const CLOUD_BURST_COMPUTE = 28;
const HYPE_DECAY = 0.28;
const BROKE_LIMIT = 16;

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
  return { ...u.state, news: [item, ...u.state.news].slice(0, 48) };
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
  if (fx.valuationMul) s.valuation = Math.max(0, s.valuation * fx.valuationMul);
  if (fx.flag) s.flags = { ...s.flags, [fx.flag]: true };
  if (fx.shortageDays) s.gpuShortageUntil = Math.max(s.gpuShortageUntil, s.day + fx.shortageDays);
  if (fx.log) s = pushNews(s, fx.log, fx.logTone ?? "ok");
  if (fx.ending) s.ending = fx.ending;
  if (fx.acquireOffer) {
    const offer = Math.round(s.valuation * (0.85 + (s.hype / 500)));
    s.acquireOffer = offer;
    s.eventId = "acquire-close";
  }
  return s;
}

function count(state: GameState, role: RoleId): number {
  return state.employees.filter((e) => e.roleId === role).length;
}

function totals(state: GameState) {
  return state.employees.reduce(
    (acc, e) => {
      const role = ROLES.find((r) => r.id === e.roleId);
      if (!role) return acc;
      acc.salary += role.salaryMo;
      acc.research += role.research;
      acc.hype += role.hype;
      acc.quality += role.quality;
      acc.eff += role.computeEff;
      acc.heat += role.heat;
      acc.scandalDecay += role.scandalDecay;
      acc.demo += role.demoBoost;
      return acc;
    },
    { salary: 0, research: 0, hype: 0, quality: 0, eff: 1, heat: 0, scandalDecay: 0, demo: 0 },
  );
}

export function dailyBurn(state: GameState): number {
  const t = totals(state);
  return t.salary / 30 + state.gpus * GPU_POWER_DAY;
}

export function recalcValuation(state: GameState): number {
  const staff = state.employees.length;
  const roundBoost =
    state.lastRound === "c"
      ? 18
      : state.lastRound === "b"
        ? 8
        : state.lastRound === "a"
          ? 3.2
          : state.lastRound === "seed"
            ? 1.6
            : 1;
  const base =
    180_000 +
    state.cash * 0.35 +
    staff * 220_000 +
    state.hype * 140_000 +
    state.waitlist * 18 +
    state.models.length * 520_000 +
    state.fakeBenches * 1_800_000 +
    state.quality * 90_000 +
    state.gpus * 40_000;
  return Math.max(50_000, Math.round(base * roundBoost));
}

export function createGame(company: string, seed = Date.now()): GameState {
  const name = company.trim() || COMPANY_SEEDS[seed % COMPANY_SEEDS.length]!;
  const founderName = "You";
  const founder: Employee = {
    id: "founder",
    roleId: "researcher",
    name: founderName,
    hiredOn: 0,
  };
  let s: GameState = {
    version: SAVE_VERSION,
    seed,
    rng: seed >>> 0,
    day: 0,
    speed: 1,
    company: name,
    cash: 48_000,
    equity: 1,
    hype: 7,
    quality: 5,
    research: 4,
    compute: 12,
    gpus: 0,
    scandal: 0,
    heat: 4,
    evil: 0,
    valuation: 250_000,
    lastRound: null,
    nextRound: "friends",
    pivots: 0,
    lastPivotDay: -90,
    gpuShortageUntil: 0,
    employees: [founder],
    training: null,
    models: [],
    demoCooldown: 0,
    waitlistCooldown: 0,
    stealCooldown: 0,
    fakeCooldown: 0,
    news: [],
    eventId: null,
    waitlist: 120,
    papersStolen: 0,
    fakeBenches: 0,
    daysBroke: 0,
    flags: {},
    ending: null,
    acquireOffer: 0,
    lastRealMs: Date.now(),
  };
  s = pushNews(s, `${s.company} opens in a garage. The first GPU is a metaphor.`, "ok");
  s.valuation = recalcValuation(s);
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

function maybeEvent(state: GameState): GameState {
  if (state.eventId || state.ending) return state;
  if (state.day === 0 || state.day % 6 !== 0) return state;
  const r = roll(state);
  let s = r.state;
  const chance = 0.38 + s.evil * 0.004 + s.hype * 0.0015 + s.scandal * 0.002;
  if (r.value > chance) return s;
  const eligible = EVENTS.filter((ev) => {
    if (ev.minDay && s.day < ev.minDay) return false;
    if (ev.require && !ev.require(s)) return false;
    if (s.flags[`ev-${ev.id}`] && ev.id !== "gpu-shortage" && ev.id !== "cloud-bill") return false;
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

function checkEndings(state: GameState): GameState {
  if (state.ending) return state;
  if (state.scandal >= 92 && state.evil >= 40) {
    return { ...state, ending: "indicted", speed: 0 };
  }
  if (state.quality >= 62 && state.scandal < 28 && state.day >= 80) {
    return { ...state, ending: "useful", speed: 0 };
  }
  if (state.cash < 0) {
    const broke = state.daysBroke + 1;
    if (broke >= BROKE_LIMIT) return { ...state, daysBroke: broke, ending: "bankrupt", speed: 0 };
    return { ...state, daysBroke: broke };
  }
  return { ...state, daysBroke: 0 };
}

export function tickDay(state: GameState): GameState {
  if (state.ending || state.eventId) return state;
  let s: GameState = { ...state, day: state.day + 1 };
  const t = totals(s);
  const burn = dailyBurn(s);
  s.cash -= burn;
  const shortage = s.day < s.gpuShortageUntil;
  const gpuYield = s.gpus * (shortage ? 0.35 : 1.15) * t.eff;
  s.compute += gpuYield;
  s.research += t.research;
  s.hype = clamp(s.hype + t.hype - HYPE_DECAY, 0, 100);
  s.quality = clamp(s.quality + t.quality * 0.25, 0, 100);
  s.heat = clamp(s.heat + t.heat * 0.25, 0, 100);
  s.scandal = clamp(s.scandal - t.scandalDecay * 0.2 - 0.08, 0, 100);
  if (s.demoCooldown > 0) s.demoCooldown -= 1;
  if (s.waitlistCooldown > 0) s.waitlistCooldown -= 1;
  if (s.stealCooldown > 0) s.stealCooldown -= 1;
  if (s.fakeCooldown > 0) s.fakeCooldown -= 1;
  s.waitlist = Math.floor(s.waitlist * 1.002 + s.hype * 0.8);

  if (s.training) {
    const job = { ...s.training, remaining: s.training.remaining - 1 };
    if (job.remaining <= 0) {
      const spec = MODELS.find((m) => m.id === job.specId)!;
      const q = clamp(spec.qualityCap * 0.45 + s.quality * 0.35 + (Math.min(s.research, spec.researchNeed) / spec.researchNeed) * 12, 3, spec.qualityCap);
      const done = {
        id: `m-${s.day}-${spec.id}`,
        specId: spec.id,
        quality: q,
        shipped: false,
        fakeBench: false,
      };
      s.models = [...s.models, done];
      s.training = null;
      s.research = Math.max(0, s.research - spec.researchNeed * 0.4);
      s = pushNews(s, `${spec.name} finished training. Eval loss is a vibe.`, "good");
    } else {
      s.training = job;
    }
  }

  s.valuation = recalcValuation(s);
  s = checkEndings(s);
  if (!s.ending) s = maybeEvent(s);
  if (s.day > 0 && s.day % 30 === 0) {
    s = pushNews(s, `Month close. Burn ${Math.round(burn)}/day. Runway is a feeling.`, burn > s.cash / 20 ? "bad" : "ok");
  }
  return s;
}

export function tickDays(state: GameState, n: number): GameState {
  let s = state;
  const cap = Math.min(n, 400);
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
  if (state.cash < role.signing) return no(state, `Need ${role.signing.toLocaleString()} for a signing bonus.`);
  const named = pickName(state);
  let s = named.state;
  const person: Employee = { id: `e-${s.day}-${s.employees.length}`, roleId, name: named.name, hiredOn: s.day };
  s = {
    ...s,
    cash: s.cash - role.signing,
    employees: [...s.employees, person],
  };
  s.valuation = recalcValuation(s);
  s = pushNews(s, `${person.name} joins as ${role.name}.`, "good");
  return ok(s, `${person.name} is in.`);
}

export function fire(state: GameState, id: string): ActionResult {
  if (id === "founder") return no(state, "You cannot fire yourself. That is called quitting, and the rent is due.");
  const emp = state.employees.find((e) => e.id === id);
  if (!emp) return no(state, "Already gone.");
  let s: GameState = { ...state, employees: state.employees.filter((e) => e.id !== id), cash: state.cash - 4_000 };
  s = pushNews(s, `${emp.name} is 'pursuing other opportunities'. You paid for the laptop.`, "bad");
  s.valuation = recalcValuation(s);
  return ok(s, `${emp.name} packed a box.`);
}

export function buyGpu(state: GameState, n = 1): ActionResult {
  if (state.day < state.gpuShortageUntil) return no(state, "Shortage. Brokers only, and they are not taking calls.");
  const cost = GPU_COST * n;
  if (state.cash < cost) return no(state, "Not enough cash for silicon.");
  let s: GameState = { ...state, cash: state.cash - cost, gpus: state.gpus + n };
  s = pushNews(s, `Acquired ${n} accelerator${n > 1 ? "s" : ""}. The room got louder.`, "good");
  s.valuation = recalcValuation(s);
  return ok(s, "Cards inbound.");
}

export function burstCloud(state: GameState): ActionResult {
  const cost = state.day < state.gpuShortageUntil ? CLOUD_BURST_COST * 3 : CLOUD_BURST_COST;
  if (state.cash < cost) return no(state, "Cloud would like to be paid first.");
  let s: GameState = { ...state, cash: state.cash - cost, compute: state.compute + CLOUD_BURST_COMPUTE };
  s = pushNews(s, "Rented a burst of someone else's cluster.", "ok");
  return ok(s, "Burst scheduled.");
}

export function startTrain(state: GameState, specId: ModelSpecId): ActionResult {
  if (state.training) return no(state, "A job is already on the cluster.");
  const spec = MODELS.find((m) => m.id === specId);
  if (!spec) return no(state, "Unknown recipe.");
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
  const chance = clamp(0.28 + t.demo + model.quality / 140 + s.hype / 220 - s.heat / 180, 0.08, 0.92);
  const viral = r.value < chance;
  const flop = r.value > chance + 0.35;
  const hypeGain = viral ? spec.hypeOnShip * (flop ? 0.2 : 1) : spec.hypeOnShip * 0.35;
  s.hype = clamp(s.hype + hypeGain, 0, 100);
  s.demoCooldown = 9;
  s.models = s.models.map((m) => (m.id === modelId ? { ...m, shipped: true } : m));
  s.waitlist += viral ? 3500 + Math.round(s.hype * 40) : 400;
  if (flop) {
    s.heat = clamp(s.heat + 8, 0, 100);
    s = pushNews(s, `Live demo of ${spec.name} ate itself. Comments are a nature documentary.`, "bad");
    return ok(s, "It flopped. Clip is immortal.");
  }
  if (viral) {
    s = pushNews(s, `${spec.name} demo went feral. Waitlist is a weather system.`, "good");
    s.valuation = recalcValuation(s);
    return ok(s, "It went viral. Product pending.");
  }
  s = pushNews(s, `${spec.name} demo was fine. Fine does not raise.`, "ok");
  s.valuation = recalcValuation(s);
  return ok(s, "Polite applause.");
}

export function raiseRound(state: GameState): ActionResult {
  const round = ROUNDS.find((r) => r.id === state.nextRound);
  if (!round) return no(state, "No round left but the bell.");
  if (state.hype < round.minHype) return no(state, `Need hype ${round.minHype}. You have ${Math.round(state.hype)}.`);
  if (state.valuation < round.minValuation) {
    return no(state, "Valuation is not a story they will sit through yet.");
  }
  if (round.id === "ipo") {
    let s: GameState = {
      ...state,
      lastRound: "ipo",
      ending: "ipo",
      speed: 0,
      equity: state.equity * (1 - round.dilution),
    };
    s = pushNews(s, "S-1 filed. The garage is now a brand film.", "good");
    return ok(s, "You are public. The product is not.");
  }
  const nextIndex = ROUNDS.findIndex((r) => r.id === round.id) + 1;
  const next = ROUNDS[nextIndex]?.id ?? "ipo";
  let s: GameState = {
    ...state,
    cash: state.cash + round.raise,
    equity: state.equity * (1 - round.dilution),
    lastRound: round.id,
    nextRound: next as RoundId,
    hype: clamp(state.hype + 6, 0, 100),
  };
  s.valuation = recalcValuation(s);
  s = pushNews(s, `Closed ${round.name}: ${round.raise.toLocaleString()} in, ${Math.round(round.dilution * 100)}% out.`, "good");
  return ok(s, `${round.name} is in the bank.`);
}

export function pivot(state: GameState): ActionResult {
  if (state.day - state.lastPivotDay < 70) {
    return no(state, "You just pivoted. Let the scars heal.");
  }
  let s: GameState = {
    ...state,
    pivots: state.pivots + 1,
    lastPivotDay: state.day,
    quality: clamp(state.quality * 0.35, 1, 20),
    hype: clamp(state.hype + 10 - state.pivots * 2, 0, 100),
    research: state.research * 0.55,
  };
  if (state.pivots >= 4) s.scandal = clamp(s.scandal + 8, 0, 100);
  s = pushNews(s, "New thesis. Same GPUs. The deck has a different animal on the cover.", "ok");
  return ok(s, "You pivoted. Again.");
}

export function stealPaper(state: GameState): ActionResult {
  if (state.stealCooldown > 0) return no(state, "The copier is overheated.");
  if (count(state, "researcher") + count(state, "mill") < 1) {
    return no(state, "Need someone who can read a PDF.");
  }
  const r = roll(state);
  let s = r.state;
  s.research += 28 + count(s, "mill") * 8;
  s.evil += 6;
  s.papersStolen += 1;
  s.stealCooldown = 12;
  if (r.value < 0.22 + s.papersStolen * 0.04) {
    s.scandal = clamp(s.scandal + 14, 0, 100);
    s = pushNews(s, "You lifted a paper. The figures still have their watermark.", "evil");
    return ok(s, "Stolen — and noticed.");
  }
  s = pushNews(s, "A 'related work' section appeared overnight. Very related.", "evil");
  return ok(s, "Knowledge, acquired.");
}

export function fakeBenchmark(state: GameState, modelId: string): ActionResult {
  if (state.fakeCooldown > 0) return no(state, "The leaderboard is suspicious of you this week.");
  const model = state.models.find((m) => m.id === modelId);
  if (!model) return no(state, "Train something before you lie about it.");
  const r = roll(state);
  let s = r.state;
  s.hype = clamp(s.hype + 14, 0, 100);
  s.evil += 8;
  s.fakeBenches += 1;
  s.fakeCooldown = 16;
  s.models = s.models.map((m) => (m.id === modelId ? { ...m, fakeBench: true } : m));
  s.valuation = recalcValuation(s);
  if (r.value < 0.3) {
    s.scandal = clamp(s.scandal + 10, 0, 100);
    s = pushNews(s, "SOTA claimed. A grad student in another timezone has questions.", "evil");
    return ok(s, "The chart is a fiction. For now it holds.");
  }
  s = pushNews(s, "New SOTA. The test set went to the same school as the train set.", "evil");
  return ok(s, "Leaderboard updated itself.");
}

export function farmWaitlist(state: GameState): ActionResult {
  if (state.waitlistCooldown > 0) return no(state, "The ads are still running.");
  const cost = 6_000;
  if (state.cash < cost) return no(state, "Engagement farming is not free.");
  let s: GameState = {
    ...state,
    cash: state.cash - cost,
    waitlist: state.waitlist + 9000,
    hype: clamp(state.hype + 5, 0, 100),
    quality: clamp(state.quality - 1.5, 0, 100),
    waitlistCooldown: 8,
    evil: state.evil + 2,
  };
  s = pushNews(s, "Waitlist ads. Half are bots. Bots have TAM too.", "evil");
  s.valuation = recalcValuation(s);
  return ok(s, "Funnel go brrr.");
}

export function resolveEvent(state: GameState, choiceId: string): ActionResult {
  if (state.eventId === "acquire-close") {
    if (choiceId === "take") {
      let s: GameState = { ...state, ending: "acquired" as EndingId, eventId: null, speed: 0 };
      s = pushNews(s, `Acquired for a number with commas. ${ENDING_COPY.acquired.kicker}.`, "good");
      return ok(s, "You sold.");
    }
    let s: GameState = { ...state, eventId: null, speed: 1, hype: clamp(state.hype + 4, 0, 100) };
    s = pushNews(s, "You walked. The giant will be back, or it will crush you. Both, maybe.", "ok");
    return ok(s, "Independence, expensive.");
  }
  const ev = EVENTS.find((e) => e.id === state.eventId);
  if (!ev) {
    return ok({ ...state, eventId: null, speed: 1 });
  }
  const choice = ev.choices.find((c) => c.id === choiceId) ?? ev.choices[0]!;
  let s = applyEffect({ ...state, eventId: null, speed: 1 }, choice.effects);
  if (s.ending === "acquired" || choice.effects.acquireOffer) {
    /* acquire-close is set inside applyEffect */
  }
  if (!s.eventId) s.speed = s.ending ? 0 : 1;
  s.valuation = recalcValuation(s);
  return ok(s);
}

export function setSpeed(state: GameState, speed: GameState["speed"]): GameState {
  if (state.ending || state.eventId) return { ...state, speed: 0 };
  return { ...state, speed };
}

export function catchUp(state: GameState): GameState {
  const elapsed = Date.now() - (state.lastRealMs || Date.now());
  const days = Math.min(36, Math.floor(elapsed / 900));
  if (days < 2) return { ...state, lastRealMs: Date.now() };
  const next = tickDays(state, days);
  return { ...next, lastRealMs: Date.now() };
}

export { GPU_COST, CLOUD_BURST_COST, totals };

