package com.aihypetycoon.app.game

object Content {
    val roles = listOf(
        RoleDef("researcher", "Research scientist", "Trains models. Asks for more cards.", 18000, 12000, 1.2, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0),
        RoleDef("gpu", "Cluster engineer", "Keeps the fans honest.", 22000, 14000, 0.1, 0.0, 0.02, 0.16, 0.0, 0.0, 0.0, 0.0),
        RoleDef("hype", "Growth intern", "Threads, waitlists, a personal brand.", 3500, 3200, 0.0, 0.55, -0.04, 0.0, 0.04, 0.0, 0.03, 0.02),
        RoleDef("product", "Product lead", "Turns weights into something people pay for.", 24000, 15000, 0.15, 0.08, 0.08, 0.0, -0.04, 0.0, 0.06, 0.22),
        RoleDef("safety", "Alignment lead", "Memos. Investors love the optics.", 28000, 16000, 0.15, 0.1, 0.04, 0.0, -0.28, 0.07, 0.0, 0.0),
        RoleDef("mill", "Paper-mill postdoc", "ArXiv at 2am. Originality negotiable.", 10000, 7200, 0.75, 0.08, -0.03, 0.0, 0.06, 0.0, 0.0, 0.0),
        RoleDef("exec", "Ex-BigTech VP", "Does not write code. Raises by existing.", 64000, 36000, 0.0, 0.28, 0.0, 0.0, -0.04, 0.0, 0.04, 0.04),
        RoleDef("demo", "Demo engineer", "The one person who can make the deck talk.", 16000, 10000, 0.08, 0.16, 0.04, 0.0, 0.0, 0.0, 0.2, 0.05),
        RoleDef("legal", "Crisis counsel", "Bills in six minutes. Buries stories in fourteen.", 40000, 20000, 0.0, -0.04, 0.0, 0.0, -0.08, 0.2, 0.0, 0.0),
    )

    val models = listOf(
        ModelSpec("toy", "Garage-7", "Finetuned on blogs and hope.", 8, 18, 10, 16, 8, 0.04),
        ModelSpec("small", "Loom-13B", "Small enough to demo.", 20, 72, 26, 28, 14, 0.09),
        ModelSpec("mid", "Frontier-70", "You will say the word frontier.", 36, 200, 52, 40, 24, 0.18),
        ModelSpec("huge", "Mixture of Hype", "Sparse experts, dense press.", 56, 440, 90, 52, 36, 0.32),
        ModelSpec("agi", "Slide-deck AGI", "Does not exist. Valuation disagrees.", 88, 800, 130, 64, 52, 0.55),
        ModelSpec("titan", "Planetary-1T", "A cluster the size of weather.", 128, 1500, 200, 74, 64, 0.9),
        ModelSpec("sovereign", "Sovereign weights", "A model with a flag.", 170, 2600, 280, 86, 72, 1.4),
    )

    val rounds = listOf(
        RoundDef("friends", "Friends & family", "Aunts, angels, one dentist.", 3, 0, 120_000, 0.08),
        RoundDef("preseed", "Pre-seed", "A SAFE and a garage photo.", 12, 700_000, 750_000, 0.12),
        RoundDef("seed", "Seed", "The TAM is all cognition.", 22, 6_000_000, 4_200_000, 0.16),
        RoundDef("a", "Series A", "Partners who say platform.", 34, 28_000_000, 22_000_000, 0.18),
        RoundDef("b", "Series B", "Growth. Headcount. A mascot.", 44, 140_000_000, 80_000_000, 0.14),
        RoundDef("c", "Series C", "The round that defies physics.", 54, 700_000_000, 260_000_000, 0.10),
        RoundDef("ipo", "S-1 / IPO", "Ring the bell. Keep the company.", 62, 4_500_000_000L, 0, 0.10),
        RoundDef("secondary", "Follow-on offering", "Public markets, again.", 50, 8_000_000_000L, 0, 0.06),
    )

    val firstNames = listOf("Ada", "Jules", "Priya", "Kenji", "Mira", "Theo", "Anika", "Lars", "Noor", "Ezra", "Sable", "Rafi", "Ines", "Nico", "Hana", "Omar", "Leif", "Yara")
    val lastNames = listOf("Voss", "Chen", "Okoye", "Berg", "Nakamura", "Iyer", "Kade", "Solis", "Qureshi", "Hart", "Mbeki", "Diaz", "Krane", "Pahl", "Cho", "Adeyemi")
    val companySeeds = listOf("Garage Intelligence", "Nexus Loom", "Vector Forge", "Lumen Labs", "Attention Capital", "Stochastic Parrot", "Context Window")
    val rivals = listOf("Atlas Mind", "Helix Ridge", "Civic Weights")

