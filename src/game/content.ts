import type {
  AdPack,
  GameEventDef,
  GameState,
  GpuSku,
  MarketCycle,
  ModelClass,
  ModelClassId,
  RoleDef,
  RoundDef,
  Stage,
} from "./types";

export const DAY_MS = 4200;

/** Inverse of chat demand: MAU per live session. Peak concurrency ≈ 2% of DAU, DAU ≈ MAU/3.1. */
export const CHAT_USERS_PER_LIVE = 3.1 * 52;
export const ENT_USERS_PER_LIVE = 1.4 * 52;
export const CHAT_DAU_DIV = 3.1;
export const ENT_DAU_DIV = 1.4;
export const PEAK_CONC_DIV = 52;
export const API_TOK_PER_USER_DAY = 1.9e6;

export const GPU_SKUS: GpuSku[] = [
  {
    id: "h100",
    name: "H100 SXM",
    blurb: "80 GB. ~220 live 8B chats, ~35k users. The card the boom was built on.",
    price: 12_500,
    lead: 4,
    powerDay: 12,
    train: 1,
    infer: 0.42,
    unlock: () => true,
  },
  {
    id: "b200",
    name: "B200",
    blurb: "192 GB HBM3e. ~520 live 8B chats, ~84k users — or ~44 live 70B sessions.",
    price: 31_000,
    lead: 6,
    powerDay: 44,
    train: 2.5,
    infer: 1,
    unlock: (s) => s.lastRound !== null || s.day >= 16 || s.models.length > 0,
  },
  {
    id: "gb200",
    name: "GB200",
    blurb: "A superchip. Two dies. ~1,120 live 8B chats, ~180k users per board.",
    price: 64_000,
    lead: 9,
    powerDay: 82,
    train: 5.2,
    infer: 2.15,
    unlock: (s) =>
      s.lastRound === "a" ||
      s.lastRound === "b" ||
      s.lastRound === "c" ||
      s.lastRound === "ipo" ||
      s.lastRound === "secondary" ||
      s.listed,
  },
];

export const MODEL_CLASSES: ModelClass[] = [
  {
    id: "mini",
    label: "8B",
    params: "8B",
    blurb: "Fits one card. A B200 holds ~520 live chats, about 84k monthly users.",
    flopNeed: 1.8,
    computeNeed: 8,
    researchNeed: 4,
    qualityCap: 34,
    hypeOnShip: 8,
    concurrentPerB200: 520,
    tokPerSecPerB200: 9000,
    minServe: 1,
    chatPrice: 16,
    apiPrice: 0.4,
    entPrice: 48,
    unlock: () => true,
  },
  {
    id: "small",
    label: "13B",
    params: "13B",
    blurb: "Better reasoning, still one card. ~280 live / ~45k users per B200.",
    flopNeed: 16,
    computeNeed: 40,
    researchNeed: 18,
    qualityCap: 44,
    hypeOnShip: 12,
    concurrentPerB200: 280,
    tokPerSecPerB200: 4800,
    minServe: 1,
    chatPrice: 18,
    apiPrice: 0.7,
    entPrice: 72,
    unlock: (s) => s.models.some((m) => m.classId === "mini") || s.research >= 22,
  },
  {
    id: "pro",
    label: "32B",
    params: "32B",
    blurb: "The workhorse. Developers pay. ~96 live / ~15k users per B200.",
    flopNeed: 36,
    computeNeed: 90,
    researchNeed: 36,
    qualityCap: 56,
    hypeOnShip: 18,
    concurrentPerB200: 96,
    tokPerSecPerB200: 1600,
    minServe: 2,
    chatPrice: 22,
    apiPrice: 1.4,
    entPrice: 140,
    unlock: (s) => s.models.some((m) => m.classId === "small") || s.research >= 48,
  },
  {
    id: "max",
    label: "70B",
    params: "70B",
    blurb: "Frontier-shaped. A B200 holds ~44 live 70B chats, about 7k users.",
    flopNeed: 88,
    computeNeed: 220,
    researchNeed: 70,
    qualityCap: 68,
    hypeOnShip: 26,
    concurrentPerB200: 44,
    tokPerSecPerB200: 720,
    minServe: 4,
    chatPrice: 28,
    apiPrice: 3.2,
    entPrice: 240,
    unlock: (s) =>
      s.models.some((m) => m.classId === "pro") ||
      s.lastRound === "seed" ||
      s.lastRound === "a" ||
      s.lastRound === "b" ||
      s.lastRound === "c" ||
      s.listed,
  },
  {
    id: "ultra",
    label: "405B",
    params: "405B",
    blurb: "Needs a pod. 8 B200s as one serving unit. ~8 live / ~1.3k users per card.",
    flopNeed: 240,
    computeNeed: 640,
    researchNeed: 130,
    qualityCap: 80,
    hypeOnShip: 40,
    concurrentPerB200: 8,
    tokPerSecPerB200: 140,
    minServe: 8,
    chatPrice: 36,
    apiPrice: 8,
    entPrice: 480,
    unlock: (s) =>
      s.models.some((m) => m.classId === "max") || s.lastRound === "b" || s.lastRound === "c" || s.listed,
  },
  {
    id: "titan",
    label: "1.8T",
    params: "1.8T",
    blurb: "MoE weather system. Serve it or it sits. ~3 live / ~480 users per B200.",
    flopNeed: 520,
    computeNeed: 1400,
    researchNeed: 220,
    qualityCap: 92,
    hypeOnShip: 56,
    concurrentPerB200: 3,
    tokPerSecPerB200: 55,
    minServe: 16,
    chatPrice: 48,
    apiPrice: 14,
    entPrice: 900,
    unlock: (s) =>
      s.models.some((m) => m.classId === "ultra") || s.lastRound === "c" || s.lastRound === "ipo" || s.listed,
  },
];

