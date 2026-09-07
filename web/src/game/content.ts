import type {
  Era,
  GameEventDef,
  GameState,
  MarketCycle,
  ModelSpec,
  RoleDef,
  RoundDef,
  Stage,
} from "./types";

export const DAY_MS = 3400;

export const ROLES: RoleDef[] = [
  {
    id: "researcher",
    name: "Research scientist",
    blurb: "Trains models. Asks for more cards.",
    signing: 18_000,
    salaryMo: 12_000,
    research: 1.2,
    hype: 0,
    quality: 0.05,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0,
    product: 0,
  },
  {
    id: "gpu",
    name: "Cluster engineer",
    blurb: "Keeps the fans honest.",
    signing: 22_000,
    salaryMo: 14_000,
    research: 0.1,
    hype: 0,
    quality: 0.02,
    computeEff: 0.16,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0,
    product: 0,
  },
  {
    id: "hype",
    name: "Growth intern",
    blurb: "Threads, waitlists, a personal brand.",
    signing: 3_500,
    salaryMo: 3_200,
    research: 0,
    hype: 0.55,
    quality: -0.04,
    computeEff: 0,
    heat: 0.04,
    scandalDecay: 0,
    demoBoost: 0.03,
    product: 0.02,
  },
  {
    id: "product",
    name: "Product lead",
    blurb: "Turns weights into something people pay for.",
    signing: 24_000,
    salaryMo: 15_000,
    research: 0.15,
    hype: 0.08,
    quality: 0.08,
    computeEff: 0,
    heat: -0.04,
    scandalDecay: 0,
    demoBoost: 0.06,
    product: 0.22,
  },
  {
    id: "safety",
    name: "Alignment lead",
    blurb: "Memos. Investors love the optics.",
    signing: 28_000,
    salaryMo: 16_000,
    research: 0.15,
    hype: 0.1,
    quality: 0.04,
    computeEff: 0,
    heat: -0.28,
    scandalDecay: 0.07,
    demoBoost: 0,
    product: 0,
  },
  {
    id: "mill",
    name: "Paper-mill postdoc",
    blurb: "ArXiv at 2am. Originality negotiable.",
    signing: 10_000,
    salaryMo: 7_200,
    research: 0.75,
    hype: 0.08,
    quality: -0.03,
    computeEff: 0,
    heat: 0.06,
    scandalDecay: 0,
    demoBoost: 0,
    product: 0,
  },
  {
    id: "exec",
    name: "Ex-BigTech VP",
    blurb: "Does not write code. Raises by existing.",
    signing: 64_000,
    salaryMo: 36_000,
    research: 0,
    hype: 0.28,
    quality: 0,
    computeEff: 0,
    heat: -0.04,
    scandalDecay: 0,
    demoBoost: 0.04,
    product: 0.04,
  },
  {
    id: "demo",
    name: "Demo engineer",
    blurb: "The one person who can make the deck talk.",
    signing: 16_000,
    salaryMo: 10_000,
    research: 0.08,
    hype: 0.16,
    quality: 0.04,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0.2,
    product: 0.05,
  },
  {
    id: "legal",
    name: "Crisis counsel",
    blurb: "Bills in six minutes. Buries stories in fourteen.",
    signing: 40_000,
    salaryMo: 20_000,
    research: 0,
    hype: -0.04,
    quality: 0,
    computeEff: 0,
    heat: -0.08,
    scandalDecay: 0.2,
    demoBoost: 0,
    product: 0,
  },
];