    val events = listOf(
        GameEvent("intern-agi", "Intern declares AGI", "Your intern posted from the company account: we may have achieved AGI. The intern is in the bathroom.", 6, 20),
        GameEvent("gpu-shortage", "The cards are gone", "Every accelerator on the coast is spoken for. A broker can make something happen if you stop asking where they come from.", 7, 14),
        GameEvent("nyt", "The newspaper calls", "A reporter has a source who says your open model is a thin wrapper.", 5, 32),
        GameEvent("live-demo", "It spoke on morning TV", "The model recommended dissolving the board and putting the intern in charge.", 6, 28),
        GameEvent("acquire-sniff", "A giant wants a meeting", "A corp-dev person happens to be in town. They already know your burn.", 5, 55),
        GameEvent("weights-leak", "The weights walked out", "A torrent appeared. The file is named like your model.", 5, 36),
        GameEvent("benchmark", "Someone reran your numbers", "A blog claims your SOTA is a spreadsheet error.", 6, 24),
        GameEvent("talent-raid", "They came with offers", "A rival is parking cars outside. Packages include compute without asking.", 5, 30),
        GameEvent("cloud-bill", "The bill has a comma problem", "Someone left a training job on over the weekend. The loop was global.", 6, 16),
        GameEvent("safety-walkout", "The safety team walks", "They left a letter on the wiki. They want a pause. You have a demo on Thursday.", 4, 44),
        GameEvent("gov", "A hearing, sort of", "A staffer wants a briefing. They keep saying national asset and guardrails.", 4, 70),
        GameEvent("paper-theft", "The authors noticed", "A lab posted two PDFs side by side. Yours is on the right.", 5, 22),
        GameEvent("useful-fork", "It actually helped someone", "A hospital intern used your toy model to draft a letter and it did not hallucinate a law.", 4, 40),
        GameEvent("earnings", "Quarterly call", "Analysts want users who pay, not users who wait.", 6, 80),
    )