export const AD_PACKS: AdPack[] = [
  {
    id: "nudge",
    name: "Waitlist nudge",
    blurb: "A thread, a waitlist, a little shame. Cheapest way to fill Chat.",
    spend: 400,
    users: 2_800,
    days: 6,
  },
  {
    id: "launch",
    name: "Launch campaign",
    blurb: "Product Hunt, a hoodie, a chart. Real inbound.",
    spend: 8_000,
    users: 6_400,
    days: 8,
  },
  {
    id: "blitz",
    name: "Growth blitz",
    blurb: "Paid social until the CAC weeps.",
    spend: 28_000,
    users: 24_000,
    days: 10,
  },
  {
    id: "everywhere",
    name: "Everywhere ads",
    blurb: "Airports. Podcasts. A mascot. Scale, if the cluster can take it.",
    spend: 110_000,
    users: 95_000,
    days: 14,
  },
];

export const ROLES: RoleDef[] = [
  {
    id: "researcher",
    name: "Research scientist",
    blurb: "Cuts training days. Each one makes the next generation faster.",
    signing: 16_000,
    salaryMo: 11_000,
    research: 1.25,
    hype: 0,
    quality: 0.06,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0,
    product: 0,
    sales: 0,
  },
  {
    id: "gpu",
    name: "Cluster engineer",
    blurb: "More tokens per watt — faster jobs and more users per card.",
    signing: 20_000,
    salaryMo: 13_000,
    research: 0.1,
    hype: 0,
    quality: 0.02,
    computeEff: 0.18,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0,
    product: 0,
    sales: 0,
  },
  {
    id: "hype",
    name: "Growth intern",
    blurb: "Ads that work. Threads that sting. Fills the till.",
    signing: 3_200,
    salaryMo: 3_000,
    research: 0,
    hype: 0.5,
    quality: -0.03,
    computeEff: 0,
    heat: 0.04,
    scandalDecay: 0,
    demoBoost: 0.03,
    product: 0.04,
    sales: 0.08,
  },
  {
    id: "product",
    name: "Product lead",
    blurb: "Turns weights into something people pay for.",
    signing: 22_000,
    salaryMo: 14_000,
    research: 0.12,
    hype: 0.06,
    quality: 0.08,
    computeEff: 0,
    heat: -0.04,
    scandalDecay: 0,
    demoBoost: 0.05,
    product: 0.22,
    sales: 0.06,
  },
  {
    id: "sales",
    name: "Enterprise AE",
    blurb: "Closes seats. Speaks in QBR. Work product lives or dies here.",
    signing: 18_000,
    salaryMo: 12_000,
    research: 0,
    hype: 0.04,
    quality: 0,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0.02,
    product: 0.04,
    sales: 0.28,
  },
  {
    id: "safety",
    name: "Alignment lead",
    blurb: "Memos. Investors love the optics.",
    signing: 26_000,
    salaryMo: 15_000,
    research: 0.14,
    hype: 0.08,
    quality: 0.04,
    computeEff: 0,
    heat: -0.28,
    scandalDecay: 0.07,
    demoBoost: 0,
    product: 0,
    sales: 0,
  },
  {
    id: "mill",
    name: "Paper-mill postdoc",
    blurb: "ArXiv at 2am. Originality negotiable. Cheap research.",
    signing: 9_000,
    salaryMo: 6_800,
    research: 0.72,
    hype: 0.06,
    quality: -0.03,
    computeEff: 0,
    heat: 0.05,
    scandalDecay: 0,
    demoBoost: 0,
    product: 0,
    sales: 0,
  },
  {
    id: "exec",
    name: "Ex-BigTech VP",
    blurb: "Does not write code. Raises by existing.",
    signing: 58_000,
    salaryMo: 34_000,
    research: 0,
    hype: 0.26,
    quality: 0,
    computeEff: 0,
    heat: -0.04,
    scandalDecay: 0,
    demoBoost: 0.04,
    product: 0.04,
    sales: 0.1,
  },
  {
    id: "demo",
    name: "Demo engineer",
    blurb: "The one person who can make the deck talk.",
    signing: 14_000,
    salaryMo: 9_500,
    research: 0.08,
    hype: 0.14,
    quality: 0.04,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0.22,
    product: 0.05,
    sales: 0.04,
  },
  {
    id: "legal",
    name: "Crisis counsel",
    blurb: "Bills in six minutes. Buries stories in fourteen.",
    signing: 36_000,
    salaryMo: 18_000,
    research: 0,
    hype: -0.04,
    quality: 0,
    computeEff: 0,
    heat: -0.08,
    scandalDecay: 0.2,
    demoBoost: 0,
    product: 0,
    sales: 0,
  },
];