export const MODELS: ModelSpec[] = [
  {
    id: "toy",
    name: "Garage-7",
    blurb: "Finetuned on blogs and hope.",
    days: 8,
    compute: 18,
    researchNeed: 10,
    qualityCap: 16,
    hypeOnShip: 8,
    arpu: 0.04,
    unlock: () => true,
  },
  {
    id: "small",
    name: "Loom-13B",
    blurb: "Small enough to demo. Large enough for a hoodie.",
    days: 20,
    compute: 72,
    researchNeed: 26,
    qualityCap: 28,
    hypeOnShip: 14,
    arpu: 0.09,
    unlock: (s) => s.research >= 16 || s.day >= 18 || s.models.length > 0,
  },
  {
    id: "mid",
    name: "Frontier-70",
    blurb: "You will say the word frontier.",
    days: 36,
    compute: 200,
    researchNeed: 52,
    qualityCap: 40,
    hypeOnShip: 24,
    arpu: 0.18,
    unlock: (s) =>
      s.lastRound === "seed" ||
      s.lastRound === "a" ||
      s.lastRound === "b" ||
      s.lastRound === "c" ||
      s.lastRound === "ipo" ||
      s.lastRound === "secondary" ||
      s.research >= 48,
  },
  {
    id: "huge",
    name: "Mixture of Hype",
    blurb: "Sparse experts, dense press cycle.",
    days: 56,
    compute: 440,
    researchNeed: 90,
    qualityCap: 52,
    hypeOnShip: 36,
    arpu: 0.32,
    unlock: (s) =>
      s.lastRound === "a" ||
      s.lastRound === "b" ||
      s.lastRound === "c" ||
      s.lastRound === "ipo" ||
      s.lastRound === "secondary" ||
      s.listed,
  },
  {
    id: "agi",
    name: "Slide-deck AGI",
    blurb: "Does not exist. The valuation does not know that.",
    days: 88,
    compute: 800,
    researchNeed: 130,
    qualityCap: 64,
    hypeOnShip: 52,
    arpu: 0.55,
    unlock: (s) =>
      s.lastRound === "b" || s.lastRound === "c" || s.lastRound === "ipo" || s.lastRound === "secondary" || s.listed,
  },
  {
    id: "titan",
    name: "Planetary-1T",
    blurb: "A cluster the size of a weather system.",
    days: 128,
    compute: 1500,
    researchNeed: 200,
    qualityCap: 74,
    hypeOnShip: 64,
    arpu: 0.9,
    unlock: (s) => s.listed || s.lastRound === "c" || s.lastRound === "ipo" || s.lastRound === "secondary",
  },
  {
    id: "sovereign",
    name: "Sovereign weights",
    blurb: "A model with a flag, whether you asked for one or not.",
    days: 170,
    compute: 2600,
    researchNeed: 280,
    qualityCap: 86,
    hypeOnShip: 72,
    arpu: 1.4,
    unlock: (s) => s.day >= 360 || (s.listed && s.day >= 220),
  },
];

export const ROUNDS: RoundDef[] = [
  {
    id: "friends",
    name: "Friends & family",
    blurb: "Aunts, angels, and one dentist.",
    minHype: 3,
    minValuation: 0,
    raise: 120_000,
    dilution: 0.08,
  },
  {
    id: "preseed",
    name: "Pre-seed",
    blurb: "A SAFE and a photo in a converted garage.",
    minHype: 12,
    minValuation: 700_000,
    raise: 750_000,
    dilution: 0.12,
  },
  {
    id: "seed",
    name: "Seed",
    blurb: "The TAM is now 'all cognition'.",
    minHype: 22,
    minValuation: 6_000_000,
    raise: 4_200_000,
    dilution: 0.16,
  },
  {
    id: "a",
    name: "Series A",
    blurb: "Partners who say platform.",
    minHype: 34,
    minValuation: 28_000_000,
    raise: 22_000_000,
    dilution: 0.18,
  },
  {
    id: "b",
    name: "Series B",
    blurb: "Growth. Headcount. A mascot.",
    minHype: 44,
    minValuation: 140_000_000,
    raise: 80_000_000,
    dilution: 0.14,
  },
  {
    id: "c",
    name: "Series C",
    blurb: "The round that defies physics.",
    minHype: 54,
    minValuation: 700_000_000,
    raise: 260_000_000,
    dilution: 0.1,
  },
  {
    id: "ipo",
    name: "S-1 / IPO",
    blurb: "Ring the bell. Keep the company.",
    minHype: 62,
    minValuation: 4_500_000_000,
    raise: 0,
    dilution: 0.1,
  },
  {
    id: "secondary",
    name: "Follow-on offering",
    blurb: "Public markets, again.",
    minHype: 50,
    minValuation: 8_000_000_000,
    raise: 0,
    dilution: 0.06,
  },
];

export const FIRST_NAMES = [
  "Ada",
  "Jules",
  "Priya",
  "Kenji",
  "Mira",
  "Theo",
  "Anika",
  "Lars",
  "Noor",
  "Ezra",
  "Sable",
  "Rafi",
  "Ines",
  "Nico",
  "Hana",
  "Omar",
  "Leif",
  "Yara",
  "Sol",
  "Ivy",
];