    fun choices(id: String): List<EventChoice> = when (id) {
        "intern-agi" -> listOf(
            EventChoice("blame", "Blame the intern", "Hype dips.", Effect(hype = -6.0, scandal = 2.0, morale = -4.0, log = "The intern is now a founding-adjacent researcher.")),
            EventChoice("lean", "Lean in", "Call it emergent.", Effect(hype = 12.0, heat = 8.0, evil = 3.0, log = "You coined proto-AGI on live television.", logTone = "evil")),
            EventChoice("pull", "Pull every demo", "Adults in the room.", Effect(hype = -8.0, quality = 4.0, heat = -5.0, log = "Demos paused.")),
        )
        "gpu-shortage" -> listOf(
            EventChoice("wait", "Wait it out", "Training stalls.", Effect(shortageDays = 22, log = "GPU shortage.", logTone = "bad")),
            EventChoice("broker", "Wire the broker", "You get cards and a story.", Effect(gpus = 4, cash = -72000.0, evil = 6.0, scandal = 5.0, log = "Four cards arrive at 3am.", logTone = "evil")),
            EventChoice("rent", "Rent the region", "Finance screams later.", Effect(compute = 90.0, cash = -95000.0, log = "You rented leftover capacity.")),
        )
        "nyt" -> listOf(
            EventChoice("deny", "Deny everything", "Works until it doesn't.", Effect(hype = -3.0, scandal = 7.0, heat = 3.0, log = "On the record: we train our own weights.", logTone = "bad")),
            EventChoice("memo", "Publish a safety memo", "Nobody reads it.", Effect(hype = 5.0, heat = -7.0, cash = -12000.0, log = "The memo has an appendix on appendixes.", logTone = "good")),
            EventChoice("leak", "Pre-leak a friendlier story", "A podcast, a hoodie.", Effect(hype = 8.0, evil = 4.0, scandal = 2.0, log = "You got ahead of it.", logTone = "evil")),
        )
        "live-demo" -> listOf(
            EventChoice("joke", "Call it a joke", "Hype holds.", Effect(hype = 3.0, heat = 6.0, log = "You said that's just sampling.")),
            EventChoice("align", "Announce an alignment review", "Buys time.", Effect(heat = -8.0, hype = -5.0, quality = 3.0, log = "Alignment review announced.", logTone = "good")),
            EventChoice("double", "Ship the unhinged cut", "The internet loves a villain.", Effect(hype = 14.0, scandal = 8.0, evil = 5.0, quality = -2.0, waitlist = 6000, log = "Unhinged cut is the product now.", logTone = "evil")),
        )
        "acquire-sniff" -> listOf(
            EventChoice("take", "Take the offer", "Soft landing. This is an ending.", Effect(acquireOffer = true, log = "Term sheet incoming.", logTone = "good")),
            EventChoice("raise", "Use them to raise", "Walk in with a rumor.", Effect(hype = 10.0, valuationMul = 1.18, log = "You leaked the meeting.", logTone = "good")),
            EventChoice("snipe", "Steal a paper on the way out", "A hallway, a future lawsuit.", Effect(research = 36.0, evil = 10.0, scandal = 12.0, log = "You left with more than a tote bag.", logTone = "evil")),
        )
        "weights-leak" -> listOf(
            EventChoice("open", "Say you meant to open-source", "Hype spike.", Effect(hype = 14.0, quality = -3.0, heat = -3.0, log = "You always planned to give it to the community.", logTone = "good")),
            EventChoice("sue", "Send the lawyers", "Takes cash.", Effect(cash = -55000.0, hype = -8.0, scandal = -5.0, log = "Takedowns sent.", logTone = "bad")),
            EventChoice("poison", "Poison the next dump", "A little watermark.", Effect(evil = 6.0, scandal = 4.0, quality = 2.0, log = "The next leak classifies recipes as tax law.", logTone = "evil")),
        )
        "benchmark" -> listOf(
            EventChoice("ignore", "Do not engage", "It might die.", Effect(hype = -5.0, scandal = 5.0, log = "You muted the thread.", logTone = "bad")),
            EventChoice("new-bench", "Publish a new benchmark", "You made this one.", Effect(hype = 7.0, evil = 5.0, scandal = 3.0, log = "Introducing HypeQA.", logTone = "evil")),
            EventChoice("confess", "Quietly correct the card", "Respect.", Effect(hype = -8.0, quality = 7.0, scandal = -7.0, heat = -3.0, log = "Erratum posted.", logTone = "good")),
        )
        "talent-raid" -> listOf(
            EventChoice("counter", "Counter everyone", "Payroll jumps.", Effect(cash = -70000.0, morale = 8.0, log = "You matched.")),
            EventChoice("letgo", "Let them walk", "Knowledge walks.", Effect(research = -14.0, hype = -3.0, quality = -2.0, morale = -10.0, log = "They took the lore.", logTone = "bad")),
            EventChoice("ndas", "Weaponize the NDAs", "Ugly.", Effect(cash = -22000.0, scandal = 6.0, evil = 4.0, log = "Counsel drafted a letter.", logTone = "evil")),
        )
        "cloud-bill" -> listOf(
            EventChoice("pay", "Pay it", "Cash goes.", Effect(cash = -48000.0, morale = -3.0, log = "You paid the debug loop.", logTone = "bad")),
            EventChoice("argue", "Argue with the cloud", "A credit, maybe.", Effect(cash = -14000.0, compute = -8.0, log = "They credited goodwill.")),
            EventChoice("capital", "Call it infrastructure", "Investors hear scale.", Effect(cash = -48000.0, hype = 6.0, valuationMul = 1.06, log = "The burn is now a slide.", logTone = "good")),
        )
        "safety-walkout" -> listOf(
            EventChoice("pause", "Pause the demo", "Adult hour.", Effect(hype = -10.0, heat = -14.0, quality = 4.0, morale = 6.0, log = "Thursday is a research preview.", logTone = "good")),
            EventChoice("replace", "Hire a friendlier safety team", "Theater.", Effect(cash = -42000.0, heat = -3.0, evil = 7.0, scandal = 5.0, log = "New safety team.", logTone = "evil")),
            EventChoice("ignore-letter", "Ship Thursday anyway", "The letter becomes the story.", Effect(hype = 6.0, scandal = 12.0, heat = 10.0, morale = -8.0, log = "You shipped. The letter shipped harder.", logTone = "bad")),
        )
        "gov" -> listOf(
            EventChoice("brief", "Brief them like a grown-up", "Heat down.", Effect(heat = -7.0, hype = 3.0, log = "You used the word capability.")),
            EventChoice("contract", "Ask what they will pay", "A contract with a seal.", Effect(cash = 4_800_000.0, evil = 6.0, heat = 5.0, users = 8000, log = "Pilot program.", logTone = "good")),
            EventChoice("stay", "Stay independent", "No seal. Still you.", Effect(hype = 4.0, heat = 4.0, log = "You smiled and kept the keys.")),
        )
        "paper-theft" -> listOf(
            EventChoice("cite", "Add a citation, quietly", "Late.", Effect(scandal = -5.0, hype = -4.0, research = -3.0, log = "Citation added in v2.")),
            EventChoice("independent", "Claim independent discovery", "Bold.", Effect(scandal = 10.0, evil = 5.0, hype = -2.0, log = "Independent discovery.", logTone = "evil")),
            EventChoice("hire-them", "Offer the authors a job", "The oldest trick.", Effect(cash = -36000.0, scandal = -6.0, research = 12.0, morale = 4.0, log = "They said no. Then maybe.", logTone = "good")),
        )
        "useful-fork" -> listOf(
            EventChoice("product", "Build that, actually", "The long good path.", Effect(quality = 8.0, hype = -3.0, heat = -5.0, users = 2400, log = "You staffed a real product.", logTone = "good")),
            EventChoice("press", "Put the flowers on the deck", "Everything is content.", Effect(hype = 8.0, quality = -1.0, log = "The flowers are on slide four.")),
            EventChoice("ignore-good", "Stay on the frontier", "Hospitals are not a TAM.", Effect(hype = 2.0, quality = -2.0, log = "You thanked them and went back to scaling.")),
        )
        "earnings" -> listOf(
            EventChoice("honest", "Guide down, calmly", "Stock stumbles.", Effect(hype = -6.0, scandal = -4.0, quality = 2.0, log = "You guided down.")),
            EventChoice("beat", "Beat with a metric you invented", "The street loves a KPI.", Effect(hype = 9.0, evil = 4.0, scandal = 3.0, log = "Introducing engaged inference hours.", logTone = "evil")),
            EventChoice("buyback", "Announce a buyback", "Cash for a ticker.", Effect(cash = -2_400_000.0, hype = 6.0, log = "Buyback authorized.", logTone = "good")),
        )
        else -> listOf(EventChoice("ok", "Continue", "", Effect()))
    }