export const ROUNDS: RoundDef[] = [
  { id: "friends", name: "Friends & family", blurb: "Aunts, angels, one dentist.", minHype: 2, minValuation: 0, raise: 140_000, dilution: 0.08 },
  { id: "preseed", name: "Pre-seed", blurb: "A SAFE and a garage photo.", minHype: 10, minValuation: 600_000, raise: 800_000, dilution: 0.12 },
  { id: "seed", name: "Seed", blurb: "The TAM is all cognition.", minHype: 20, minValuation: 5_500_000, raise: 4_400_000, dilution: 0.16 },
  { id: "a", name: "Series A", blurb: "Partners who say platform.", minHype: 32, minValuation: 26_000_000, raise: 22_000_000, dilution: 0.18 },
  { id: "b", name: "Series B", blurb: "Growth. Headcount. A mascot.", minHype: 42, minValuation: 130_000_000, raise: 80_000_000, dilution: 0.14 },
  { id: "c", name: "Series C", blurb: "The round that defies physics.", minHype: 52, minValuation: 650_000_000, raise: 260_000_000, dilution: 0.1 },
  { id: "ipo", name: "S-1 / IPO", blurb: "Ring the bell. Keep the company.", minHype: 60, minValuation: 4_200_000_000, raise: 0, dilution: 0.1 },
  { id: "secondary", name: "Follow-on offering", blurb: "Public markets, again.", minHype: 48, minValuation: 7_500_000_000, raise: 0, dilution: 0.06 },
];