export const LAST_NAMES = [
  "Voss",
  "Chen",
  "Okoye",
  "Berg",
  "Nakamura",
  "Iyer",
  "Kade",
  "Solis",
  "Qureshi",
  "Hart",
  "Mbeki",
  "Diaz",
  "Krane",
  "Pahl",
  "Cho",
  "Adeyemi",
  "Rowe",
  "Sato",
];

export const COMPANY_SEEDS = [
  "Garage Intelligence",
  "Nexus Loom",
  "Vector Forge",
  "Lumen Labs",
  "Attention Capital",
  "Pile Parameters",
  "Stochastic Parrot",
  "Context Window",
];

export const RIVAL_NAMES = ["Atlas Mind", "Helix Ridge", "Civic Weights"];

export const MARKET_COPY: Record<MarketCycle, { title: string; line: string }> = {
  winter: { title: "AI winter", line: "Multiples compress. Cash is a strategy." },
  quiet: { title: "Quiet tape", line: "Decent labs raise. Loud labs wait." },
  boom: { title: "Boom tape", line: "Every deck is a platform. Yours too." },
  mania: { title: "Mania", line: "Valuation is a weather report." },
};

export function cycleMultiple(cycle: MarketCycle): number {
  switch (cycle) {
    case "winter":
      return 7;
    case "quiet":
      return 16;
    case "boom":
      return 32;
    case "mania":
      return 58;
  }
}

export function eraFor(s: GameState): Era {
  if (s.listed && s.day >= 400) return "empire";
  if (s.listed) return "public";
  if (s.lastRound === "b" || s.lastRound === "c") return "scale";
  if (s.lastRound === "seed" || s.lastRound === "a") return "startup";
  return "garage";
}

export function stageFor(s: GameState): Stage {
  const n = s.employees.length;
  if (s.listed || s.lastRound === "c" || s.lastRound === "ipo") return "tower";
  if (s.lastRound === "b" || n >= 36) return "campus";
  if (s.lastRound === "a" || n >= 18) return "warehouse";
  if (s.lastRound === "seed" || n >= 9) return "office";
  if (s.lastRound === "preseed" || n >= 4) return "loft";
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
      return 35;
    case "loft":
      return 140;
    case "office":
      return 480;
    case "warehouse":
      return 1_400;
    case "campus":
      return 4_800;
    case "tower":
      return 14_000;
  }
}

export function stageCopy(stage: Stage): { title: string; line: string; image: string } {
  switch (stage) {
    case "garage":
      return {
        title: "The garage",
        line: "One bulb. Three cords. A burn rate.",
        image: "/hq/garage.jpg",
      };
    case "loft":
      return {
        title: "Rented loft",
        line: "Industrial windows. A cage of GPUs.",
        image: "/hq/loft.jpg",
      };
    case "office":
      return {
        title: "Proper office",
        line: "Glass, walnut, a model that still needs a babysitter.",
        image: "/hq/office.jpg",
      };
    case "warehouse":
      return {
        title: "Converted warehouse",
        line: "Headcount as architecture.",
        image: "/hq/warehouse.jpg",
      };
    case "campus":
      return {
        title: "The campus",
        line: "A reflecting pool. A research wing.",
        image: "/hq/campus.jpg",
      };
    case "tower":
      return {
        title: "The tower",
        line: "You own the skyline. The demo still flinches.",
        image: "/hq/tower.jpg",
      };
  }
}