    fun endingCopy(id: String): Triple<String, String, String> = when (id) {
        "acquired" -> Triple("You got bought", "Acquired", "The logo survives as a tooltip. The model is being integrated. Nobody can find it.")
        "bankrupt" -> Triple("The lights went out", "Insolvent", "Payroll bounced. The GPUs are on a truck you do not own.")
        "indicted" -> Triple("The other kind of round", "Indicted", "The press kit now includes a docket number.")
        else -> Triple("Closed", "Over", "The garage is dark.")
    }

    fun stage(s: GameState): String {
        val n = s.employees.size
        return when {
            s.listed || s.lastRound == "ipo" || s.lastRound == "c" -> "tower"
            s.lastRound == "b" || n >= 36 -> "campus"
            s.lastRound == "a" || n >= 18 -> "warehouse"
            s.lastRound == "seed" || n >= 9 -> "office"
            s.lastRound == "preseed" || n >= 4 -> "loft"
            else -> "garage"
        }
    }

    fun cap(stage: String) = when (stage) {
        "garage" -> 5
        "loft" -> 12
        "office" -> 28
        "warehouse" -> 56
        "campus" -> 140
        else -> 400
    }

    fun rent(stage: String) = when (stage) {
        "garage" -> 35.0
        "loft" -> 140.0
        "office" -> 480.0
        "warehouse" -> 1400.0
        "campus" -> 4800.0
        else -> 14000.0
    }

    fun cycleMultiple(cycle: String) = when (cycle) {
        "winter" -> 7.0
        "boom" -> 32.0
        "mania" -> 58.0
        else -> 16.0
    }

    fun cycleTitle(cycle: String) = when (cycle) {
        "winter" -> "AI winter"
        "boom" -> "Boom tape"
        "mania" -> "Mania"
        else -> "Quiet tape"
    }

    fun stageLine(stage: String) = when (stage) {
        "garage" -> "One bulb. Three cords. A burn rate."
        "loft" -> "Industrial windows. A cage of GPUs."
        "office" -> "Glass, walnut, a model that still needs a babysitter."
        "warehouse" -> "Headcount as architecture."
        "campus" -> "A reflecting pool. A research wing."
        else -> "You own the skyline. The demo still flinches."
    }

    fun hqAsset(stage: String) = when (stage) {
        "garage" -> "hq/garage.jpg"
        "loft" -> "hq/loft.jpg"
        "warehouse" -> "hq/warehouse.jpg"
        "office" -> "hq/office.jpg"
        "campus" -> "hq/campus.jpg"
        else -> "hq/tower.jpg"
    }

    fun unlocked(spec: ModelSpec, s: GameState): Boolean = when (spec.id) {
        "toy" -> true
        "small" -> s.research >= 16 || s.day >= 18 || s.models.isNotEmpty()
        "mid" -> s.lastRound in listOf("seed", "a", "b", "c", "ipo", "secondary") || s.research >= 48
        "huge" -> s.lastRound in listOf("a", "b", "c", "ipo", "secondary") || s.listed
        "agi" -> s.lastRound in listOf("b", "c", "ipo", "secondary") || s.listed
        "titan" -> s.listed || s.lastRound in listOf("c", "ipo", "secondary")
        "sovereign" -> s.day >= 360 || (s.listed && s.day >= 220)
        else -> true
    }
}