export const FIRST_NAMES = [
  "Ada", "Jules", "Priya", "Kenji", "Mira", "Theo", "Anika", "Lars", "Noor", "Ezra",
  "Sable", "Rafi", "Ines", "Nico", "Hana", "Omar", "Leif", "Yara", "Sol", "Ivy",
];
export const LAST_NAMES = [
  "Voss", "Chen", "Okoye", "Berg", "Nakamura", "Iyer", "Kade", "Solis", "Qureshi", "Hart",
  "Mbeki", "Diaz", "Krane", "Pahl", "Cho", "Adeyemi", "Rowe", "Sato",
];
export const COMPANY_SEEDS = [
  "Garage Intelligence",
  "Nexus Loom",
  "Vector Forge",
  "Lumen Labs",
  "Attention Capital",
  "Context Window",
  "Helix Ridge",
  "Signal Path",
];
export const RIVAL_NAMES = ["Atlas Mind", "Civic Weights", "Northstar Params"];

export const MARKET_COPY: Record<MarketCycle, { title: string; line: string }> = {
  winter: { title: "AI winter", line: "Multiples compress. Cash is a strategy." },
  quiet: { title: "Quiet tape", line: "Decent labs raise. Loud labs wait." },
  boom: { title: "Boom tape", line: "Every deck is a platform. Yours too." },
  mania: { title: "Mania", line: "Valuation is a weather report." },
};

export function cycleMultiple(cycle: MarketCycle): number {
  switch (cycle) {
    case "winter":
      return 8;
    case "quiet":
      return 18;
    case "boom":
      return 34;
    case "mania":
      return 62;
  }
}

export function skuById(id: GpuSku["id"]): GpuSku {
  return GPU_SKUS.find((g) => g.id === id)!;
}

export function classById(id: ModelClassId): ModelClass {
  return MODEL_CLASSES.find((c) => c.id === id)!;
}

export function roleById(id: RoleDef["id"]): RoleDef {
  return ROLES.find((r) => r.id === id)!;
}

export function familyFrom(company: string): string {
  const skip = new Set([
    "labs",
    "lab",
    "ai",
    "the",
    "inc",
    "intelligence",
    "capital",
    "systems",
    "co",
    "llc",
    "corp",
    "company",
    "group",
    "ventures",
    "tech",
    "technologies",
  ]);
  const parts = company.trim().split(/\s+/).filter(Boolean);
  const good = parts.filter((p) => !skip.has(p.toLowerCase()));
  const raw = (good[0] || parts[0] || "Helix").replace(/[^A-Za-z]/g, "");
  if (raw.length < 2) return "Helix";
  return raw.charAt(0).toUpperCase() + raw.slice(1, 12);
}

export function modelName(family: string, cls: ModelClass, version: number): string {
  const tag = `${family}-${cls.params.replace(/\s+/g, "")}`;
  return version <= 1 ? tag : `${tag}.${version}`;
}

export function productName(modelNameStr: string, kind: "chat" | "api" | "enterprise"): string {
  if (kind === "chat") return `${modelNameStr} Chat`;
  if (kind === "api") return `${modelNameStr} API`;
  return `${modelNameStr} Work`;
}

export function chatUsersPerB200(cls: ModelClass): number {
  return cls.concurrentPerB200 * CHAT_USERS_PER_LIVE;
}

export function livePerCard(sku: GpuSku, cls: ModelClass): number {
  return cls.concurrentPerB200 * sku.infer;
}

export function chatUsersPerCard(sku: GpuSku, cls: ModelClass): number {
  return livePerCard(sku, cls) * CHAT_USERS_PER_LIVE;
}

