import type {
  GameEventDef,
  GameState,
  ModelSpec,
  RoleDef,
  RoundDef,
  Stage,
} from "./types";

export const ROLES: RoleDef[] = [
  {
    id: "researcher",
    name: "Research scientist",
    blurb: "Trains models, cites itself, asks for more GPUs.",
    signing: 22_000,
    salaryMo: 14_000,
    research: 1.4,
    hype: 0,
    quality: 0.04,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0,
  },
  {
    id: "gpu",
    name: "Cluster engineer",
    blurb: "Keeps the fans screaming and the cloud bill plausible.",
    signing: 28_000,
    salaryMo: 16_000,
    research: 0.15,
    hype: 0,
    quality: 0.02,
    computeEff: 0.18,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0,
  },
  {
    id: "hype",
    name: "Growth intern",
    blurb: "Threads, waitlists, and a personal brand larger than the product.",
    signing: 4_000,
    salaryMo: 3_500,
    research: 0,
    hype: 0.9,
    quality: -0.06,
    computeEff: 0,
    heat: 0.05,
    scandalDecay: 0,
    demoBoost: 0.04,
  },
  {
    id: "safety",
    name: "Alignment lead",
    blurb: "Writes memos. The memos have memos. Investors love the optics.",
    signing: 32_000,
    salaryMo: 18_000,
    research: 0.2,
    hype: 0.15,
    quality: 0.03,
    computeEff: 0,
    heat: -0.35,
    scandalDecay: 0.08,
    demoBoost: 0,
  },
  {
    id: "mill",
    name: "Paper-mill postdoc",
    blurb: "ArXiv at 2am. Citations optional. Originality negotiable.",
    signing: 12_000,
    salaryMo: 8_000,
    research: 0.85,
    hype: 0.1,
    quality: -0.02,
    computeEff: 0,
    heat: 0.08,
    scandalDecay: 0,
    demoBoost: 0,
  },
  {
    id: "exec",
    name: "Ex-BigTech VP",
    blurb: "Does not write code. Raises the series by existing.",
    signing: 80_000,
    salaryMo: 42_000,
    research: 0,
    hype: 0.35,
    quality: 0,
    computeEff: 0,
    heat: -0.05,
    scandalDecay: 0,
    demoBoost: 0,
  },
  {
    id: "demo",
    name: "Demo engineer",
    blurb: "The one person who can make the slide deck talk.",
    signing: 18_000,
    salaryMo: 11_000,
    research: 0.1,
    hype: 0.2,
    quality: 0.05,
    computeEff: 0,
    heat: 0,
    scandalDecay: 0,
    demoBoost: 0.22,
  },
  {
    id: "legal",
    name: "Crisis counsel",
    blurb: "Bills in six minutes. Buries stories in fourteen.",
    signing: 45_000,
    salaryMo: 22_000,
    research: 0,
    hype: -0.05,
    quality: 0,
    computeEff: 0,
    heat: -0.1,
    scandalDecay: 0.22,
    demoBoost: 0,
  },
];

export const MODELS: ModelSpec[] = [
  {
    id: "toy",
    name: "Garage-7",
    blurb: "Finetuned on blogs and hope. Completes your emails. Sometimes.",
    days: 8,
    compute: 18,
    researchNeed: 8,
    qualityCap: 14,
    hypeOnShip: 10,
  },
  {
    id: "small",
    name: "Loom-13B",
    blurb: "Small enough to demo. Large enough to put on a hoodie.",
    days: 16,
    compute: 70,
    researchNeed: 22,
    qualityCap: 24,
    hypeOnShip: 18,
  },
  {
    id: "mid",
    name: "Frontier-70",
    blurb: "You will say the word frontier. Analysts will repeat it.",
    days: 32,
    compute: 220,
    researchNeed: 48,
    qualityCap: 36,
    hypeOnShip: 30,
  },
  {
    id: "huge",
    name: "Mixture of Hype",
    blurb: "Sparse experts, dense press cycle.",
    days: 48,
    compute: 520,
    researchNeed: 80,
    qualityCap: 46,
    hypeOnShip: 46,
  },
  {
    id: "agi",
    name: "Slide-deck AGI",
    blurb: "Does not exist. The valuation does not know that.",
    days: 72,
    compute: 980,
    researchNeed: 120,
    qualityCap: 55,
    hypeOnShip: 70,
  },
];

