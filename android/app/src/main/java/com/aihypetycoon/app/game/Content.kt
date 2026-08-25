package com.aihypetycoon.app.game

object Content {
    val roles = listOf(
        RoleDef("researcher", "Research scientist", "Trains models, cites itself, asks for more GPUs.", 22000, 14000, 1.4, 0.0, 0.04, 0.0, 0.0, 0.0, 0.0),
        RoleDef("gpu", "Cluster engineer", "Keeps the fans screaming and the cloud bill plausible.", 28000, 16000, 0.15, 0.0, 0.02, 0.18, 0.0, 0.0, 0.0),
        RoleDef("hype", "Growth intern", "Threads, waitlists, and a personal brand larger than the product.", 4000, 3500, 0.0, 0.9, -0.06, 0.0, 0.05, 0.0, 0.04),
        RoleDef("safety", "Alignment lead", "Writes memos. Investors love the optics.", 32000, 18000, 0.2, 0.15, 0.03, 0.0, -0.35, 0.08, 0.0),
        RoleDef("mill", "Paper-mill postdoc", "ArXiv at 2am. Originality negotiable.", 12000, 8000, 0.85, 0.1, -0.02, 0.0, 0.08, 0.0, 0.0),
        RoleDef("exec", "Ex-BigTech VP", "Does not write code. Raises the series by existing.", 80000, 42000, 0.0, 0.35, 0.0, 0.0, -0.05, 0.0, 0.0),
        RoleDef("demo", "Demo engineer", "The one person who can make the slide deck talk.", 18000, 11000, 0.1, 0.2, 0.05, 0.0, 0.0, 0.0, 0.22),
        RoleDef("legal", "Crisis counsel", "Bills in six minutes. Buries stories in fourteen.", 45000, 22000, 0.0, -0.05, 0.0, 0.0, -0.1, 0.22, 0.0),
    )

    val models = listOf(
        ModelSpec("toy", "Garage-7", "Finetuned on blogs and hope.", 8, 18, 8, 14, 10),
        ModelSpec("small", "Loom-13B", "Small enough to demo. Large enough for a hoodie.", 16, 70, 22, 24, 18),
        ModelSpec("mid", "Frontier-70", "You will say the word frontier.", 32, 220, 48, 36, 30),
        ModelSpec("huge", "Mixture of Hype", "Sparse experts, dense press cycle.", 48, 520, 80, 46, 46),
        ModelSpec("agi", "Slide-deck AGI", "Does not exist. The valuation does not know that.", 72, 980, 120, 55, 70),
    )

    val rounds = listOf(
        RoundDef("friends", "Friends & family", "Aunts, angels, one dentist.", 4, 0, 90_000, 0.08),
        RoundDef("preseed", "Pre-seed", "A SAFE and a garage photo.", 16, 800_000, 600_000, 0.14),
        RoundDef("seed", "Seed", "The TAM is all cognition.", 28, 8_000_000, 3_200_000, 0.18),
        RoundDef("a", "Series A", "Partners who say platform.", 42, 40_000_000, 18_000_000, 0.2),
        RoundDef("b", "Series B", "Growth. Headcount. A mascot.", 54, 180_000_000, 72_000_000, 0.15),
        RoundDef("c", "Series C", "The round that defies physics.", 64, 900_000_000, 240_000_000, 0.12),
        RoundDef("ipo", "S-1 / IPO", "Ring the bell. Demo still needs a human.", 72, 7_500_000_000L, 0, 0.08),
    )

    val firstNames = listOf("Ada", "Jules", "Priya", "Kenji", "Mira", "Theo", "Anika", "Lars", "Noor", "Ezra", "Sable", "Rafi", "Ines", "Nico", "Hana", "Omar")
    val lastNames = listOf("Voss", "Chen", "Okoye", "Berg", "Nakamura", "Iyer", "Kade", "Solis", "Qureshi", "Hart", "Mbeki", "Diaz", "Krane", "Pahl", "Cho", "Adeyemi")
    val companySeeds = listOf("Garage Intelligence", "Nexus Loom", "Vector Forge", "Lumen Labs", "Attention Capital", "Stochastic Parrot")

