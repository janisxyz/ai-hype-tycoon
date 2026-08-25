package com.aihypetycoon.app.game

import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object Engine {
    const val GPU_COST = 14000
    const val CLOUD_BURST = 9500
    private const val GPU_POWER = 22.0
    private const val HYPE_DECAY = 0.28
    private const val BROKE_LIMIT = 16

    fun clamp(n: Double, a: Double, b: Double) = max(a, min(b, n))

    fun money(n: Double): String {
        val sign = if (n < 0) "-" else ""
        val a = kotlin.math.abs(n)
        return when {
            a >= 1_000_000_000 -> "$sign$${"%.2f".format(a / 1_000_000_000)}B"
            a >= 1_000_000 -> "$sign$${"%.2f".format(a / 1_000_000)}M"
            a >= 10_000 -> "$sign$${"%.1f".format(a / 1_000)}k"
            else -> "$sign$${a.roundToInt()}"
        }
    }

    private fun mix(n: Int): Pair<Int, Double> {
        var a = n + 0x6d2b79f5
        var t = (a xor (a ushr 15)) * (1 or a)
        t = (t + ((t xor (t ushr 7)) * (61 or t))) xor t
        val value = ((t xor (t ushr 14)).toUInt().toDouble()) / 4294967296.0
        return a to value
    }

    private fun roll(s: GameState): Pair<GameState, Double> {
        val (rng, v) = mix(s.rng)
        return s.copy(rng = rng) to v
    }

    private fun news(s: GameState, text: String, tone: String = "ok"): GameState {
        val (n, v) = roll(s)
        val item = NewsItem("n-${n.day}-${(v * 1e9).toLong()}", n.day, text, tone)
        return n.copy(news = (listOf(item) + n.news).take(48))
    }

    fun applyEffect(state: GameState, fx: Effect): GameState {
        var s = state.copy(
            cash = state.cash + fx.cash,
            hype = clamp(state.hype + fx.hype, 0.0, 100.0),
            quality = clamp(state.quality + fx.quality, 0.0, 100.0),
            research = max(0.0, state.research + fx.research),
            compute = max(0.0, state.compute + fx.compute),
            gpus = max(0, state.gpus + fx.gpus),
            scandal = clamp(state.scandal + fx.scandal, 0.0, 100.0),
            heat = clamp(state.heat + fx.heat, 0.0, 100.0),
            evil = max(0.0, state.evil + fx.evil),
            waitlist = max(0, state.waitlist + fx.waitlist),
        )
        if (fx.valuationMul != 0.0) s = s.copy(valuation = max(0.0, s.valuation * fx.valuationMul))
        if (fx.shortageDays > 0) s = s.copy(gpuShortageUntil = max(s.gpuShortageUntil, s.day + fx.shortageDays))
        if (fx.log != null) s = news(s, fx.log, fx.logTone)
        if (fx.ending != null) s = s.copy(ending = fx.ending, speed = 0)
        if (fx.acquireOffer) {
            val offer = s.valuation * (0.85 + s.hype / 500)
            s = s.copy(acquireOffer = offer, eventId = "acquire-close", speed = 0)
        }
        return s
    }

    fun totals(s: GameState): Triple<Double, Double, Double> {
        var salary = 0.0
        var research = 0.0
        var eff = 1.0
        s.employees.forEach { e ->
            Content.roles.find { it.id == e.roleId }?.let {
                salary += it.salaryMo
                research += it.research
                eff += it.computeEff
            }
        }
        return Triple(salary, research, eff)
    }

    fun dailyBurn(s: GameState): Double {
        val (salary, _, _) = totals(s)
        return salary / 30.0 + s.gpus * GPU_POWER
    }

    fun valuation(s: GameState): Double {
        val boost = when (s.lastRound) {
            "c" -> 18.0
            "b" -> 8.0
            "a" -> 3.2
            "seed" -> 1.6
            else -> 1.0
        }
        val base = 180_000 + s.cash * 0.35 + s.employees.size * 220_000 + s.hype * 140_000 +
            s.waitlist * 18 + s.models.size * 520_000 + s.fakeBenches * 1_800_000 +
            s.quality * 90_000 + s.gpus * 40_000
        return max(50_000.0, base * boost)
    }

    fun create(company: String, seed: Long = System.currentTimeMillis()): GameState {
        val name = company.ifBlank { Content.companySeeds[(seed % Content.companySeeds.size).toInt()] }
        val founder = Employee("founder", "researcher", "You", 0)
        var s = GameState(
            seed = seed, rng = seed.toInt(), day = 0, speed = 1, company = name,
            cash = 48_000.0, equity = 1.0, hype = 7.0, quality = 5.0, research = 4.0,
            compute = 12.0, gpus = 0, scandal = 0.0, heat = 4.0, evil = 0.0, valuation = 250_000.0,
            lastRound = null, nextRound = "friends", pivots = 0, lastPivotDay = -90,
            gpuShortageUntil = 0, employees = listOf(founder), training = null, models = emptyList(),
            demoCooldown = 0, waitlistCooldown = 0, stealCooldown = 0, fakeCooldown = 0,
            news = emptyList(), eventId = null, waitlist = 120, papersStolen = 0, fakeBenches = 0,
            daysBroke = 0, flags = emptyMap(), ending = null, acquireOffer = 0.0,
            lastRealMs = System.currentTimeMillis(),
        )
        s = news(s, "${s.company} opens in a garage. The first GPU is a metaphor.")
        return s.copy(valuation = valuation(s))
    }

    fun tickDay(state: GameState): GameState {
        if (state.ending != null || state.eventId != null) return state
        var s = state.copy(day = state.day + 1)
        val (salary, research, eff) = totals(s)
        val burn = salary / 30.0 + s.gpus * GPU_POWER
        s = s.copy(cash = s.cash - burn)
        val shortage = s.day < s.gpuShortageUntil
        val gpuYield = s.gpus * (if (shortage) 0.35 else 1.15) * eff
        val hypeAdd = s.employees.sumOf { e -> Content.roles.find { it.id == e.roleId }?.hype ?: 0.0 }
        val qAdd = s.employees.sumOf { e -> Content.roles.find { it.id == e.roleId }?.quality ?: 0.0 }
        val heatAdd = s.employees.sumOf { e -> Content.roles.find { it.id == e.roleId }?.heat ?: 0.0 }
        val scDec = s.employees.sumOf { e -> Content.roles.find { it.id == e.roleId }?.scandalDecay ?: 0.0 }
        s = s.copy(
            compute = s.compute + gpuYield,
            research = s.research + research,
            hype = clamp(s.hype + hypeAdd - HYPE_DECAY, 0.0, 100.0),
            quality = clamp(s.quality + qAdd * 0.25, 0.0, 100.0),
            heat = clamp(s.heat + heatAdd * 0.25, 0.0, 100.0),
            scandal = clamp(s.scandal - scDec * 0.2 - 0.08, 0.0, 100.0),
            demoCooldown = max(0, s.demoCooldown - 1),
            waitlistCooldown = max(0, s.waitlistCooldown - 1),
            stealCooldown = max(0, s.stealCooldown - 1),
            fakeCooldown = max(0, s.fakeCooldown - 1),
            waitlist = (s.waitlist * 1.002 + s.hype * 0.8).toInt(),
        )
        s.training?.let { job ->
            val rem = job.remaining - 1
            s = if (rem <= 0) {
                val spec = Content.models.first { it.id == job.specId }
                val q = clamp(
                    spec.qualityCap * 0.45 + s.quality * 0.35 +
                        (min(s.research, spec.researchNeed.toDouble()) / spec.researchNeed) * 12,
                    3.0, spec.qualityCap.toDouble(),
                )
                news(
                    s.copy(
                        models = s.models + FinishedModel("m-${s.day}-${spec.id}", spec.id, q, false, false),
                        training = null,
                        research = max(0.0, s.research - spec.researchNeed * 0.4),
                    ),
                    "${spec.name} finished training. Eval loss is a vibe.",
                    "good",
                )
            } else s.copy(training = job.copy(remaining = rem))
        }
        s = s.copy(valuation = valuation(s))
        s = endings(s)
        if (s.ending == null) s = maybeEvent(s)
        return s
    }

    private fun endings(s: GameState): GameState {
        if (s.ending != null) return s
        if (s.scandal >= 92 && s.evil >= 40) return s.copy(ending = "indicted", speed = 0)
        if (s.quality >= 62 && s.scandal < 28 && s.day >= 80) return s.copy(ending = "useful", speed = 0)
        if (s.cash < 0) {
            val broke = s.daysBroke + 1
            return if (broke >= BROKE_LIMIT) s.copy(daysBroke = broke, ending = "bankrupt", speed = 0)
            else s.copy(daysBroke = broke)
        }
        return s.copy(daysBroke = 0)
    }

    private fun maybeEvent(state: GameState): GameState {
        if (state.eventId != null || state.ending != null) return state
        if (state.day == 0 || state.day % 6 != 0) return state
        val (s0, r) = roll(state)
        val chance = 0.38 + s0.evil * 0.004 + s0.hype * 0.0015 + s0.scandal * 0.002
        if (r > chance) return s0
        val eligible = Content.events.filter { ev ->
            s0.day >= ev.minDay && when (ev.id) {
                "nyt" -> s0.hype >= 20
                "live-demo", "weights-leak" -> s0.models.isNotEmpty()
                "acquire-sniff" -> s0.valuation >= 12_000_000 && s0.lastRound != null
                "board-pivot" -> s0.lastRound in listOf("seed", "a", "b")
                "benchmark" -> s0.fakeBenches > 0 || s0.hype >= 30
                "talent-raid" -> s0.employees.size >= 3
                "cloud-bill" -> s0.gpus >= 1 || s0.compute >= 20
                "safety-walkout" -> s0.heat >= 30 || s0.evil >= 20
                "gov" -> s0.hype >= 40 && s0.valuation >= 80_000_000
                "paper-theft" -> s0.papersStolen > 0
                "waitlist-fake" -> s0.waitlist >= 4000
                "useful-fork" -> s0.quality >= 18
                else -> true
            } && (ev.id in listOf("gpu-shortage", "cloud-bill") || s0.flags["ev-${ev.id}"] != true)
        }
        if (eligible.isEmpty()) return s0
        val sum = eligible.sumOf { it.weight }
        val (s1, pick) = roll(s0)
        var cursor = pick * sum
        var chosen = eligible.first()
        for (ev in eligible) {
            cursor -= ev.weight
            if (cursor <= 0) { chosen = ev; break }
        }
        return s1.copy(eventId = chosen.id, speed = 0, flags = s1.flags + ("ev-${chosen.id}" to true))
    }

    fun hire(s: GameState, roleId: String): GameState {
        val role = Content.roles.find { it.id == roleId } ?: return s.copy(toast = "Unknown role.")
        val cap = Content.cap(Content.stage(s))
        if (s.employees.size >= cap) return s.copy(toast = "No seats left. Raise or grow.")
        if (s.cash < role.signing) return s.copy(toast = "Need a signing bonus.")
        val (a, v1) = roll(s)
        val (b, v2) = roll(a)
        val name = "${Content.firstNames[(v1 * Content.firstNames.size).toInt()]} ${Content.lastNames[(v2 * Content.lastNames.size).toInt()]}"
        val person = Employee("e-${b.day}-${b.employees.size}", roleId, name, b.day)
        return news(b.copy(cash = b.cash - role.signing, employees = b.employees + person, toast = "$name is in."), "$name joins as ${role.name}.", "good")
            .copy(valuation = valuation(b), toast = "$name is in.")
    }

    fun fire(s: GameState, id: String): GameState {
        if (id == "founder") return s.copy(toast = "You cannot fire yourself.")
        val emp = s.employees.find { it.id == id } ?: return s
        return news(s.copy(employees = s.employees.filter { it.id != id }, cash = s.cash - 4000, toast = "${emp.name} packed a box."), "${emp.name} is pursuing other opportunities.", "bad")
    }

    fun buyGpu(s: GameState): GameState {
        if (s.day < s.gpuShortageUntil) return s.copy(toast = "Shortage.")
        if (s.cash < GPU_COST) return s.copy(toast = "Not enough cash for silicon.")
        return news(s.copy(cash = s.cash - GPU_COST, gpus = s.gpus + 1, toast = "Cards inbound."), "Acquired an accelerator. The room got louder.", "good")
    }

    fun burst(s: GameState): GameState {
        val cost = if (s.day < s.gpuShortageUntil) CLOUD_BURST * 3 else CLOUD_BURST
        if (s.cash < cost) return s.copy(toast = "Cloud would like to be paid first.")
        return news(s.copy(cash = s.cash - cost, compute = s.compute + 28, toast = "Burst scheduled."), "Rented a burst of someone else's cluster.")
    }

    fun train(s: GameState, specId: String): GameState {
        if (s.training != null) return s.copy(toast = "A job is already on the cluster.")
        val spec = Content.models.find { it.id == specId } ?: return s
        if (s.research < spec.researchNeed) return s.copy(toast = "Need more research.")
        if (s.compute < spec.compute) return s.copy(toast = "Need more compute.")
        return news(
            s.copy(compute = s.compute - spec.compute, training = ModelJob(specId, spec.days, spec.days), toast = "${spec.name} is cooking."),
            "Training ${spec.name}.",
        )
    }

    fun demo(s: GameState, modelId: String): GameState {
        if (s.demoCooldown > 0) return s.copy(toast = "Demo team is recovering.")
        val model = s.models.find { it.id == modelId } ?: return s.copy(toast = "No such weights.")
        val spec = Content.models.first { it.id == model.specId }
        val demoBoost = s.employees.sumOf { e -> Content.roles.find { it.id == e.roleId }?.demoBoost ?: 0.0 }
        val (n, r) = roll(s)
        val chance = clamp(0.28 + demoBoost + model.quality / 140 + n.hype / 220 - n.heat / 180, 0.08, 0.92)
        val viral = r < chance
        val flop = r > chance + 0.35
        val gain = spec.hypeOnShip * if (viral) (if (flop) 0.2 else 1.0) else 0.35
        var out = n.copy(
            hype = clamp(n.hype + gain, 0.0, 100.0),
            demoCooldown = 9,
            models = n.models.map { if (it.id == modelId) it.copy(shipped = true) else it },
            waitlist = n.waitlist + if (viral) 3500 + (n.hype * 40).toInt() else 400,
        )
        out = when {
            flop -> news(out.copy(heat = clamp(out.heat + 8, 0.0, 100.0), toast = "It flopped."), "Live demo of ${spec.name} ate itself.", "bad")
            viral -> news(out.copy(toast = "It went viral."), "${spec.name} demo went feral.", "good")
            else -> news(out.copy(toast = "Polite applause."), "${spec.name} demo was fine.")
        }
        return out.copy(valuation = valuation(out))
    }

    fun raise(s: GameState): GameState {
        val round = Content.rounds.find { it.id == s.nextRound } ?: return s.copy(toast = "No round left.")
        if (s.hype < round.minHype) return s.copy(toast = "Need more hype.")
        if (s.valuation < round.minValuation) return s.copy(toast = "Valuation is not a story yet.")
        if (round.id == "ipo") {
            return news(s.copy(lastRound = "ipo", ending = "ipo", speed = 0, equity = s.equity * (1 - round.dilution), toast = "You are public."), "S-1 filed.", "good")
        }
        val idx = Content.rounds.indexOfFirst { it.id == round.id } + 1
        val next = Content.rounds.getOrNull(idx)?.id ?: "ipo"
        val out = s.copy(
            cash = s.cash + round.raise,
            equity = s.equity * (1 - round.dilution),
            lastRound = round.id,
            nextRound = next,
            hype = clamp(s.hype + 6, 0.0, 100.0),
            toast = "${round.name} is in the bank.",
        )
        return news(out.copy(valuation = valuation(out)), "Closed ${round.name}.", "good")
    }

    fun pivot(s: GameState): GameState {
        if (s.day - s.lastPivotDay < 70) return s.copy(toast = "You just pivoted.")
        var out = s.copy(
            pivots = s.pivots + 1, lastPivotDay = s.day,
            quality = clamp(s.quality * 0.35, 1.0, 20.0),
            hype = clamp(s.hype + 10 - s.pivots * 2.0, 0.0, 100.0),
            research = s.research * 0.55, toast = "You pivoted. Again.",
        )
        if (s.pivots >= 4) out = out.copy(scandal = clamp(out.scandal + 8, 0.0, 100.0))
        return news(out, "New thesis. Same GPUs.")
    }

    fun steal(s: GameState): GameState {
        if (s.stealCooldown > 0) return s.copy(toast = "The copier is overheated.")
        if (s.employees.none { it.roleId == "researcher" || it.roleId == "mill" }) return s.copy(toast = "Need someone who can read a PDF.")
        val (n, r) = roll(s)
        val mill = n.employees.count { it.roleId == "mill" }
        var out = n.copy(research = n.research + 28 + mill * 8, evil = n.evil + 6, papersStolen = n.papersStolen + 1, stealCooldown = 12)
        return if (r < 0.22 + out.papersStolen * 0.04) {
            news(out.copy(scandal = clamp(out.scandal + 14, 0.0, 100.0), toast = "Stolen — and noticed."), "You lifted a paper.", "evil")
        } else news(out.copy(toast = "Knowledge, acquired."), "A related work section appeared overnight.", "evil")
    }

    fun fake(s: GameState, modelId: String): GameState {
        if (s.fakeCooldown > 0) return s.copy(toast = "The leaderboard is watching.")
        if (s.models.none { it.id == modelId }) return s.copy(toast = "Train something first.")
        val (n, r) = roll(s)
        var out = n.copy(
            hype = clamp(n.hype + 14, 0.0, 100.0), evil = n.evil + 8, fakeBenches = n.fakeBenches + 1,
            fakeCooldown = 16, models = n.models.map { if (it.id == modelId) it.copy(fakeBench = true) else it },
        )
        out = out.copy(valuation = valuation(out))
        return if (r < 0.3) news(out.copy(scandal = clamp(out.scandal + 10, 0.0, 100.0), toast = "The chart is a fiction."), "SOTA claimed.", "evil")
        else news(out.copy(toast = "Leaderboard updated itself."), "New SOTA.", "evil")
    }

    fun farm(s: GameState): GameState {
        if (s.waitlistCooldown > 0) return s.copy(toast = "The ads are still running.")
        if (s.cash < 6000) return s.copy(toast = "Engagement farming is not free.")
        return news(
            s.copy(cash = s.cash - 6000, waitlist = s.waitlist + 9000, hype = clamp(s.hype + 5, 0.0, 100.0), quality = clamp(s.quality - 1.5, 0.0, 100.0), waitlistCooldown = 8, evil = s.evil + 2, toast = "Funnel go brrr."),
            "Waitlist ads. Half are bots.",
            "evil",
        ).let { it.copy(valuation = valuation(it)) }
    }

    fun choose(s: GameState, choiceId: String): GameState {
        if (s.eventId == "acquire-close") {
            return if (choiceId == "take") news(s.copy(ending = "acquired", eventId = null, speed = 0, toast = "You sold."), "Acquired.", "good")
            else news(s.copy(eventId = null, speed = 1, hype = clamp(s.hype + 4, 0.0, 100.0), toast = "Independence, expensive."), "You walked.")
        }
        val choice = Content.choices(s.eventId ?: return s).find { it.id == choiceId } ?: return s.copy(eventId = null, speed = 1)
        var out = applyEffect(s.copy(eventId = null, speed = 1), choice.effects)
        if (out.eventId == null) out = out.copy(speed = if (out.ending == null) 1 else 0)
        return out.copy(valuation = valuation(out), toast = choice.label)
    }
}
