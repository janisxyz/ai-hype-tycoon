package com.aihypetycoon.app.game

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object Save {
    private const val PREF = "ai_hype_tycoon"
    private const val KEY = "save_v1"

    fun load(ctx: Context): GameState? {
        val raw = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString(KEY, null) ?: return null
        return try {
            fromJson(JSONObject(raw))
        } catch (_: Exception) {
            null
        }
    }

    fun write(ctx: Context, s: GameState) {
        ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().putString(KEY, toJson(s).toString()).apply()
    }

    fun clear(ctx: Context) {
        ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().remove(KEY).apply()
    }

    private fun toJson(s: GameState) = JSONObject().apply {
        put("seed", s.seed); put("rng", s.rng); put("day", s.day); put("speed", s.speed)
        put("company", s.company); put("cash", s.cash); put("equity", s.equity)
        put("hype", s.hype); put("quality", s.quality); put("research", s.research)
        put("compute", s.compute); put("gpus", s.gpus); put("scandal", s.scandal)
        put("heat", s.heat); put("evil", s.evil); put("valuation", s.valuation)
        put("lastRound", s.lastRound ?: JSONObject.NULL); put("nextRound", s.nextRound)
        put("pivots", s.pivots); put("lastPivotDay", s.lastPivotDay)
        put("gpuShortageUntil", s.gpuShortageUntil)
        put("employees", JSONArray().also { arr ->
            s.employees.forEach { e ->
                arr.put(JSONObject().put("id", e.id).put("roleId", e.roleId).put("name", e.name).put("hiredOn", e.hiredOn))
            }
        })
        s.training?.let {
            put("training", JSONObject().put("specId", it.specId).put("remaining", it.remaining).put("total", it.total))
        }
        put("models", JSONArray().also { arr ->
            s.models.forEach { m ->
                arr.put(JSONObject().put("id", m.id).put("specId", m.specId).put("quality", m.quality).put("shipped", m.shipped).put("fakeBench", m.fakeBench))
            }
        })
        put("demoCooldown", s.demoCooldown); put("waitlistCooldown", s.waitlistCooldown)
        put("stealCooldown", s.stealCooldown); put("fakeCooldown", s.fakeCooldown)
        put("news", JSONArray().also { arr ->
            s.news.take(24).forEach { n ->
                arr.put(JSONObject().put("id", n.id).put("day", n.day).put("text", n.text).put("tone", n.tone))
            }
        })
        put("eventId", s.eventId ?: JSONObject.NULL)
        put("waitlist", s.waitlist); put("papersStolen", s.papersStolen); put("fakeBenches", s.fakeBenches)
        put("daysBroke", s.daysBroke); put("ending", s.ending ?: JSONObject.NULL)
        put("acquireOffer", s.acquireOffer); put("lastRealMs", s.lastRealMs)
        put("flags", JSONObject().also { o -> s.flags.forEach { (k, v) -> o.put(k, v) } })
    }

    private fun fromJson(o: JSONObject): GameState {
        fun arr(key: String) = o.optJSONArray(key) ?: JSONArray()
        val employees = buildList {
            val a = arr("employees")
            for (i in 0 until a.length()) {
                val e = a.getJSONObject(i)
                add(Employee(e.getString("id"), e.getString("roleId"), e.getString("name"), e.optInt("hiredOn")))
            }
        }
        val models = buildList {
            val a = arr("models")
            for (i in 0 until a.length()) {
                val m = a.getJSONObject(i)
                add(FinishedModel(m.getString("id"), m.getString("specId"), m.optDouble("quality"), m.optBoolean("shipped"), m.optBoolean("fakeBench")))
            }
        }
        val news = buildList {
            val a = arr("news")
            for (i in 0 until a.length()) {
                val n = a.getJSONObject(i)
                add(NewsItem(n.getString("id"), n.optInt("day"), n.getString("text"), n.optString("tone", "ok")))
            }
        }
        val flags = mutableMapOf<String, Boolean>()
        o.optJSONObject("flags")?.let { f -> f.keys().forEach { flags[it] = f.optBoolean(it) } }
        val t = o.optJSONObject("training")
        return GameState(
            seed = o.optLong("seed"), rng = o.optInt("rng"), day = o.optInt("day"), speed = o.optInt("speed", 1),
            company = o.optString("company", "Garage Intelligence"), cash = o.optDouble("cash"), equity = o.optDouble("equity", 1.0),
            hype = o.optDouble("hype"), quality = o.optDouble("quality"), research = o.optDouble("research"),
            compute = o.optDouble("compute"), gpus = o.optInt("gpus"), scandal = o.optDouble("scandal"),
            heat = o.optDouble("heat"), evil = o.optDouble("evil"), valuation = o.optDouble("valuation"),
            lastRound = o.optString("lastRound", "").ifBlank { null }, nextRound = o.optString("nextRound", "friends"),
            pivots = o.optInt("pivots"), lastPivotDay = o.optInt("lastPivotDay", -90), gpuShortageUntil = o.optInt("gpuShortageUntil"),
            employees = employees.ifEmpty { listOf(Employee("founder", "researcher", "You", 0)) },
            training = t?.let { ModelJob(it.getString("specId"), it.getInt("remaining"), it.getInt("total")) },
            models = models, demoCooldown = o.optInt("demoCooldown"), waitlistCooldown = o.optInt("waitlistCooldown"),
            stealCooldown = o.optInt("stealCooldown"), fakeCooldown = o.optInt("fakeCooldown"), news = news,
            eventId = o.optString("eventId", "").ifBlank { null }, waitlist = o.optInt("waitlist"),
            papersStolen = o.optInt("papersStolen"), fakeBenches = o.optInt("fakeBenches"), daysBroke = o.optInt("daysBroke"),
            flags = flags, ending = o.optString("ending", "").ifBlank { null }, acquireOffer = o.optDouble("acquireOffer"),
            lastRealMs = o.optLong("lastRealMs", System.currentTimeMillis()),
        )
    }
}