export function stageFor(s: GameState): Stage {
  const n = s.employees.length;
  const cards = s.gpus.h100 + s.gpus.b200 + s.gpus.gb200;
  if (s.listed || s.lastRound === "c" || s.lastRound === "ipo") return "tower";
  if (s.lastRound === "b" || n >= 36 || cards >= 48) return "campus";
  if (s.lastRound === "a" || n >= 18 || cards >= 16) return "warehouse";
  if (s.lastRound === "seed" || n >= 9 || cards >= 6) return "office";
  if (s.lastRound === "preseed" || n >= 4 || cards >= 3) return "loft";
  return "garage";
}

export function headcountCap(stage: Stage): number {
  switch (stage) {
    case "garage":
      return 5;
    case "loft":
      return 12;
    case "office":
      return 28;
    case "warehouse":
      return 56;
    case "campus":
      return 140;
    case "tower":
      return 400;
  }
}

export function rentPerDay(stage: Stage): number {
  switch (stage) {
    case "garage":
      return 8;
    case "loft":
      return 120;
    case "office":
      return 420;
    case "warehouse":
      return 1_200;
    case "campus":
      return 4_200;
    case "tower":
      return 12_000;
  }
}

export function stageCopy(stage: Stage): { title: string; line: string; image: string } {
  switch (stage) {
    case "garage":
      return { title: "The garage", line: "One bulb. Three cords. A burn rate.", image: "/hq/garage.jpg" };
    case "loft":
      return { title: "Rented loft", line: "Industrial windows. A cage of GPUs.", image: "/hq/loft.jpg" };
    case "office":
      return { title: "Proper office", line: "Glass, walnut, a model that still needs a babysitter.", image: "/hq/office.jpg" };
    case "warehouse":
      return { title: "Converted warehouse", line: "Headcount as architecture.", image: "/hq/warehouse.jpg" };
    case "campus":
      return { title: "The campus", line: "A reflecting pool. A research wing.", image: "/hq/campus.jpg" };
    case "tower":
      return { title: "The tower", line: "You own the skyline. The demo still flinches.", image: "/hq/tower.jpg" };
  }
}

export const FAIL_COPY: Record<import("./types").EndingId, { title: string; kicker: string; body: string }> = {
  bankrupt: {
    title: "The lights went out",
    kicker: "Insolvent",
    body: "Payroll bounced. The GPUs are on a truck you do not own. A group chat of ex-employees is writing the oral history, and they are being kind, which is worse.",
  },
  indicted: {
    title: "The other kind of round",
    kicker: "Indicted",
    body: "The press kit now includes a docket number. Counsel says this is a process. The process has a metal detector.",
  },
  acquired: {
    title: "You got bought",
    kicker: "Acquired",
    body: "The logo survives as a tooltip. You have a retention package and a calendar of meetings about meetings. The model is being integrated. Nobody can find it.",
  },
};

export const MILESTONE_COPY: Record<string, { title: string; body: string }> = {
  first_hire: { title: "Someone else showed up", body: "The garage has a second chair." },
  first_model: { title: "Weights on disk", body: "Eval loss is a vibe. You have a model. Demo it, then sell it." },
  first_product: { title: "People are paying", body: "Not a waitlist. A bill. Put GPUs on Serve and run ads." },
  first_rev: { title: "The till moved", body: "Revenue, however small, is a different sport." },
  unicorn: { title: "Unicorn", body: "A billion on paper. The product is still a demo." },
  ipo: { title: "You rang the bell", body: "Public now. The company keeps going." },
  million_users: { title: "A million", body: "Support is a weather system." },
};

