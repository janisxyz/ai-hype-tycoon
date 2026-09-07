package com.aihypetycoon.app.game

import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object Engine {
    const val GPU_COST = 16000
    const val CLOUD_BURST = 12000
    private const val GPU_POWER = 8.0
    private const val GPU_YIELD = 6.2
    private const val HYPE_DECAY = 0.11
    private const val BROKE_LIMIT = 36
    private const val GPU_LEAD = 5

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
        return n.copy(news = (listOf(item) + n.news).take(56))
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
            users = max(0, state.users + fx.users),
            morale = clamp(state.morale + fx.morale, 0.0, 100.0),
        )
        if (fx.valuationMul != 0.0) s = s.copy(valuation = max(0.0, s.valuation * fx.valuationMul))
        if (fx.shortageDays > 0) s = s.copy(gpuShortageUntil = max(s.gpuShortageUntil, s.day + fx.shortageDays))
        if (fx.log != null) s = news(s, fx.log, fx.logTone)
        if (fx.ending != null) s = s.copy(ending = fx.ending, speed = 0)
        if (fx.acquireOffer) {
            val offer = s.valuation * (0.9 + s.hype / 400)
            s = s.copy(acquireOffer = offer, eventId = "acquire-close", speed = 0)
        }
        return s
    }

    data class Totals(
        val salary: Double,
        val research: Double,
        val hype: Double,
        val quality: Double,
        val eff: Double,
        val heat: Double,
        val scandalDecay: Double,
        val demo: Double,
        val product: Double,
    )

    fun totals(s: GameState): Totals {
        val moraleMul = 0.7 + (s.morale / 100.0) * 0.45
        var salary = 0.0
        var research = 0.0
        var hype = 0.0
        var quality = 0.0
        var eff = 1.0
        var heat = 0.0
        var sc = 0.0
        var demo = 0.0
        var product = 0.0
        s.employees.forEach { e ->
            Content.roles.find { it.id == e.roleId }?.let { role ->
                val m = (e.morale / 100.0) * moraleMul
                salary += role.salaryMo
                research += role.research * m
                hype += role.hype * m
                quality += role.quality * m
                eff += role.computeEff
                heat += role.heat
                sc += role.scandalDecay
                demo += role.demoBoost
                product += role.product * m
            }
        }
        return Totals(salary, research, hype, quality, eff, heat, sc, demo, product)
    }

    fun dailyBurn(s: GameState): Double {
        val t = totals(s)
        return t.salary / 30.0 + s.gpus * GPU_POWER + Content.rent(Content.stage(s))
    }

    fun dailyRevenue(s: GameState): Double {
        if (s.products.isEmpty()) return 0.0
        val t = totals(s)
        val q = 0.45 + s.quality / 180.0 + t.product * 0.4
        return s.products.sumOf { it.users * it.arpu * q }
    }

    fun valuation(s: GameState): Double {
        val arr = dailyRevenue(s) * 365
        val multiple = Content.cycleMultiple(s.market) * (1 + s.hype / 220) * (1 - s.scandal / 280) * if (s.listed) 0.85 else 1.0
        val narrative = s.hype * 18_000 + s.models.size * 180_000 + s.gpus * 22_000
        val cash = max(0.0, s.cash) * 0.55
        val listed = if (s.listed) s.stockPrice * s.shares else 0.0
        val privateVal = max(80_000.0, arr * max(4.0, multiple) + narrative + cash)
        return if (s.listed) max(privateVal * 0.35, listed) else privateVal
    }

    fun create(company: String, seed: Long = System.currentTimeMillis()): GameState {
        val name = company.ifBlank { Content.companySeeds[(seed % Content.companySeeds.size).toInt()] }
        val founder = Employee("founder", "researcher", "You", 0, 78.0)
        val rivals = Content.rivals.mapIndexed { i, n ->
            Competitor("riv-$i", n, 6.0 + ((seed shr (i * 3)) % 12), 400_000.0 + ((seed shr (i * 5)) % 900_000))
        }
        var s = GameState(
            seed = seed, rng = seed.toInt(), day = 0, speed = 1, company = name,
            cash = 110_000.0, equity = 1.0, hype = 8.0, quality = 6.0, research = 14.0,
            compute = 48.0, gpus = 1, scandal = 0.0, heat = 3.0, evil = 0.0, valuation = 280_000.0,
            lastRound = null, nextRound = "friends", pivots = 0, lastPivotDay = -90,
            gpuShortageUntil = 0, employees = listOf(founder), training = null, models = emptyList(),
            products = emptyList(), users = 0, revenueToday = 0.0, listed = false, stockPrice = 0.0,
            shares = 10_000_000, market = "quiet", marketDaysLeft = 48, competitors = rivals,
            gpuOrders = emptyList(), morale = 74.0,
            demoCooldown = 0, waitlistCooldown = 0, stealCooldown = 0, fakeCooldown = 0,
            news = emptyList(), eventId = null, waitlist = 90, papersStolen = 0, fakeBenches = 0,
            daysBroke = 0, flags = emptyMap(), ending = null, acquireOffer = 0.0,
            lastRealMs = System.currentTimeMillis(),
        )
        s = news(s, "${s.company} opens in a garage. One card is already humming.")
        return s.copy(valuation = valuation(s))
    }

    fun tickDay(state: GameState): GameState {
        if (state.ending != null || state.eventId != null) return state
        var s = state.copy(day = state.day + 1)
        val t = totals(s)
        val burn = dailyBurn(s)

        val arrived = s.gpuOrders.filter { it.remaining <= 1 }
        val pending = s.gpuOrders.map { it.copy(remaining = it.remaining - 1) }.filter { it.remaining > 0 }
        if (arrived.isNotEmpty()) {
            val qty = arrived.sumOf { it.qty }
            s = news(s.copy(gpus = s.gpus + qty, gpuOrders = pending), "$qty accelerator${if (qty > 1) "s" else ""} landed.", "good")
        } else s = s.copy(gpuOrders = pending)

        val shortage = s.day < s.gpuShortageUntil
        val gpuYield = s.gpus * (if (shortage) 0.32 else GPU_YIELD) * t.eff
        s = s.copy(
            compute = s.compute + gpuYield,
            research = s.research + t.research,
            hype = clamp(s.hype + t.hype - HYPE_DECAY - s.scandal * 0.012, 0.0, 100.0),
            quality = clamp(s.quality + t.quality * 0.18, 0.0, 100.0),
            heat = clamp(s.heat + t.heat * 0.2 - 0.04, 0.0, 100.0),
            scandal = clamp(s.scandal - t.scandalDecay * 0.18 - 0.05, 0.0, 100.0),
            morale = clamp(s.morale + (if (s.cash > burn * 40) 0.04 else -0.08), 0.0, 100.0),
            demoCooldown = max(0, s.demoCooldown - 1),
            waitlistCooldown = max(0, s.waitlistCooldown - 1),
            stealCooldown = max(0, s.stealCooldown - 1),
            fakeCooldown = max(0, s.fakeCooldown - 1),
        )

        s = tickProducts(s)
        s = s.copy(cash = s.cash + s.revenueToday - burn)

        s.training?.let { job ->
            val rem = job.remaining - 1
            s = if (rem <= 0) {
                val spec = Content.models.first { it.id == job.specId }
                val ratio = min(1.0, s.research / max(1.0, spec.researchNeed.toDouble()))
                val q = clamp(spec.qualityCap * 0.38 + s.quality * 0.32 + ratio * 16, 4.0, spec.qualityCap.toDouble())
                news(
                    s.copy(
                        models = s.models + FinishedModel("m-${s.day}-${spec.id}", spec.id, q, false, false, false),
                        training = null,
                        research = max(0.0, s.research - spec.researchNeed * 0.28),
                    ),
                    "${spec.name} finished training.",
                    "good",
                )
            } else s.copy(training = job.copy(remaining = rem))
        }

        s = tickMarket(s)
        s = tickRivals(s)
        if (s.listed) {
            val fair = valuation(s.copy(listed = false)) / max(1, s.shares)
            val noise = (s.hype - 40) / 8000.0 - s.scandal / 12000.0
            s = s.copy(stockPrice = max(0.4, s.stockPrice * 0.97 + fair * 0.03 + noise * s.stockPrice))
        }
        s = s.copy(valuation = valuation(s))
        s = fails(s)
        if (s.ending == null) s = maybeEvent(s)
        if (s.day > 0 && s.day % 30 == 0) {
            s = news(s, "Month close. Burn ${burn.roundToInt()}/day. Rev ${s.revenueToday.roundToInt()}/day.")
        }
        return s
    }

    private fun tickProducts(s: GameState): GameState {
        if (s.products.isEmpty()) {
            val organic = s.waitlist * 0.0018 + s.hype * 0.35
            return s.copy(waitlist = (s.waitlist + organic).toInt(), users = 0, revenueToday = 0.0)
        }
        val t = totals(s)
        val churn = clamp(0.006 - s.quality / 2800 + s.scandal / 4200 - t.product * 0.002, 0.001, 0.03)
        val growth = 0.0016 + s.hype / 14000 + t.product * 0.003
        val convert = min(s.waitlist * (0.01 + s.hype / 2500), s.waitlist * 0.08)
        val products = s.products.map { p ->
            p.copy(users = max(0, (p.users * (1 + growth - churn) + convert / s.products.size).toInt()))
        }
        val users = products.sumOf { it.users }
        val next = s.copy(products = products, users = users, waitlist = max(0, (s.waitlist - convert + s.hype * 0.45).toInt()))
        return next.copy(revenueToday = dailyRevenue(next))
    }

    private fun tickMarket(s: GameState): GameState {
        if (s.marketDaysLeft > 1) return s.copy(marketDaysLeft = s.marketDaysLeft - 1)
        val (n, v) = roll(s)
        val next = when (s.market) {
            "mania" -> if (v < 0.7) "boom" else "winter"
            "boom" -> if (v < 0.45) "mania" else if (v < 0.75) "quiet" else "winter"
            "quiet" -> if (v < 0.35) "boom" else if (v < 0.78) "quiet" else "winter"
            else -> if (v < 0.55) "quiet" else "winter"
        }
        val dur = 40 + (v * 70).toInt()
        var out = n.copy(market = next, marketDaysLeft = dur)
        if (next != s.market) out = news(out, "Tape shift: ${Content.cycleTitle(next)}.", if (next == "winter") "bad" else "ok")
        return out
    }

    private fun tickRivals(s: GameState): GameState {
        val (n, r) = roll(s)
        var out = n.copy(
            competitors = n.competitors.mapIndexed { i, c ->
                val drift = (r - 0.45) * 0.4 + i * 0.05
                val hype = clamp(c.hype + drift, 2.0, 96.0)
                val growth = 1 + when (n.market) { "mania" -> 0.012; "boom" -> 0.007; "winter" -> -0.004; else -> 0.002 }
                c.copy(hype = hype, valuation = max(120_000.0, c.valuation * growth * (1 + hype / 800)))
            },
        )
        if (out.day > 20 && out.day % 37 == 0 && out.competitors.isNotEmpty()) {
            val rival = out.competitors[out.day % out.competitors.size]
            out = news(out, "${rival.name} just raised into the same tape.")
        }
        return out
    }

    private fun fails(s: GameState): GameState {
        if (s.ending != null) return s
        if (s.scandal >= 96 && s.evil >= 52) return s.copy(ending = "indicted", speed = 0)
        if (s.cash < 0) {
            val broke = s.daysBroke + 1
            return if (broke >= BROKE_LIMIT) s.copy(daysBroke = broke, ending = "bankrupt", speed = 0)
            else s.copy(daysBroke = broke)
        }
        return s.copy(daysBroke = 0)
    }

    private fun maybeEvent(state: GameState): GameState {
        if (state.eventId != null || state.ending != null) return state
        if (state.day < 12 || state.day % 18 != 0) return state
        val (s0, r) = roll(state)
        val chance = 0.22 + s0.evil * 0.002 + s0.hype * 0.001 + s0.scandal * 0.0015
        if (r > chance) return s0
        val eligible = Content.events.filter { ev ->
            s0.day >= ev.minDay && when (ev.id) {
                "nyt" -> s0.hype >= 18
                "live-demo", "weights-leak" -> s0.models.isNotEmpty()
                "acquire-sniff" -> s0.valuation >= 10_000_000 && s0.lastRound != null && !s0.listed
                "benchmark" -> s0.fakeBenches > 0 || s0.hype >= 28
                "talent-raid" -> s0.employees.size >= 3
                "cloud-bill" -> s0.gpus >= 1 || s0.compute >= 24
                "safety-walkout" -> s0.heat >= 28 || s0.evil >= 18
                "gov" -> s0.hype >= 36 && s0.valuation >= 60_000_000
                "paper-theft" -> s0.papersStolen > 0
                "useful-fork" -> s0.quality >= 16
                "earnings" -> s0.listed
                else -> true
            } && (ev.id in listOf("gpu-shortage", "cloud-bill", "earnings") || s0.flags["ev-${ev.id}"] != true)
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
        val name = "${Content.firstNames[(v1 * Content.firstNames.size).toInt() % Content.firstNames.size]} ${Content.lastNames[(v2 * Content.lastNames.size).toInt() % Content.lastNames.size]}"
        val person = Employee("e-${b.day}-${b.employees.size}", roleId, name, b.day, 72.0)
        return news(b.copy(cash = b.cash - role.signing, employees = b.employees + person, morale = clamp(b.morale + 1.5, 0.0, 100.0), toast = "$name is in.", valuation = valuation(b)), "$name joins as ${role.name}.", "good")
    }

    fun fire(s: GameState, id: String): GameState {
        if (id == "founder") return s.copy(toast = "You cannot fire yourself.")
        val emp = s.employees.find { it.id == id } ?: return s
        return news(s.copy(employees = s.employees.filter { it.id != id }, cash = s.cash - 3500, morale = clamp(s.morale - 8, 0.0, 100.0), toast = "${emp.name} packed a box."), "${emp.name} is pursuing other opportunities.", "bad")
    }

    fun buyGpu(s: GameState): GameState {
        if (s.day < s.gpuShortageUntil) return s.copy(toast = "Shortage.")
        if (s.cash < GPU_COST) return s.copy(toast = "Not enough cash for silicon.")
        return news(s.copy(cash = s.cash - GPU_COST, gpuOrders = s.gpuOrders + GpuOrder(1, GPU_LEAD), toast = "Cards inbound."), "Ordered an accelerator. ${GPU_LEAD} days out.")
    }

    fun burst(s: GameState): GameState {
        val cost = if (s.day < s.gpuShortageUntil) CLOUD_BURST * 2.4 else CLOUD_BURST.toDouble()
        if (s.cash < cost) return s.copy(toast = "Cloud would like to be paid first.")
        return news(s.copy(cash = s.cash - cost, compute = s.compute + 42, toast = "Burst scheduled."), "Rented a burst of someone else's cluster.")
    }

    fun train(s: GameState, specId: String): GameState {
        if (s.training != null) return s.copy(toast = "A job is already on the cluster.")
        val spec = Content.models.find { it.id == specId } ?: return s
        if (!Content.unlocked(spec, s)) return s.copy(toast = "Not unlocked yet.")
        if (s.research < spec.researchNeed) return s.copy(toast = "Need more research.")
        if (s.compute < spec.compute) return s.copy(toast = "Need more compute.")
        return news(s.copy(compute = s.compute - spec.compute, training = ModelJob(specId, spec.days, spec.days), toast = "${spec.name} is cooking."), "Training ${spec.name}.")
    }

    fun demo(s: GameState, modelId: String): GameState {
        if (s.demoCooldown > 0) return s.copy(toast = "Demo team is recovering.")
        val model = s.models.find { it.id == modelId } ?: return s.copy(toast = "No such weights.")
        val spec = Content.models.first { it.id == model.specId }
        val t = totals(s)
        val (n, r) = roll(s)
        val chance = clamp(0.24 + t.demo + model.quality / 160 + n.hype / 260 - n.heat / 200, 0.08, 0.9)
        val viral = r < chance
        val flop = r > chance + 0.38
        val gain = spec.hypeOnShip * if (viral) 1.0 else if (flop) 0.15 else 0.4
        var out = n.copy(
            hype = clamp(n.hype + gain, 0.0, 100.0),
            demoCooldown = 12,
            models = n.models.map { if (it.id == modelId) it.copy(shipped = true) else it },
            waitlist = n.waitlist + if (viral) 2800 + (n.hype * 28).toInt() else if (flop) 180 else 520,
        )
        out = when {
            flop -> news(out.copy(heat = clamp(out.heat + 6, 0.0, 100.0), toast = "It flopped."), "Live demo of ${spec.name} ate itself.", "bad")
            viral -> news(out.copy(toast = "It went viral."), "${spec.name} demo went feral.", "good")
            else -> news(out.copy(toast = "Polite applause."), "${spec.name} demo was fine.")
        }
        return out.copy(valuation = valuation(out))
    }

    fun launch(s: GameState, modelId: String): GameState {
        val model = s.models.find { it.id == modelId } ?: return s.copy(toast = "Train something first.")
        if (model.launched) return s.copy(toast = "Already a product.")
        if (!model.shipped) return s.copy(toast = "Demo it before you bill for it.")
        val spec = Content.models.first { it.id == model.specId }
        val convert = (s.waitlist * clamp(0.12 + model.quality / 220 + s.hype / 400, 0.06, 0.42)).toInt()
        val product = Product("p-${s.day}-${spec.id}", spec.name, modelId, max(40, convert), spec.arpu * (0.7 + model.quality / 200), model.quality)
        var out = s.copy(
            products = s.products + product,
            models = s.models.map { if (it.id == modelId) it.copy(launched = true) else it },
            waitlist = max(0, s.waitlist - convert),
            users = s.users + product.users,
            quality = clamp(s.quality + 2, 0.0, 100.0),
            toast = "${spec.name} is live.",
        )
        out = out.copy(revenueToday = dailyRevenue(out), valuation = valuation(out))
        return news(out, "Launched ${spec.name}. ${product.users} users walked in.", "good")
    }

    fun raise(s: GameState): GameState {
        val round = Content.rounds.find { it.id == s.nextRound } ?: return s.copy(toast = "No round on the calendar.")
        if (s.hype < round.minHype) return s.copy(toast = "Need more hype.")
        if (s.valuation < round.minValuation) return s.copy(toast = "Valuation is not a story yet.")
        if (round.id == "ipo") {
            val primary = (s.valuation * 0.11).roundToInt().toDouble()
            val listed = s.copy(
                lastRound = "ipo", nextRound = "secondary", listed = true,
                cash = s.cash + primary, equity = s.equity * (1 - round.dilution),
                shares = (s.shares * (1 + round.dilution)).roundToInt(),
                stockPrice = s.valuation / max(1, s.shares),
                hype = clamp(s.hype + 8, 0.0, 100.0),
                toast = "You are public. The company keeps going.",
            )
            return news(listed.copy(valuation = valuation(listed)), "S-1 effective. ${s.company} is public.", "good")
        }
        if (round.id == "secondary") {
            if (!s.listed) return s.copy(toast = "List first.")
            val raiseAmt = (s.valuation * 0.07).roundToInt().toDouble()
            val out = s.copy(
                cash = s.cash + raiseAmt, lastRound = "secondary", nextRound = "secondary",
                equity = s.equity * (1 - round.dilution),
                shares = (s.shares * (1 + round.dilution)).roundToInt(),
                stockPrice = s.stockPrice * 0.97, toast = "Follow-on is in.",
            )
            return news(out.copy(valuation = valuation(out)), "Follow-on closed.", "good")
        }
        val idx = Content.rounds.indexOfFirst { it.id == round.id } + 1
        val next = Content.rounds.getOrNull(idx)?.id ?: "ipo"
        val boost = when (s.market) { "mania" -> 1.18; "boom" -> 1.08; "winter" -> 0.78; else -> 1.0 }
        val raiseAmt = (round.raise * boost).roundToInt().toDouble()
        val out = s.copy(
            cash = s.cash + raiseAmt, equity = s.equity * (1 - round.dilution),
            lastRound = round.id, nextRound = next,
            hype = clamp(s.hype + 5, 0.0, 100.0), morale = clamp(s.morale + 6, 0.0, 100.0),
            toast = "${round.name} is in the bank.",
        )
        return news(out.copy(valuation = valuation(out)), "Closed ${round.name}.", "good")
    }

    fun pivot(s: GameState): GameState {
        if (s.day - s.lastPivotDay < 90) return s.copy(toast = "You just pivoted.")
        var out = s.copy(
            pivots = s.pivots + 1, lastPivotDay = s.day,
            quality = clamp(s.quality * 0.42, 2.0, 22.0),
            hype = clamp(s.hype + 8 - s.pivots * 1.5, 0.0, 100.0),
            research = s.research * 0.62, toast = "You pivoted.",
        )
        if (s.pivots >= 4) out = out.copy(scandal = clamp(out.scandal + 6, 0.0, 100.0))
        return news(out, "New thesis. Same GPUs.")
    }

    fun steal(s: GameState): GameState {
        if (s.stealCooldown > 0) return s.copy(toast = "The copier is overheated.")
        if (s.employees.none { it.roleId == "researcher" || it.roleId == "mill" }) return s.copy(toast = "Need someone who can read a PDF.")
        val (n, r) = roll(s)
        val mill = n.employees.count { it.roleId == "mill" }
        var out = n.copy(research = n.research + 22 + mill * 7, evil = n.evil + 5, papersStolen = n.papersStolen + 1, stealCooldown = 16)
        return if (r < 0.2 + out.papersStolen * 0.035) {
            news(out.copy(scandal = clamp(out.scandal + 12, 0.0, 100.0), toast = "Stolen — and noticed."), "You lifted a paper.", "evil")
        } else news(out.copy(toast = "Knowledge, acquired."), "A related-work section appeared overnight.", "evil")
    }

    fun fake(s: GameState, modelId: String): GameState {
        if (s.fakeCooldown > 0) return s.copy(toast = "The leaderboard is watching.")
        if (s.models.none { it.id == modelId }) return s.copy(toast = "Train something first.")
        val (n, r) = roll(s)
        var out = n.copy(
            hype = clamp(n.hype + 11, 0.0, 100.0), evil = n.evil + 7, fakeBenches = n.fakeBenches + 1,
            fakeCooldown = 20, models = n.models.map { if (it.id == modelId) it.copy(fakeBench = true) else it },
        )
        out = out.copy(valuation = valuation(out))
        return if (r < 0.28) news(out.copy(scandal = clamp(out.scandal + 9, 0.0, 100.0), toast = "The chart is a fiction."), "SOTA claimed.", "evil")
        else news(out.copy(toast = "Leaderboard updated itself."), "New SOTA.", "evil")
    }

    fun farm(s: GameState): GameState {
        if (s.waitlistCooldown > 0) return s.copy(toast = "The ads are still running.")
        if (s.cash < 8000) return s.copy(toast = "Engagement farming is not free.")
        return news(
            s.copy(cash = s.cash - 8000, waitlist = s.waitlist + 5200, hype = clamp(s.hype + 3.5, 0.0, 100.0), quality = clamp(s.quality - 1.2, 0.0, 100.0), waitlistCooldown = 12, evil = s.evil + 1.5, toast = "Funnel is loud."),
            "Waitlist ads. Half are bots.",
            "evil",
        ).let { it.copy(valuation = valuation(it)) }
    }

    fun choose(s: GameState, choiceId: String): GameState {
        if (s.eventId == "acquire-close") {
            return if (choiceId == "take") news(s.copy(ending = "acquired", eventId = null, speed = 0, toast = "You sold."), "Acquired.", "good")
            else news(s.copy(eventId = null, speed = 1, hype = clamp(s.hype + 3, 0.0, 100.0), toast = "Independence, expensive."), "You walked.")
        }
        val choice = Content.choices(s.eventId ?: return s).find { it.id == choiceId } ?: return s.copy(eventId = null, speed = 1)
        var out = applyEffect(s.copy(eventId = null, speed = 1), choice.effects)
        if (out.eventId == null) out = out.copy(speed = if (out.ending == null) 1 else 0)
        return out.copy(valuation = valuation(out), toast = choice.label)
    }
}