    val events = listOf(
        GameEvent("intern-agi", "Intern declares AGI", "Your intern posted from the company account: we may have achieved AGI. Three vendors you do not compete with moved. You do not have a stock.", 6, 12),
        GameEvent("gpu-shortage", "The cards are gone", "Every H100 on the West Coast is spoken for. A broker in a group chat can make something happen if you stop asking where they come from.", 7, 8),
        GameEvent("nyt", "The newspaper calls", "A reporter has a source who says your open model is a thin wrapper around someone else's API.", 5, 20),
        GameEvent("live-demo", "It spoke on morning TV", "The model recommended dissolving the board, unionizing the GPUs, and putting the intern in charge.", 6, 18),
        GameEvent("acquire-sniff", "A giant wants a meeting", "A BigTech corp-dev person happens to be in town. They already know your burn.", 5, 40),
        GameEvent("weights-leak", "The weights walked out", "A torrent appeared. The file is named like your model. Your Discord is a crime scene.", 5, 24),
        GameEvent("board-pivot", "The board wants a pivot", "An observer discovered agents, then robots, then AI for defense. They would like a new deck by Monday.", 5, 30),
        GameEvent("benchmark", "Someone reran your numbers", "A blog claims your SOTA is a spreadsheet error and a contaminated test set.", 6, 16),
        GameEvent("talent-raid", "They came with offers", "A rival is parking SUVs outside. Packages include a visa lawyer and compute without asking.", 5, 22),
        GameEvent("cloud-bill", "The bill has a comma problem", "Someone left a training job on over the long weekend. The job was a debug print in a loop.", 6, 10),
        GameEvent("safety-walkout", "The safety team walks", "They left a letter on the wiki. They want a pause. You have a demo on Thursday.", 4, 28),
        GameEvent("gov", "A hearing, sort of", "A staffer wants a briefing. They keep saying national asset and guardrails in the same sentence.", 4, 50),
        GameEvent("paper-theft", "The authors noticed", "A lab posted two PDFs side by side. Yours is on the right. The figures are identical if you squint.", 5, 14),
        GameEvent("waitlist-fake", "The waitlist is a vibe", "A lot of the emails bounce. Marketing calls this top of funnel.", 5, 12),
        GameEvent("useful-fork", "It actually helped someone", "A hospital intern used your toy model to draft a letter and it did not hallucinate a law.", 3, 25),
    )