export const EVENTS: GameEventDef[] = [
  {
    id: "intern-agi",
    title: "Intern declares AGI",
    body: "Your intern posted from the company account: we may have achieved AGI. Three vendors you do not compete with moved. The intern is in the bathroom.",
    weight: 6,
    minDay: 20,
    choices: [
      { id: "blame", label: "Blame the intern", hint: "Hype dips.", effects: { hype: -6, scandal: 2, morale: -4, log: "The intern is now a founding-adjacent researcher." } },
      { id: "lean", label: "Lean in", hint: "Call it emergent.", effects: { hype: 12, heat: 8, evil: 3, log: "You coined proto-AGI on live television.", logTone: "evil" } },
      { id: "pull", label: "Pull every demo", hint: "Adults in the room.", effects: { hype: -8, quality: 4, heat: -5, log: "Demos paused." } },
    ],
  },
  {
    id: "gpu-shortage",
    title: "The cards are gone",
    body: "Every accelerator on the coast is spoken for. A broker in a group chat can make something happen if you stop asking where they come from.",
    weight: 7,
    minDay: 14,
    choices: [
      { id: "wait", label: "Wait it out", hint: "Training stalls.", effects: { shortageDays: 22, log: "GPU shortage. The cluster is a very expensive space heater.", logTone: "bad" } },
      { id: "broker", label: "Wire the broker", hint: "You get cards.", effects: { gpus: 4, cash: -72_000, evil: 6, scandal: 5, log: "Four H100s arrive at 3am. The invoice says industrial fans.", logTone: "evil" } },
      { id: "rent", label: "Rent the region", hint: "Cloud burst.", effects: { compute: 90, cash: -95_000, log: "You rented leftover capacity." } },
    ],
  },
  {
    id: "nyt",
    title: "The newspaper calls",
    body: "A reporter has a source who says your open model is a thin wrapper, and that your safety team is two contractors and a Notion doc.",
    weight: 5,
    minDay: 32,
    require: (s) => s.hype >= 18,
    choices: [
      { id: "deny", label: "Deny everything", hint: "Works until it doesn't.", effects: { hype: -3, scandal: 7, heat: 3, log: "On the record: we train our own weights.", logTone: "bad" } },
      { id: "memo", label: "Publish a safety memo", hint: "Nobody reads it.", effects: { hype: 5, heat: -7, cash: -12_000, log: "The memo has an appendix on appendixes.", logTone: "good" } },
      { id: "leak", label: "Pre-leak a friendlier story", hint: "A podcast, a hoodie.", effects: { hype: 8, evil: 4, scandal: 2, log: "You got ahead of it.", logTone: "evil" } },
    ],
  },
  {
    id: "live-demo",
    title: "It spoke on morning TV",
    body: "The model recommended dissolving the board and putting the intern in charge. The host laughed, then asked if you were hiring.",
    weight: 6,
    minDay: 28,
    require: (s) => s.models.length > 0,
    choices: [
      { id: "joke", label: "Call it a joke", hint: "Hype holds.", effects: { hype: 3, heat: 6, log: "You said that's just sampling." } },
      { id: "align", label: "Announce an alignment review", hint: "Buys time.", effects: { heat: -8, hype: -5, quality: 3, log: "Alignment review announced.", logTone: "good" } },
      { id: "double", label: "Ship the unhinged cut", hint: "The internet loves a villain.", effects: { hype: 14, scandal: 8, evil: 5, quality: -2, waitlist: 6000, log: "Unhinged cut is the product now.", logTone: "evil" } },
    ],
  },
  {
    id: "acquire-sniff",
    title: "A giant wants a meeting",
    body: "A corporate-development person happens to be in town. They already know your burn, your headcount, and the name of your landlord.",
    weight: 5,
    minDay: 55,
    require: (s) => s.valuation >= 10_000_000 && s.lastRound !== null && !s.listed,
    choices: [
      { id: "take", label: "Take the offer", hint: "Soft landing.", effects: { acquireOffer: 1, log: "Term sheet incoming.", logTone: "good" } },
      { id: "raise", label: "Use them to raise", hint: "Walk in with a rumor.", effects: { hype: 10, valuationMul: 1.18, log: "You leaked the meeting.", logTone: "good" } },
      { id: "snipe", label: "Steal a paper on the way out", hint: "A hallway, a future lawsuit.", effects: { research: 36, evil: 10, scandal: 12, log: "You left with more than a tote bag.", logTone: "evil" } },
    ],
  },
  {
    id: "weights-leak",
    title: "The weights walked out",
    body: "A torrent appeared. The file is named like your model. Your Discord is a crime scene.",
    weight: 5,
    minDay: 36,
    require: (s) => s.models.length > 0,
    choices: [
      { id: "open", label: "Say you meant to open-source", hint: "Hype spike.", effects: { hype: 14, quality: -3, heat: -3, log: "You always planned to give it to the community.", logTone: "good" } },
      { id: "sue", label: "Send the lawyers", hint: "Takes cash.", effects: { cash: -55_000, hype: -8, scandal: -5, log: "Takedowns sent.", logTone: "bad" } },
      { id: "poison", label: "Poison the next dump", hint: "A little watermark.", effects: { evil: 6, scandal: 4, quality: 2, log: "The next leak classifies recipes as tax law.", logTone: "evil" } },
    ],
  },
  {
    id: "cloud-bill",
    title: "The bill has a comma problem",
    body: "Someone left a training job on over the weekend. The job was a debug print in a loop. The loop was global.",
    weight: 6,
    minDay: 16,
    require: (s) => s.gpus.h100 + s.gpus.b200 + s.gpus.gb200 >= 1 || s.compute >= 24,
    choices: [
      { id: "pay", label: "Pay it", hint: "Cash goes.", effects: { cash: -48_000, morale: -3, log: "You paid the debug loop.", logTone: "bad" } },
      { id: "argue", label: "Argue with the cloud", hint: "A credit, maybe.", effects: { cash: -14_000, compute: -8, log: "They credited goodwill." } },
      { id: "capital", label: "Call it infrastructure", hint: "Investors hear scale.", effects: { cash: -48_000, hype: 6, valuationMul: 1.06, log: "The burn is now a slide.", logTone: "good" } },
    ],
  },
  {
    id: "talent-raid",
    title: "They came with offers",
    body: "A rival is parking cars outside. The packages include a signing bonus, a visa lawyer, and compute without asking.",
    weight: 5,
    minDay: 30,
    require: (s) => s.employees.length >= 3,
    choices: [
      { id: "counter", label: "Counter everyone", hint: "Payroll jumps.", effects: { cash: -70_000, morale: 8, log: "You matched." } },
      { id: "letgo", label: "Let them walk", hint: "Knowledge walks.", effects: { research: -14, hype: -3, quality: -2, morale: -10, log: "They took the lore.", logTone: "bad" } },
      { id: "ndas", label: "Weaponize the NDAs", hint: "Ugly.", effects: { cash: -22_000, scandal: 6, evil: 4, log: "Counsel drafted a letter.", logTone: "evil" } },
    ],
  },
  {
    id: "benchmark",
    title: "Someone reran your numbers",
    body: "A blog claims your SOTA is a spreadsheet error and a contaminated test set. They have charts. The charts are mean.",
    weight: 6,
    minDay: 24,
    require: (s) => s.fakeBenches > 0 || s.hype >= 28,
    choices: [
      { id: "ignore", label: "Do not engage", hint: "It might die.", effects: { hype: -5, scandal: 5, log: "You muted the thread.", logTone: "bad" } },
      { id: "new-bench", label: "Publish a new benchmark", hint: "You made this one.", effects: { hype: 7, evil: 5, scandal: 3, log: "Introducing HypeQA.", logTone: "evil" } },
      { id: "confess", label: "Quietly correct the card", hint: "Respect.", effects: { hype: -8, quality: 7, scandal: -7, heat: -3, log: "Erratum posted.", logTone: "good" } },
    ],
  },
  {
    id: "useful-fork",
    title: "It actually helped someone",
    body: "A hospital intern used your toy model to draft a letter and it did not hallucinate a law. They sent flowers.",
    weight: 4,
    minDay: 40,
    require: (s) => s.quality >= 16,
    choices: [
      { id: "product", label: "Build that, actually", hint: "The long good path.", effects: { quality: 8, hype: -3, heat: -5, users: 2400, log: "You staffed a real product.", logTone: "good" } },
      { id: "press", label: "Put the flowers on the deck", hint: "Everything is content.", effects: { hype: 8, quality: -1, log: "The flowers are on slide four." } },
      { id: "ignore-good", label: "Stay on the frontier", hint: "Hospitals are not a TAM.", effects: { hype: 2, quality: -2, log: "You thanked them and went back to scaling." } },
    ],
  },
  {
    id: "safety-walkout",
    title: "The safety team walks",
    body: "They left a letter on the wiki. It is already on the internet. They want a pause. You have a demo on Thursday.",
    weight: 4,
    minDay: 44,
    require: (s) => s.heat >= 28 || s.evil >= 18,
    choices: [
      { id: "pause", label: "Pause the demo", hint: "Adult hour.", effects: { hype: -10, heat: -14, quality: 4, morale: 6, log: "Thursday is a research preview.", logTone: "good" } },
      { id: "replace", label: "Hire a friendlier safety team", hint: "Theater.", effects: { cash: -42_000, heat: -3, evil: 7, scandal: 5, log: "New safety team.", logTone: "evil" } },
      { id: "ignore-letter", label: "Ship Thursday anyway", hint: "The letter becomes the story.", effects: { hype: 6, scandal: 12, heat: 10, morale: -8, log: "You shipped. The letter shipped harder.", logTone: "bad" } },
    ],
  },
  {
    id: "earnings",
    title: "Quarterly call",
    body: "Analysts want users who pay, not users who wait. The slide is still a waitlist.",
    weight: 6,
    minDay: 80,
    publicOnly: true,
    require: (s) => s.listed,
    choices: [
      { id: "honest", label: "Guide down, calmly", hint: "Stock stumbles.", effects: { hype: -6, scandal: -4, quality: 2, log: "You guided down." } },
      { id: "beat", label: "Beat with a metric you invented", hint: "The street loves a KPI.", effects: { hype: 9, evil: 4, scandal: 3, log: "Introducing engaged inference hours.", logTone: "evil" } },
      { id: "buyback", label: "Announce a buyback", hint: "Cash for a ticker.", effects: { cash: -2_400_000, hype: 6, log: "Buyback authorized.", logTone: "good" } },
    ],
  },
  {
    id: "gov",
    title: "A hearing, sort of",
    body: "A staffer wants a briefing. They keep saying national asset and guardrails in the same sentence.",
    weight: 4,
    minDay: 70,
    require: (s) => s.hype >= 36 && s.valuation >= 60_000_000,
    choices: [
      { id: "brief", label: "Brief them like a grown-up", hint: "Heat down.", effects: { heat: -7, hype: 3, log: "You used the word capability." } },
      { id: "contract", label: "Ask what they will pay", hint: "A contract with a seal.", effects: { cash: 4_800_000, evil: 6, heat: 5, users: 8000, log: "Pilot program.", logTone: "good" } },
      { id: "stay", label: "Stay independent", hint: "No seal.", effects: { hype: 4, heat: 4, log: "You smiled and kept the keys." } },
    ],
  },
  {
    id: "paper-theft",
    title: "The authors noticed",
    body: "A lab posted two PDFs side by side. Yours is on the right. The figures are identical if you squint.",
    weight: 5,
    minDay: 22,
    require: (s) => s.papersStolen > 0,
    choices: [
      { id: "cite", label: "Add a citation, quietly", hint: "Late.", effects: { scandal: -5, hype: -4, research: -3, log: "Citation added in v2." } },
      { id: "independent", label: "Claim independent discovery", hint: "Bold.", effects: { scandal: 10, evil: 5, hype: -2, log: "Independent discovery.", logTone: "evil" } },
      { id: "hire-them", label: "Offer the authors a job", hint: "The oldest trick.", effects: { cash: -36_000, scandal: -6, research: 12, morale: 4, log: "They said no. Then maybe.", logTone: "good" } },
    ],
  },
];