export const EVENTS: GameEventDef[] = [
  {
    id: "intern-agi",
    title: "Intern declares AGI",
    body: "Your intern posted from the company account: we may have achieved AGI. Three vendors you do not compete with moved. The intern is in the bathroom.",
    weight: 6,
    minDay: 20,
    choices: [
      {
        id: "blame",
        label: "Blame the intern",
        hint: "Hype dips. Headline updates.",
        effects: { hype: -6, scandal: 2, morale: -4, log: "The intern is now a founding-adjacent researcher.", logTone: "ok" },
      },
      {
        id: "lean",
        label: "Lean in",
        hint: "Call it emergent. Book the morning shows.",
        effects: { hype: 12, heat: 8, evil: 3, log: "You coined proto-AGI on live television.", logTone: "evil" },
      },
      {
        id: "pull",
        label: "Pull every demo",
        hint: "Adults in the room. Investors hate adults.",
        effects: { hype: -8, quality: 4, heat: -5, log: "Demos paused. The board asks if you are still ambitious.", logTone: "ok" },
      },
    ],
  },
  {
    id: "gpu-shortage",
    title: "The cards are gone",
    body: "Every accelerator on the coast is spoken for. A broker in a group chat can make something happen if you stop asking where they come from.",
    weight: 7,
    minDay: 14,
    choices: [
      {
        id: "wait",
        label: "Wait it out",
        hint: "Training stalls. Cloud prices jump.",
        effects: { shortageDays: 22, log: "GPU shortage. The cluster is a very expensive space heater.", logTone: "bad" },
      },
      {
        id: "broker",
        label: "Wire the broker",
        hint: "You get cards. You also get a story.",
        effects: { gpus: 4, cash: -72_000, evil: 6, scandal: 5, log: "Four cards arrive at 3am. The invoice says industrial fans.", logTone: "evil" },
      },
      {
        id: "rent",
        label: "Rent the region",
        hint: "Cloud burst. Finance screams later.",
        effects: { compute: 90, cash: -95_000, log: "You rented leftover capacity. The bill has its own zip code.", logTone: "ok" },
      },
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
      {
        id: "deny",
        label: "Deny everything",
        hint: "Works until it doesn't.",
        effects: { hype: -3, scandal: 7, heat: 3, log: "On the record: we train our own weights.", logTone: "bad" },
      },
      {
        id: "memo",
        label: "Publish a safety memo",
        hint: "Nobody reads it. Everyone cites it.",
        effects: { hype: 5, heat: -7, cash: -12_000, log: "The memo has an appendix on appendixes.", logTone: "good" },
      },
      {
        id: "leak",
        label: "Pre-leak a friendlier story",
        hint: "A podcast, a hoodie, a tear.",
        effects: { hype: 8, evil: 4, scandal: 2, log: "You got ahead of it with a vulnerability post.", logTone: "evil" },
      },
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
      {
        id: "joke",
        label: "Call it a joke",
        hint: "Hype holds. Heat rises.",
        effects: { hype: 3, heat: 6, log: "You said that's just sampling. The clip has four million loops.", logTone: "ok" },
      },
      {
        id: "align",
        label: "Announce an alignment review",
        hint: "Buys time. Costs a slot.",
        effects: { heat: -8, hype: -5, quality: 3, log: "Alignment review announced. Training set aside for slides.", logTone: "good" },
      },
      {
        id: "double",
        label: "Ship the unhinged cut",
        hint: "The internet loves a villain.",
        effects: {
          hype: 14,
          scandal: 8,
          evil: 5,
          quality: -2,
          waitlist: 6000,
          log: "Unhinged cut is the product now.",
          logTone: "evil",
        },
      },
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
      {
        id: "take",
        label: "Take the offer",
        hint: "Soft landing. Logo becomes a tooltip.",
        effects: { acquireOffer: 1, log: "Term sheet incoming.", logTone: "good" },
      },
      {
        id: "raise",
        label: "Use them to raise",
        hint: "Walk into the next round with a rumor.",
        effects: { hype: 10, valuationMul: 1.18, log: "You leaked the meeting. The round overheated on purpose.", logTone: "good" },
      },
      {
        id: "snipe",
        label: "Steal a paper on the way out",
        hint: "A hallway, a future lawsuit.",
        effects: { research: 36, evil: 10, scandal: 12, log: "You left with more than a tote bag.", logTone: "evil" },
      },
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
      {
        id: "open",
        label: "Say you meant to open-source",
        hint: "Hype spike. Moat dies a little.",
        effects: { hype: 14, quality: -3, heat: -3, log: "You always planned to give it to the community.", logTone: "good" },
      },
      {
        id: "sue",
        label: "Send the lawyers",
        hint: "Takes cash. Makes you the villain.",
        effects: { cash: -55_000, hype: -8, scandal: -5, log: "Takedowns sent. Mirrors bloom.", logTone: "bad" },
      },
      {
        id: "poison",
        label: "Poison the next dump",
        hint: "A little watermark, a little chaos.",
        effects: { evil: 6, scandal: 4, quality: 2, log: "The next leak classifies recipes as tax law.", logTone: "evil" },
      },
    ],
  },
  {
    id: "cloud-bill",
    title: "The bill has a comma problem",
    body: "Someone left a training job on over the weekend. The job was a debug print in a loop. The loop was global.",
    weight: 6,
    minDay: 16,
    require: (s) => s.gpus >= 1 || s.compute >= 24,
    choices: [
      {
        id: "pay",
        label: "Pay it",
        hint: "Cash goes. Shame stays.",
        effects: { cash: -48_000, morale: -3, log: "You paid the debug loop. The debug loop did not apologize.", logTone: "bad" },
      },
      {
        id: "argue",
        label: "Argue with the cloud",
        hint: "A credit, maybe.",
        effects: { cash: -14_000, compute: -8, log: "They credited goodwill. You lost a week.", logTone: "ok" },
      },
      {
        id: "capital",
        label: "Call it infrastructure",
        hint: "Investors hear scale.",
        effects: { cash: -48_000, hype: 6, valuationMul: 1.06, log: "The burn is now a slide called Infrastructure.", logTone: "good" },
      },
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
      {
        id: "counter",
        label: "Counter everyone",
        hint: "Payroll jumps. People stay.",
        effects: { cash: -70_000, morale: 8, log: "You matched. The culture is now the number.", logTone: "ok" },
      },
      {
        id: "letgo",
        label: "Let them walk",
        hint: "Knowledge walks with them.",
        effects: { research: -14, hype: -3, quality: -2, morale: -10, log: "Two laptops left. They took the lore.", logTone: "bad" },
      },
      {
        id: "ndas",
        label: "Weaponize the NDAs",
        hint: "Ugly. Effective-ish.",
        effects: { cash: -22_000, scandal: 6, evil: 4, log: "Counsel drafted a letter that could stop a train.", logTone: "evil" },
      },
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
      {
        id: "ignore",
        label: "Do not engage",
        hint: "It might die.",
        effects: { hype: -5, scandal: 5, log: "You muted the thread. The thread did not mute you.", logTone: "bad" },
      },
      {
        id: "new-bench",
        label: "Publish a new benchmark",
        hint: "You made this one. It loves you.",
        effects: { hype: 7, evil: 5, scandal: 3, log: "Introducing HypeQA. We score 99. We also wrote it.", logTone: "evil" },
      },
      {
        id: "confess",
        label: "Quietly correct the card",
        hint: "Respect. Less money.",
        effects: { hype: -8, quality: 7, scandal: -7, heat: -3, log: "Erratum posted. Two researchers still work here.", logTone: "good" },
      },
    ],
  },
  {
    id: "useful-fork",
    title: "It actually helped someone",
    body: "A hospital intern used your toy model to draft a letter and it did not hallucinate a law. They sent flowers. Growth does not know what to do with flowers.",
    weight: 4,
    minDay: 40,
    require: (s) => s.quality >= 16,
    choices: [
      {
        id: "product",
        label: "Build that, actually",
        hint: "The long, boring, good path.",
        effects: {
          quality: 8,
          hype: -3,
          heat: -5,
          users: 2400,
          log: "You staffed a real product. The intern is now a case study.",
          logTone: "good",
        },
      },
      {
        id: "press",
        label: "Put the flowers on the deck",
        hint: "Everything is content.",
        effects: { hype: 8, quality: -1, log: "The flowers are on slide four.", logTone: "ok" },
      },
      {
        id: "ignore-good",
        label: "Stay on the frontier",
        hint: "Hospitals are not a TAM you can round.",
        effects: { hype: 2, quality: -2, log: "You thanked them and went back to scaling.", logTone: "ok" },
      },
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
      {
        id: "pause",
        label: "Pause the demo",
        hint: "Adult hour.",
        effects: { hype: -10, heat: -14, quality: 4, morale: 6, log: "Thursday is now a research preview.", logTone: "good" },
      },
      {
        id: "replace",
        label: "Hire a friendlier safety team",
        hint: "Theater, restaffed.",
        effects: { cash: -42_000, heat: -3, evil: 7, scandal: 5, log: "New safety team. First memo is a press release.", logTone: "evil" },
      },
      {
        id: "ignore-letter",
        label: "Ship Thursday anyway",
        hint: "The letter becomes the story.",
        effects: { hype: 6, scandal: 12, heat: 10, morale: -8, log: "You shipped. The letter shipped harder.", logTone: "bad" },
      },
    ],
  },
  {
    id: "earnings",
    title: "Quarterly call",
    body: "Analysts want a number. The number they want is users who pay, not users who wait. The slide is still a waitlist.",
    weight: 6,
    minDay: 80,
    publicOnly: true,
    require: (s) => s.listed,
    choices: [
      {
        id: "honest",
        label: "Guide down, calmly",
        hint: "Stock stumbles. Scandal cools.",
        effects: { hype: -6, scandal: -4, quality: 2, log: "You guided down. The tape hated it. The tape will forget.", logTone: "ok" },
      },
      {
        id: "beat",
        label: "Beat with a metric you invented",
        hint: "The street loves a new KPI.",
        effects: { hype: 9, evil: 4, scandal: 3, log: "Introducing engaged inference hours. We are crushing it.", logTone: "evil" },
      },
      {
        id: "buyback",
        label: "Announce a buyback",
        hint: "Cash for a ticker.",
        effects: { cash: -2_400_000, hype: 6, log: "Buyback authorized. The garage is now a capital-allocation story.", logTone: "good" },
      },
    ],
  },
  {
    id: "gov",
    title: "A hearing, sort of",
    body: "A staffer wants a briefing. They keep saying national asset and guardrails in the same sentence. There is a flag in the Zoom background.",
    weight: 4,
    minDay: 70,
    require: (s) => s.hype >= 36 && s.valuation >= 60_000_000,
    choices: [
      {
        id: "brief",
        label: "Brief them like a grown-up",
        hint: "Heat down. Hype sideways.",
        effects: { heat: -7, hype: 3, log: "You used the word capability. They used the word report.", logTone: "ok" },
      },
      {
        id: "contract",
        label: "Ask what they will pay",
        hint: "A contract with a seal.",
        effects: { cash: 4_800_000, evil: 6, heat: 5, users: 8000, log: "Pilot program. You are now infrastructure.", logTone: "good" },
      },
      {
        id: "nationalize",
        label: "Stay independent",
        hint: "No seal. No SCIF. Still you.",
        effects: { hype: 4, heat: 4, log: "You smiled and kept the keys.", logTone: "ok" },
      },
    ],
  },
  {
    id: "paper-theft",
    title: "The authors noticed",
    body: "A lab across the ocean posted two PDFs side by side. Yours is on the right. The figures are identical if you squint.",
    weight: 5,
    minDay: 22,
    require: (s) => s.papersStolen > 0,
    choices: [
      {
        id: "cite",
        label: "Add a citation, quietly",
        hint: "Late. Better than never.",
        effects: { scandal: -5, hype: -4, research: -3, log: "Citation added in v2. v1 is already famous.", logTone: "ok" },
      },
      {
        id: "independent",
        label: "Claim independent discovery",
        hint: "Bold. Actionable.",
        effects: { scandal: 10, evil: 5, hype: -2, log: "Independent discovery. The timestamps disagree.", logTone: "evil" },
      },
      {
        id: "hire-them",
        label: "Offer the authors a job",
        hint: "The oldest trick.",
        effects: { cash: -36_000, scandal: -6, research: 12, morale: 4, log: "They said no. Then maybe. Then a counter.", logTone: "good" },
      },
    ],
  },
  {
    id: "winter-shift",
    title: "The tape turned",
    body: "A fund that loved you last quarter is writing a letter about capital discipline. Multiples are a rumor now.",
    weight: 4,
    minDay: 50,
    require: (s) => s.market === "mania" || s.market === "boom",
    choices: [
      {
        id: "cut",
        label: "Freeze hiring",
        hint: "Runway extends. Morale dips.",
        effects: { hype: -4, morale: -8, cash: 0, log: "Hiring freeze. The espresso machine is suddenly loud.", logTone: "ok" },
      },
      {
        id: "raise-now",
        label: "Raise into the fear",
        hint: "Dilution later. Oxygen now.",
        effects: { cash: 1_800_000, hype: -2, log: "A down round in all but name. You called it a structured primary.", logTone: "ok" },
      },
      {
        id: "double-down",
        label: "Spend through it",
        hint: "Winners write the history.",
        effects: { hype: 5, heat: 3, log: "You bought more cards. Winter is a vibe, you said.", logTone: "good" },
      },
    ],
  },
];

export const FAIL_COPY: Record<
  import("./types").EndingId,
  { title: string; kicker: string; body: string }
> = {
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
  first_model: { title: "It finished training", body: "Eval loss is a vibe. You have weights." },
  first_product: { title: "People are paying", body: "Not a waitlist. A bill." },
  unicorn: { title: "Unicorn", body: "A billion on paper. The product is still a demo." },
  ipo: { title: "You rang the bell", body: "Public now. The company keeps going." },
  useful: { title: "It works", body: "Quiet product. The rare ending the deck did not want — except it is not an ending." },
  million_users: { title: "A million", body: "Support is a weather system." },
};