    fun choices(id: String): List<EventChoice> = when (id) {
        "intern-agi" -> listOf(
            EventChoice("blame", "Blame the intern", "Hype dips.", Effect(hype = -8.0, scandal = 3.0, log = "The intern is now a founding-adjacent researcher.")),
            EventChoice("lean", "Lean in", "Call it emergent capabilities.", Effect(hype = 14.0, heat = 10.0, evil = 4.0, log = "You coined proto-AGI on live television.", logTone = "evil")),
            EventChoice("pull", "Pull every demo", "Adults in the room.", Effect(hype = -12.0, quality = 3.0, heat = -6.0, log = "Demos paused. The board asks if you are still ambitious.")),
        )
        "gpu-shortage" -> listOf(
            EventChoice("wait", "Wait it out", "Cloud prices triple.", Effect(shortageDays = 16, log = "GPU shortage. The cluster is a space heater.", logTone = "bad")),
            EventChoice("broker", "Wire the broker", "You get cards. You get a story.", Effect(gpus = 6, cash = -85000.0, evil = 8.0, scandal = 6.0, log = "Six cards arrive at 3am. The invoice says industrial fans.", logTone = "evil")),
            EventChoice("rent", "Rent the whole region", "Finance will scream later.", Effect(compute = 80.0, cash = -120000.0, log = "You rented a region's leftover capacity.")),
        )
        "nyt" -> listOf(
            EventChoice("deny", "Deny everything", "Works until it doesn't.", Effect(hype = -4.0, scandal = 8.0, heat = 4.0, log = "On the record: we train our own weights.", logTone = "bad")),
            EventChoice("memo", "Publish a safety memo", "Nobody reads it. Everyone cites it.", Effect(hype = 6.0, heat = -8.0, cash = -15000.0, log = "The memo has an appendix on appendixes.", logTone = "good")),
            EventChoice("leak", "Pre-leak a friendlier story", "A podcast, a founder crying.", Effect(hype = 10.0, evil = 5.0, scandal = 3.0, log = "You got ahead of it with a vulnerability post.", logTone = "evil")),
        )
        "live-demo" -> listOf(
            EventChoice("joke", "Call it a joke", "Hype holds. Heat rises.", Effect(hype = 4.0, heat = 8.0, log = "You said that's just sampling.")),
            EventChoice("align", "Announce an alignment review", "Buys time.", Effect(heat = -10.0, hype = -6.0, quality = 2.0, log = "Alignment review announced.", logTone = "good")),
            EventChoice("double", "Ship the unhinged cut", "The internet loves a villain.", Effect(hype = 16.0, scandal = 10.0, evil = 6.0, quality = -3.0, waitlist = 8000, log = "Unhinged cut is the product now.", logTone = "evil")),
        )
        "acquire-sniff" -> listOf(
            EventChoice("take", "Take the offer", "Soft landing.", Effect(acquireOffer = true, log = "Term sheet incoming.", logTone = "good")),
            EventChoice("raise", "Use them to raise", "Walk in with a rumor.", Effect(hype = 12.0, valuationMul = 1.25, log = "You leaked the meeting.", logTone = "good")),
            EventChoice("snipe", "Steal their paper", "A hallway, a future lawsuit.", Effect(research = 40.0, evil = 12.0, scandal = 14.0, log = "You left with more than a tote bag.", logTone = "evil")),
        )
        "weights-leak" -> listOf(
            EventChoice("open", "Say you meant to open-source", "Hype spike.", Effect(hype = 18.0, quality = -4.0, heat = -4.0, log = "You always planned to give it to the community.", logTone = "good")),
            EventChoice("sue", "Send the lawyers", "Takes cash.", Effect(cash = -40000.0, hype = -10.0, scandal = -6.0, log = "Takedowns sent. Mirrors bloom.", logTone = "bad")),
            EventChoice("poison", "Poison the next dump", "A little watermark.", Effect(evil = 7.0, scandal = 5.0, quality = 2.0, log = "The next leak classifies recipes as tax law.", logTone = "evil")),
        )
        "board-pivot" -> listOf(
            EventChoice("obey", "Pivot by Monday", "Quality resets.", Effect(quality = -12.0, hype = 8.0, log = "You are now an agents company. Also robotics.")),
            EventChoice("delay", "Nod and continue", "They will ask again.", Effect(hype = -3.0, heat = 2.0, log = "You promised a strategic review.")),
            EventChoice("defense", "Take the defense meeting", "Money with a flag.", Effect(cash = 2_400_000.0, evil = 10.0, heat = 12.0, hype = 6.0, log = "A quiet contract. A louder NDA.", logTone = "evil")),
        )
        "benchmark" -> listOf(
            EventChoice("ignore", "Do not engage", "It might die.", Effect(hype = -6.0, scandal = 6.0, log = "You muted the thread.", logTone = "bad")),
            EventChoice("new-bench", "Publish a new benchmark", "You made this one.", Effect(hype = 8.0, evil = 6.0, scandal = 4.0, log = "Introducing HypeQA. We score 99.", logTone = "evil")),
            EventChoice("confess", "Quietly correct the card", "Respect. Less money.", Effect(hype = -10.0, quality = 6.0, scandal = -8.0, heat = -4.0, log = "Erratum posted.", logTone = "good")),
        )
        "talent-raid" -> listOf(
            EventChoice("counter", "Counter everyone", "Payroll explodes.", Effect(cash = -90000.0, hype = 2.0, log = "You matched. The culture is now the number.")),
            EventChoice("letgo", "Let them walk", "Knowledge walks.", Effect(research = -12.0, hype = -4.0, quality = -2.0, log = "They took the lore.", logTone = "bad")),
            EventChoice("ndas", "Weaponize the NDAs", "Ugly. Effective-ish.", Effect(cash = -25000.0, scandal = 7.0, evil = 5.0, log = "Counsel drafted a letter that could stop a train.", logTone = "evil")),
        )
        "cloud-bill" -> listOf(
            EventChoice("pay", "Pay it", "Cash goes.", Effect(cash = -70000.0, log = "You paid the debug loop.", logTone = "bad")),
            EventChoice("argue", "Argue with the cloud", "A credit, maybe.", Effect(cash = -20000.0, compute = -10.0, log = "They credited goodwill.")),
            EventChoice("capital", "Call it a capex story", "Investors hear scale.", Effect(cash = -70000.0, hype = 7.0, valuationMul = 1.08, log = "The burn is now a slide called Infrastructure.", logTone = "good")),
        )
        "safety-walkout" -> listOf(
            EventChoice("pause", "Pause the demo", "Adult hour.", Effect(hype = -14.0, heat = -16.0, quality = 4.0, log = "Thursday is now a research preview.", logTone = "good")),
            EventChoice("replace", "Hire a friendlier safety team", "Theater, restaffed.", Effect(cash = -50000.0, heat = -4.0, evil = 8.0, scandal = 6.0, log = "New safety team. First memo is a press release.", logTone = "evil")),
            EventChoice("ignore-letter", "Ship Thursday anyway", "The letter becomes the story.", Effect(hype = 8.0, scandal = 14.0, heat = 12.0, log = "You shipped. The letter shipped harder.", logTone = "bad")),
        )
        "gov" -> listOf(
            EventChoice("brief", "Brief them like a grown-up", "Heat down.", Effect(heat = -8.0, hype = 4.0, log = "You used the word capability.")),
            EventChoice("contract", "Ask what they will pay", "A contract with a seal.", Effect(cash = 6_000_000.0, evil = 8.0, heat = 6.0, log = "Pilot program. You are now infrastructure.", logTone = "good")),
            EventChoice("nationalize", "Offer to be a national lab", "You may not stay you.", Effect(ending = "nationalized", log = "The seal was not a metaphor.")),
        )
        "paper-theft" -> listOf(
            EventChoice("cite", "Add a citation, quietly", "Late. Better than never.", Effect(scandal = -6.0, hype = -5.0, research = -4.0, log = "Citation added in v2.")),
            EventChoice("independent", "Claim independent discovery", "Bold.", Effect(scandal = 12.0, evil = 6.0, hype = -2.0, log = "Independent discovery. The timestamps disagree.", logTone = "evil")),
            EventChoice("hire-them", "Offer the authors a job", "The oldest trick.", Effect(cash = -40000.0, scandal = -8.0, research = 10.0, log = "They said no. Then maybe.", logTone = "good")),
        )
        "waitlist-fake" -> listOf(
            EventChoice("scrub", "Scrub the list", "The real number is smaller.", Effect(waitlist = -5000, quality = 3.0, hype = -6.0, log = "Waitlist now contains humans.", logTone = "good")),
            EventChoice("double-down", "Buy more signups", "A vendor in a spreadsheet.", Effect(waitlist = 12000, cash = -18000.0, evil = 5.0, scandal = 4.0, log = "Top of funnel is now a SKU.", logTone = "evil")),
            EventChoice("invite", "Open invites anyway", "The product meets the people.", Effect(hype = 5.0, quality = -3.0, heat = 3.0, log = "Invites sent. Support is a graveyard.")),
        )
        "useful-fork" -> listOf(
            EventChoice("product", "Build that, actually", "The long good path.", Effect(quality = 10.0, hype = -4.0, heat = -6.0, log = "You staffed a real product.", logTone = "good")),
            EventChoice("press", "Put the flowers on the deck", "Everything is content.", Effect(hype = 9.0, quality = -1.0, log = "The flowers are on slide 4.")),
            EventChoice("ignore-good", "Stay on the frontier", "Hospitals are not a TAM you can round.", Effect(hype = 2.0, quality = -2.0, log = "You thanked them and went back to scaling.")),
        )
        else -> listOf(EventChoice("ok", "Continue", "", Effect()))
    }