export const ROUNDS: RoundDef[] = [
  {
    id: "friends",
    name: "Friends & family",
    blurb: "Aunts, angels, and one dentist who will never let it go.",
    minHype: 4,
    minValuation: 0,
    raise: 90_000,
    dilution: 0.08,
  },
  {
    id: "preseed",
    name: "Pre-seed",
    blurb: "A SAFE, a party round, a photo in a converted garage.",
    minHype: 16,
    minValuation: 800_000,
    raise: 600_000,
    dilution: 0.14,
  },
  {
    id: "seed",
    name: "Seed",
    blurb: "The deck now has a TAM slide. The TAM is 'all cognition'.",
    minHype: 28,
    minValuation: 8_000_000,
    raise: 3_200_000,
    dilution: 0.18,
  },
  {
    id: "a",
    name: "Series A",
    blurb: "Partners who say platform. You say platform back.",
    minHype: 42,
    minValuation: 40_000_000,
    raise: 18_000_000,
    dilution: 0.2,
  },
  {
    id: "b",
    name: "Series B",
    blurb: "Growth. Headcount. A mascot nobody asked for.",
    minHype: 54,
    minValuation: 180_000_000,
    raise: 72_000_000,
    dilution: 0.15,
  },
  {
    id: "c",
    name: "Series C",
    blurb: "The round that defies physics. So does the product.",
    minHype: 64,
    minValuation: 900_000_000,
    raise: 240_000_000,
    dilution: 0.12,
  },
  {
    id: "ipo",
    name: "S-1 / IPO",
    blurb: "Ring the bell. The demo still needs a human in the loop.",
    minHype: 72,
    minValuation: 7_500_000_000,
    raise: 0,
    dilution: 0.08,
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

export function stageFor(s: GameState): Stage {
  const n = s.employees.length;
  if (s.lastRound === "ipo" || s.lastRound === "c") return "tower";
  if (s.lastRound === "b" || n >= 40) return "campus";
  if (s.lastRound === "a" || n >= 22) return "warehouse";
  if (s.lastRound === "seed" || n >= 10) return "office";
  if (s.lastRound === "preseed" || n >= 4) return "loft";
  return "garage";
}

export function headcountCap(stage: Stage): number {
  switch (stage) {
    case "garage":
      return 4;
    case "loft":
      return 10;
    case "office":
      return 22;
    case "warehouse":
      return 48;
    case "campus":
      return 120;
    case "tower":
      return 280;
  }
}

export function stageCopy(stage: Stage): { title: string; line: string; image: string } {
  switch (stage) {
    case "garage":
      return {
        title: "The garage",
        line: "One bulb, three extension cords, a dream with a burn rate.",
        image: "/hq/garage.jpg",
      };
    case "loft":
      return {
        title: "Rented loft",
        line: "Industrial windows. A cage of GPUs. The espresso machine is the culture.",
        image: "/hq/loft.jpg",
      };
    case "office":
      return {
        title: "Proper office",
        line: "Glass, walnut, and a model that still needs a babysitter.",
        image: "/hq/office.jpg",
      };
    case "warehouse":
      return {
        title: "Converted warehouse",
        line: "Headcount as architecture. Someone installed a slide.",
        image: "/hq/loft.jpg",
      };
    case "campus":
      return {
        title: "The campus",
        line: "A reflecting pool. A research wing. A product that almost works.",
        image: "/hq/campus.jpg",
      };
    case "tower":
      return {
        title: "The tower",
        line: "You own the skyline. The demo still crashes on stage two.",
        image: "/hq/campus.jpg",
      };
  }
}

export const EVENTS: GameEventDef[] = [
  {
    id: "intern-agi",
    title: "Intern declares AGI",
    body: "Your intern posted from the company account: we may have achieved AGI. Three vendors you do not compete with moved. You do not have a stock. The intern is in the bathroom.",
    weight: 6,
    minDay: 12,
    choices: [
      {
        id: "blame",
        label: "Blame the intern",
        hint: "Hype dips. The intern updates their headline.",
        effects: { hype: -8, scandal: 3, log: "The intern is now a 'founding-adjacent researcher'.", logTone: "ok" },
      },
      {
        id: "lean",
        label: "Lean in",
        hint: "Call it emergent capabilities. Book the morning shows.",
        effects: { hype: 14, heat: 10, evil: 4, log: "You coined ' proto-AGI' on live television.", logTone: "evil" },
      },
      {
        id: "pull",
        label: "Pull every demo",
        hint: "Adults in the room. Investors hate adults.",
        effects: { hype: -12, quality: 3, heat: -6, log: "Demos paused. The board asks if you are 'still ambitious'.", logTone: "ok" },
      },
    ],
  },
  {
    id: "gpu-shortage",
    title: "The cards are gone",
    body: "Every H100 on the West Coast is spoken for. A broker in a group chat can 'make something happen' if you stop asking where they come from.",
    weight: 7,
    minDay: 8,
    choices: [
      {
        id: "wait",
        label: "Wait it out",
        hint: "Training stalls. Cloud prices triple for two weeks.",
        effects: { shortageDays: 16, log: "GPU shortage. The cluster is a very expensive space heater.", logTone: "bad" },
      },
      {
        id: "broker",
        label: "Wire the broker",
        hint: "You get cards. You also get a story you cannot tell.",
        effects: { gpus: 6, cash: -85_000, evil: 8, scandal: 6, log: "Six cards arrive at 3am. The invoice says 'industrial fans'.", logTone: "evil" },
      },
      {
        id: "rent",
        label: "Rent the whole region",
        hint: "Cloud burst. Finance will scream later.",
        effects: { compute: 80, cash: -120_000, log: "You rented a region's leftover capacity. The bill has its own zip code.", logTone: "ok" },
      },
    ],
  },
  {
    id: "nyt",
    title: "The newspaper calls",
    body: "A reporter has a source who says your open model is a thin wrapper around someone else's API, and that your safety team is two contractors and a Notion doc.",
    weight: 5,
    minDay: 20,
    require: (s) => s.hype >= 20,
    choices: [
      {
        id: "deny",
        label: "Deny everything",
        hint: "Works until it doesn't.",
        effects: { hype: -4, scandal: 8, heat: 4, log: "On the record: 'we train our own weights.' Off the record: silence.", logTone: "bad" },
      },
      {
        id: "memo",
        label: "Publish a 40-page safety memo",
        hint: "Nobody reads it. Everyone cites it.",
        effects: { hype: 6, heat: -8, cash: -15_000, log: "The memo has an appendix on appendixes.", logTone: "good" },
      },
      {
        id: "leak",
        label: "Pre-leak a friendlier story",
        hint: "A podcast, a founder crying, a hoodie.",
        effects: { hype: 10, evil: 5, scandal: 3, log: "You got ahead of it with a vulnerability post.", logTone: "evil" },
      },
    ],
  },
  {
    id: "live-demo",
    title: "It spoke on morning TV",
    body: "The model recommended dissolving the board, unionizing the GPUs, and putting the intern in charge. The host laughed. The host then asked if you were hiring.",
    weight: 6,
    minDay: 18,
    require: (s) => s.models.length > 0,
    choices: [
      {
        id: "joke",
        label: "Call it a joke",
        hint: "Hype holds. Heat rises.",
        effects: { hype: 4, heat: 8, log: "You said 'that's just sampling'. The clip has 4 million loops.", logTone: "ok" },
      },
      {
        id: "align",
        label: "Announce an alignment review",
        hint: "Buys time. Costs a demo slot.",
        effects: { heat: -10, hype: -6, quality: 2, log: "Alignment review announced. Training set aside for a week of slides.", logTone: "good" },
      },
      {
        id: "double",
        label: "Ship the unhinged cut",
        hint: "The internet loves a villain.",
        effects: { hype: 16, scandal: 10, evil: 6, quality: -3, log: "Unhinged cut is the product now. Waitlist doubled.", waitlist: 8000, logTone: "evil" },
      },
    ],
  },
  {
    id: "acquire-sniff",
    title: "A giant wants a meeting",
    body: "A BigTech corporate-development person 'happens to be in town'. They already know your burn, your headcount, and the name of your landlord.",
    weight: 5,
    minDay: 40,
    require: (s) => s.valuation >= 12_000_000 && s.lastRound !== null,
    choices: [
      {
        id: "take",
        label: "Take the offer",
        hint: "Soft landing. Your logo becomes a tooltip.",
        effects: { acquireOffer: 1, log: "Term sheet incoming.", logTone: "good" },
      },
      {
        id: "raise",
        label: "Use them to raise",
        hint: "Walk into the next round with a rumor.",
        effects: { hype: 12, valuationMul: 1.25, log: "You leaked the meeting. The round overheated on purpose.", logTone: "good" },
      },
      {
        id: "snipe",
        label: "Steal their paper while you're there",
        hint: "A USB-C dongle, a hallway, a future lawsuit.",
        effects: { research: 40, evil: 12, scandal: 14, log: "You left with more than a tote bag.", logTone: "evil" },
      },
    ],
  },
  {
    id: "weights-leak",
    title: "The weights walked out",
    body: "A torrent appeared. The file is named like your model. The README is ruder than your docs. Your Discord is a crime scene.",
    weight: 5,
    minDay: 24,
    require: (s) => s.models.length > 0,
    choices: [
      {
        id: "open",
        label: "Say you meant to open-source",
        hint: "Hype spike. Quality narrative dies.",
        effects: { hype: 18, quality: -4, heat: -4, log: "You always planned to 'give it to the community'.", logTone: "good" },
      },
      {
        id: "sue",
        label: "Send the lawyers",
        hint: "Takes cash. Makes you the villain.",
        effects: { cash: -40_000, hype: -10, scandal: -6, log: "Takedowns sent. Mirrors bloom like mushrooms.", logTone: "bad" },
      },
      {
        id: "poison",
        label: "Poison the next dump",
        hint: "A little watermark, a little chaos.",
        effects: { evil: 7, scandal: 5, quality: 2, log: "The next leak classifies recipes as tax law.", logTone: "evil" },
      },
    ],
  },
  {
    id: "board-pivot",
    title: "The board wants a pivot",
    body: "An observer from the last round has discovered agents, then robots, then 'AI for defense'. They would like a new deck by Monday.",
    weight: 5,
    minDay: 30,
    require: (s) => s.lastRound === "seed" || s.lastRound === "a" || s.lastRound === "b",
    choices: [
      {
        id: "obey",
        label: "Pivot by Monday",
        hint: "Product quality resets. Hype gets a new costume.",
        effects: { quality: -12, hype: 8, log: "You are now an agents company. Also robotics. Also defense-adjacent.", logTone: "ok" },
      },
      {
        id: "delay",
        label: "Nod and continue",
        hint: "They will ask again.",
        effects: { hype: -3, heat: 2, log: "You promised a 'strategic review'. Nobody scheduled it.", logTone: "ok" },
      },
      {
        id: "defense",
        label: "Take the defense meeting",
        hint: "Money with a flag on it.",
        effects: { cash: 2_400_000, evil: 10, heat: 12, hype: 6, log: "A quiet contract. A louder NDA.", logTone: "evil" },
      },
    ],
  },
  {
    id: "benchmark",
    title: "Someone reran your numbers",
    body: "A blog with a bird logo claims your SOTA is a spreadsheet error, a contaminated test set, and a cherry on top. They have charts. The charts are mean.",
    weight: 6,
    minDay: 16,
    require: (s) => s.fakeBenches > 0 || s.hype >= 30,
    choices: [
      {
        id: "ignore",
        label: "Do not engage",
        hint: "It might die. It might not.",
        effects: { hype: -6, scandal: 6, log: "You muted the thread. The thread did not mute you.", logTone: "bad" },
      },
      {
        id: "new-bench",
        label: "Publish a new benchmark",
        hint: "You made this one. It loves you.",
        effects: { hype: 8, evil: 6, scandal: 4, log: "Introducing HypeQA. We score 99. We also wrote it.", logTone: "evil" },
      },
      {
        id: "confess",
        label: "Quietly correct the card",
        hint: "Respect. Less money.",
        effects: { hype: -10, quality: 6, scandal: -8, heat: -4, log: "Erratum posted. Two researchers still work here.", logTone: "good" },
      },
    ],
  },
  {
    id: "talent-raid",
    title: "They came with offers",
    body: "A rival is parking SUVs outside. The packages include a signing bonus, a visa lawyer, and 'compute without asking'.",
    weight: 5,
    minDay: 22,
    require: (s) => s.employees.length >= 3,
    choices: [
      {
        id: "counter",
        label: "Counter everyone",
        hint: "Payroll explodes. People stay, for now.",
        effects: { cash: -90_000, hype: 2, log: "You matched. The culture is now the number.", logTone: "ok" },
      },
      {
        id: "letgo",
        label: "Let them walk",
        hint: "Knowledge walks with them.",
        effects: { research: -12, hype: -4, quality: -2, log: "Two laptops, one Discord. They took the lore.", logTone: "bad" },
      },
      {
        id: "ndas",
        label: "Weaponize the NDAs",
        hint: "Ugly. Effective-ish.",
        effects: { cash: -25_000, scandal: 7, evil: 5, log: "Counsel drafted a letter that could stop a train.", logTone: "evil" },
      },
    ],
  },
  {
    id: "cloud-bill",
    title: "The bill has a comma problem",
    body: "Finance forwarded an invoice. Someone left a training job on over the long weekend. The job was a debug print in a loop. The loop was global.",
    weight: 6,
    minDay: 10,
    require: (s) => s.gpus >= 1 || s.compute >= 20,
    choices: [
      {
        id: "pay",
        label: "Pay it",
        hint: "Cash goes. Shame stays.",
        effects: { cash: -70_000, log: "You paid the debug loop. The debug loop did not apologize.", logTone: "bad" },
      },
      {
        id: "argue",
        label: "Argue with the cloud",
        hint: "A credit, maybe. Time, definitely.",
        effects: { cash: -20_000, compute: -10, log: "They 'credited goodwill'. You lost a week.", logTone: "ok" },
      },
      {
        id: "capital",
        label: "Call it a capex story",
        hint: "Investors hear 'scale'.",
        effects: { cash: -70_000, hype: 7, valuationMul: 1.08, log: "The burn is now a slide called Infrastructure.", logTone: "good" },
      },
    ],
  },
  {
    id: "safety-walkout",
    title: "The safety team walks",
    body: "They left a letter on the wiki. It is long, linked, and already on the internet. They want a pause. You have a demo on Thursday.",
    weight: 4,
    minDay: 28,
    require: (s) => s.heat >= 30 || s.evil >= 20,
    choices: [
      {
        id: "pause",
        label: "Pause the demo",
        hint: "Adult hour.",
        effects: { hype: -14, heat: -16, quality: 4, log: "Thursday is now a 'research preview'. The board is previewing their patience.", logTone: "good" },
      },
      {
        id: "replace",
        label: "Hire a friendlier safety team",
        hint: "Theater, restaffed.",
        effects: { cash: -50_000, heat: -4, evil: 8, scandal: 6, log: "New safety team. Their first memo is a press release.", logTone: "evil" },
      },
      {
        id: "ignore-letter",
        label: "Ship Thursday anyway",
        hint: "The letter becomes the story.",
        effects: { hype: 8, scandal: 14, heat: 12, log: "You shipped. The letter shipped harder.", logTone: "bad" },
      },
    ],
  },
  {
    id: "gov",
    title: "A hearing, sort of",
    body: "A staffer wants a briefing. They keep saying 'national asset' and 'guardrails' in the same sentence. There is a flag in the Zoom background.",
    weight: 4,
    minDay: 50,
    require: (s) => s.hype >= 40 && s.valuation >= 80_000_000,
    choices: [
      {
        id: "brief",
        label: "Brief them like a grown-up",
        hint: "Heat down. Hype sideways.",
        effects: { heat: -8, hype: 4, log: "You used the word capability. They used the word report.", logTone: "ok" },
      },
      {
        id: "contract",
        label: "Ask what they will pay",
        hint: "A contract with a seal.",
        effects: { cash: 6_000_000, evil: 8, heat: 6, log: "Pilot program. You are now infrastructure.", logTone: "good" },
      },
      {
        id: "nationalize",
        label: "Offer to be a national lab",
        hint: "You may not get to stay you.",
        effects: { ending: "nationalized", log: "The seal was not a metaphor.", logTone: "ok" },
      },
    ],
  },
  {
    id: "paper-theft",
    title: "The authors noticed",
    body: "A lab across the ocean posted a thread with two PDFs side by side. Yours is on the right. The figures are identical if you squint, and you should not squint.",
    weight: 5,
    minDay: 14,
    require: (s) => s.papersStolen > 0,
    choices: [
      {
        id: "cite",
        label: "Add a citation, quietly",
        hint: "Late. Better than never.",
        effects: { scandal: -6, hype: -5, research: -4, log: "Citation added in v2. v1 is already famous.", logTone: "ok" },
      },
      {
        id: "independent",
        label: "Claim independent discovery",
        hint: "Bold. Actionable.",
        effects: { scandal: 12, evil: 6, hype: -2, log: "Independent discovery. The timestamps disagree.", logTone: "evil" },
      },
      {
        id: "hire-them",
        label: "Offer the authors a job",
        hint: "The oldest trick.",
        effects: { cash: -40_000, scandal: -8, research: 10, log: "They said no. Then maybe. Then a counter.", logTone: "good" },
      },
    ],
  },
  {
    id: "waitlist-fake",
    title: "The waitlist is a vibe",
    body: "Engineering pulled a sample. A lot of the emails bounce. A lot of the rest are the same three people with plus-addressing. Marketing calls this 'top of funnel'.",
    weight: 5,
    minDay: 12,
    require: (s) => s.waitlist >= 4000,
    choices: [
      {
        id: "scrub",
        label: "Scrub the list",
        hint: "The real number is smaller and true.",
        effects: { waitlist: -5000, quality: 3, hype: -6, log: "Waitlist now contains humans. Fewer slides.", logTone: "good" },
      },
      {
        id: "double-down",
        label: "Buy more signups",
        hint: "A vendor in a spreadsheet.",
        effects: { waitlist: 12000, cash: -18_000, evil: 5, scandal: 4, log: "Top of funnel is now a SKU.", logTone: "evil" },
      },
      {
        id: "invite",
        label: "Open invites anyway",
        hint: "The product meets the people.",
        effects: { hype: 5, quality: -3, heat: 3, log: "Invites sent. Support is a graveyard.", logTone: "ok" },
      },
    ],
  },
  {
    id: "useful-fork",
    title: "It actually helped someone",
    body: "A hospital intern used your toy model to draft a letter and it did not hallucinate a law. They sent flowers. Nobody in growth knows what to do with flowers.",
    weight: 3,
    minDay: 25,
    require: (s) => s.quality >= 18,
    choices: [
      {
        id: "product",
        label: "Build that, actually",
        hint: "The long, boring, good path.",
        effects: { quality: 10, hype: -4, heat: -6, log: "You staffed a real product. The intern is now a case study, against their will.", logTone: "good" },
      },
      {
        id: "press",
        label: "Put the flowers on the deck",
        hint: "Everything is content.",
        effects: { hype: 9, quality: -1, log: "The flowers are on slide 4. The intern was not asked.", logTone: "ok" },
      },
      {
        id: "ignore-good",
        label: "Stay on the frontier",
        hint: "Hospitals are not a TAM you can round.",
        effects: { hype: 2, quality: -2, log: "You thanked them and went back to scaling.", logTone: "ok" },
      },
    ],
  },
];

export const ENDING_COPY: Record<
  import("./types").EndingId,
  { title: string; kicker: string; body: string }
> = {
  ipo: {
    title: "You rang the bell",
    kicker: "Public markets",
    body: "The ticker exists. The product still needs a human behind the curtain. Analysts call this a platform. You call this Tuesday. Your garage is a museum now, with better lighting.",
  },
  acquired: {
    title: "You got bought",
    kicker: "Acquired",
    body: "The logo survives as a tooltip. You have a retention package, a quiet office, and a calendar of meetings about meetings. The model is being 'integrated'. Nobody can find it.",
  },
  bankrupt: {
    title: "The lights went out",
    kicker: "Insolvent",
    body: "Payroll bounced. The GPUs are on a truck you do not own. A group chat of ex-employees is writing the oral history, and they are being kind, which is worse.",
  },
  indicted: {
    title: "The other kind of round",
    kicker: "Indicted",
    body: "The press kit now includes a docket number. Counsel says this is a process. The process has a metal detector. Your waitlist, against all odds, went up.",
  },
  useful: {
    title: "It works",
    kicker: "Quiet product",
    body: "You shipped something people use on purpose. Valuation is fine, not cinematic. A nurse still sends notes. This was not the ending the deck wanted. It is the rare one that sleeps.",
  },
  acquihire: {
    title: "Talent, mostly",
    kicker: "Acqui-hire",
    body: "They wanted the people, not the slides. The domain will redirect in 90 days. You keep the hoodie. The hoodie keeps the pizza stain.",
  },
  nationalized: {
    title: "A seal, not a series",
    kicker: "National lab",
    body: "The government was not bluffing. You have a badge, a SCIF, and a model that no longer tweets. History will file you under infrastructure.",
  },
};