    fun endingCopy(id: String): Triple<String, String, String> = when (id) {
        "ipo" -> Triple("You rang the bell", "Public markets", "The ticker exists. The product still needs a human behind the curtain.")
        "acquired" -> Triple("You got bought", "Acquired", "The logo survives as a tooltip. The model is being integrated. Nobody can find it.")
        "bankrupt" -> Triple("The lights went out", "Insolvent", "Payroll bounced. The GPUs are on a truck you do not own.")
        "indicted" -> Triple("The other kind of round", "Indicted", "The press kit now includes a docket number. Your waitlist went up.")
        "useful" -> Triple("It works", "Quiet product", "You shipped something people use on purpose. This was not the ending the deck wanted.")
        "acquihire" -> Triple("Talent, mostly", "Acqui-hire", "They wanted the people, not the slides. You keep the hoodie.")
        "nationalized" -> Triple("A seal, not a series", "National lab", "You have a badge, a SCIF, and a model that no longer tweets.")
        else -> Triple("Closed", "Over", "The garage is dark.")
    }

    fun stage(s: GameState): String {
        val n = s.employees.size
        return when {
            s.lastRound == "ipo" || s.lastRound == "c" -> "tower"
            s.lastRound == "b" || n >= 40 -> "campus"
            s.lastRound == "a" || n >= 22 -> "warehouse"
            s.lastRound == "seed" || n >= 10 -> "office"
            s.lastRound == "preseed" || n >= 4 -> "loft"
            else -> "garage"
        }
    }

    fun cap(stage: String) = when (stage) {
        "garage" -> 4
        "loft" -> 10
        "office" -> 22
        "warehouse" -> 48
        "campus" -> 120
        else -> 280
    }

    fun stageLine(stage: String) = when (stage) {
        "garage" -> "One bulb, three extension cords, a dream with a burn rate."
        "loft" -> "Industrial windows. A cage of GPUs."
        "office" -> "Glass, walnut, and a model that still needs a babysitter."
        "warehouse" -> "Headcount as architecture."
        "campus" -> "A reflecting pool. A product that almost works."
        else -> "You own the skyline. The demo still crashes on stage two."
    }
}
