package com.aihypetycoon.app

import android.graphics.BitmapFactory
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aihypetycoon.app.game.Content
import com.aihypetycoon.app.game.Engine
import com.aihypetycoon.app.game.GameState

private val Ink = Color(0xFF0C0C0B)
private val Surface = Color(0xFF161614)
private val Elevated = Color(0xFF1E1E1B)
private val Paper = Color(0xFFE7E2D6)
private val Muted = Color(0xFF9A958C)
private val Subtle = Color(0xFF6F6B64)
private val Sage = Color(0xFF8FAD90)
private val Danger = Color(0xFFC45C4A)
private val Warn = Color(0xFFC4A574)

class MainActivity : ComponentActivity() {
    private val vm by viewModels<GameViewModel>()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val state by vm.state.collectAsState()
            TycoonApp(state, vm)
        }
    }
}

@Composable
private fun TycoonApp(state: GameState?, vm: GameViewModel) {
    when {
        state == null -> Title(vm)
        state.ending != null -> Ending(state, vm)
        else -> Play(state, vm)
    }
}

@Composable
private fun AssetImage(path: String, modifier: Modifier) {
    val ctx = LocalContext.current
    val bmp = remember(path) {
        runCatching { ctx.assets.open(path).use { BitmapFactory.decodeStream(it) } }.getOrNull()
    }
    if (bmp != null) {
        Image(bmp.asImageBitmap(), contentDescription = null, modifier = modifier, contentScale = ContentScale.Crop)
    } else {
        Box(modifier.background(Ink))
    }
}

@Composable
private fun Title(vm: GameViewModel) {
    var name by remember { mutableStateOf(Content.companySeeds.random()) }
    Box(Modifier.fillMaxSize().background(Ink)) {
        AssetImage("hq/title.jpg", Modifier.fillMaxSize())
        Box(Modifier.fillMaxSize().background(Ink.copy(alpha = 0.55f)))
        Column(
            Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().padding(24.dp),
            verticalArrangement = Arrangement.Bottom,
        ) {
            Text("FROM A GARAGE, A ROUND", color = Paper.copy(alpha = 0.7f), fontSize = 11.sp, fontFamily = FontFamily.Monospace, letterSpacing = 2.sp)
            Text("AI Hype Tycoon", color = Paper, fontSize = 44.sp, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Medium, lineHeight = 46.sp)
            Spacer(Modifier.height(12.dp))
            Text("Raise, hire, train, ship. Go public. Keep going.", color = Muted, fontSize = 15.sp)
            Spacer(Modifier.height(28.dp))
            Text("COMPANY", color = Subtle, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
            Spacer(Modifier.height(8.dp))
            BasicTextField(
                value = name,
                onValueChange = { if (it.length <= 32) name = it },
                textStyle = TextStyle(color = Paper, fontSize = 16.sp),
                cursorBrush = SolidColor(Paper),
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Surface).padding(16.dp),
            )
            Spacer(Modifier.height(12.dp))
            PrimaryBtn("Open the garage") { vm.newGame(name) }
        }
    }
}

@Composable
private fun Ending(s: GameState, vm: GameViewModel) {
    val copy = Content.endingCopy(s.ending ?: "")
    Box(Modifier.fillMaxSize().background(Ink)) {
        AssetImage("hq/tower.jpg", Modifier.fillMaxSize())
        Box(Modifier.fillMaxSize().background(Ink.copy(alpha = 0.7f)))
        Column(
            Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().padding(24.dp),
            verticalArrangement = Arrangement.Bottom,
        ) {
            Text(copy.second.uppercase(), color = Paper.copy(alpha = 0.7f), fontSize = 11.sp, fontFamily = FontFamily.Monospace, letterSpacing = 2.sp)
            Text(copy.first, color = Paper, fontSize = 40.sp, fontStyle = FontStyle.Italic, lineHeight = 42.sp)
            Spacer(Modifier.height(12.dp))
            Text(copy.third, color = Muted, fontSize = 15.sp)
            Spacer(Modifier.height(20.dp))
            Text("${s.company}  ·  ${Engine.money(s.valuation)}  ·  day ${s.day}", color = Subtle, fontSize = 13.sp)
            Spacer(Modifier.height(24.dp))
            PrimaryBtn("Another garage") { vm.abandon() }
        }
    }
}

@Composable
private fun Play(s: GameState, vm: GameViewModel) {
    var tab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Floor", "Lab", "Crew", "Tape", "Shadow")
    val burn = Engine.dailyBurn(s)
    val rev = Engine.dailyRevenue(s)
    val runway = if (burn > 0) (s.cash / burn).toInt() else 999
    val stage = Content.stage(s)
    Column(Modifier.fillMaxSize().background(Ink).statusBarsPadding()) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(s.company, color = Paper, fontSize = 20.sp, fontStyle = FontStyle.Italic)
                    Text("Day ${s.day}  ·  ${Content.cycleTitle(s.market)}${if (s.listed) "  ·  Public" else ""}", color = Subtle, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                }
                Row {
                    listOf(0, 1, 2, 4).forEach { sp ->
                        TextButton(onClick = { vm.setSpeed(sp) }) {
                            Text(if (sp == 0) "II" else "${sp}x", color = if (s.speed == sp) Paper else Muted, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Stat("CASH", Engine.money(s.cash), s.cash < burn * 12)
                Stat("HYPE", "${s.hype.toInt()}")
                Stat("VALUE", Engine.money(s.valuation))
                Stat("RUNWAY", if (runway > 800) "—" else "${runway}d", runway < 30)
            }
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            Box(Modifier.fillMaxWidth().height(280.dp)) {
                AssetImage(Content.hqAsset(stage), Modifier.fillMaxSize())
                Box(Modifier.fillMaxSize().background(Ink.copy(alpha = 0.28f)))
                Column(Modifier.align(Alignment.BottomStart).padding(16.dp)) {
                    Text(stage.uppercase(), color = Paper, fontSize = 11.sp, fontFamily = FontFamily.Monospace, letterSpacing = 2.sp)
                    Text(Content.stageLine(stage), color = Muted, fontSize = 13.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.Bottom) {
                        val racks = (s.gpus + if (s.training != null) 1 else 0).coerceIn(1, 12)
                        repeat(racks) { i ->
                            Box(
                                Modifier.width(8.dp).height((18 + (i * 13) % 28).dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(Sage.copy(alpha = if (s.training != null) 0.95f else 0.7f)),
                            )
                        }
                    }
                }
            }
            Row(Modifier.fillMaxWidth().background(Surface).padding(horizontal = 12.dp, vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Meter("Hype", s.hype, Paper)
                Meter("Quality", s.quality, Sage)
                Meter("Scandal", s.scandal, Danger)
                Meter("Morale", s.morale, Warn)
            }
            Text(
                "Burn ${Engine.money(burn)}/d" + (if (rev > 0) "  ·  Rev ${Engine.money(rev)}/d" else "") + "  ·  ${s.gpus} cards  ·  ${s.employees.size} staff",
                color = Subtle,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            )
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(12.dp)).background(Elevated).padding(4.dp)) {
                tabs.forEachIndexed { i, label ->
                    TextButton(onClick = { tab = i }, modifier = Modifier.weight(1f)) {
                        Text(label, color = if (tab == i) Paper else Muted, fontSize = 12.sp, fontWeight = if (tab == i) FontWeight.SemiBold else FontWeight.Normal)
                    }
                }
            }
            Column(Modifier.padding(16.dp)) {
                when (tab) {
                    0 -> Floor(s, vm)
                    1 -> Lab(s, vm)
                    2 -> Crew(s, vm)
                    3 -> Tape(s, vm)
                    else -> Shadow(s, vm)
                }
                Spacer(Modifier.height(12.dp))
                Panel {
                    Text("WIRE", color = Subtle, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Spacer(Modifier.height(8.dp))
                    s.news.take(3).forEach {
                        Text(it.text, color = when (it.tone) { "good" -> Sage; "bad" -> Danger; "evil" -> Warn; else -> Muted }, fontSize = 13.sp, modifier = Modifier.padding(bottom = 8.dp))
                    }
                }
            }
        }
        s.toast?.let {
            Text(it, color = Paper, fontSize = 13.sp, modifier = Modifier.padding(16.dp).clip(RoundedCornerShape(8.dp)).background(Elevated).padding(12.dp).fillMaxWidth())
        }
        Spacer(Modifier.navigationBarsPadding())
    }
    s.eventId?.let { EventSheet(s, it, vm) }
}

@Composable
private fun Meter(label: String, value: Double, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(72.dp)) {
        Text("${value.toInt()}", color = Paper, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
        LinearProgressIndicator(
            progress = { (value / 100.0).toFloat().coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
            color = color,
            trackColor = Ink,
        )
        Text(label.uppercase(), color = Subtle, fontSize = 9.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.padding(top = 4.dp))
    }
}

@Composable
private fun Floor(s: GameState, vm: GameViewModel) {
    val round = Content.rounds.find { it.id == s.nextRound }
    val shortage = s.day < s.gpuShortageUntil
    Action(round?.let { "Raise ${it.name}" } ?: "No round", round?.let { if (it.raise > 0) Engine.money(it.raise.toDouble()) + " · hype ${it.minHype}+" else "Primary from book · hype ${it.minHype}+" } ?: "") { vm.raise() }
    Action("Order accelerators", if (shortage) "Shortage" else "${Engine.money(Engine.GPU_COST.toDouble())} · 5 days out") { if (!shortage) vm.buyGpu() }
    Action("Burst the cloud", Engine.money((if (shortage) Engine.CLOUD_BURST * 2.4 else Engine.CLOUD_BURST.toDouble()))) { vm.burst() }
    if (s.products.isNotEmpty()) {
        Panel {
            Text("PRODUCTS", color = Subtle, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
            s.products.forEach {
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(it.name, color = Paper, fontSize = 14.sp)
                    Text("${it.users} users", color = Sage, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun Lab(s: GameState, vm: GameViewModel) {
    s.training?.let {
        val spec = Content.models.find { m -> m.id == it.specId }
        Panel {
            Text("TRAINING ${spec?.name}", color = Subtle, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
            Text("${it.remaining}d left", color = Paper, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { ((it.total - it.remaining).toFloat() / it.total).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth(),
                color = Sage,
                trackColor = Ink,
            )
        }
        Spacer(Modifier.height(8.dp))
    }
    Content.models.filter { Content.unlocked(it, s) }.forEach { m ->
        Action("Train ${m.name}", "${m.days}d · ${m.compute} compute · ${m.researchNeed} research") { vm.train(m.id) }
    }
    s.models.forEach { m ->
        val spec = Content.models.find { it.id == m.specId }
        Panel {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(spec?.name ?: m.specId, color = Paper, fontSize = 14.sp)
                Text("Q ${m.quality.toInt()}", color = Sage, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
            }
            Spacer(Modifier.height(8.dp))
            Row {
                TextButton(onClick = { vm.demo(m.id) }, modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Paper)) {
                    Text("Demo", color = Ink, fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.width(8.dp))
                TextButton(onClick = { vm.launch(m.id) }, modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Elevated)) {
                    Text(if (m.launched) "Live" else "Launch", color = Paper)
                }
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun Crew(s: GameState, vm: GameViewModel) {
    val cap = Content.cap(Content.stage(s))
    Text("${s.employees.size}/$cap seats · morale ${s.morale.toInt()}", color = Muted, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp))
    s.employees.forEach { e ->
        val role = Content.roles.find { it.id == e.roleId }
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Elevated).padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(36.dp).clip(CircleShape).background(Paper), contentAlignment = Alignment.Center) {
                    Text(e.name.take(1), color = Ink, fontStyle = FontStyle.Italic)
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(e.name, color = Paper, fontSize = 14.sp)
                    Text(role?.name ?: "", color = Subtle, fontSize = 12.sp)
                }
            }
            if (e.id != "founder") TextButton(onClick = { vm.fire(e.id) }) { Text("Let go", color = Danger, fontSize = 12.sp) }
        }
        Spacer(Modifier.height(6.dp))
    }
    Content.roles.forEach { r ->
        Action(r.name, "${Engine.money(r.signing.toDouble())} in · ${Engine.money(r.salaryMo.toDouble())}/mo") { vm.hire(r.id) }
    }
}

@Composable
private fun Tape(s: GameState, vm: GameViewModel) {
    Panel {
        Text(Content.cycleTitle(s.market), color = Paper, fontSize = 22.sp, fontStyle = FontStyle.Italic)
        Text("${s.marketDaysLeft}d left on this tape", color = Subtle, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
        if (s.listed) {
            Spacer(Modifier.height(6.dp))
            Text("Stock ${Engine.money(s.stockPrice)}", color = Sage, fontSize = 14.sp)
        }
    }
    Spacer(Modifier.height(8.dp))
    s.competitors.forEach { c ->
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Elevated).padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(c.name, color = Paper, fontSize = 14.sp)
                Text("Hype ${c.hype.toInt()}", color = Subtle, fontSize = 12.sp)
            }
            Text(Engine.money(c.valuation), color = Sage, fontFamily = FontFamily.Monospace, fontSize = 13.sp)
        }
        Spacer(Modifier.height(6.dp))
    }
    Action("Pivot", if (s.day - s.lastPivotDay < 90) "Not yet" else "New thesis. Same GPUs.") { vm.pivot() }
}

@Composable
private fun Shadow(s: GameState, vm: GameViewModel) {
    Text("Scandal ${s.scandal.toInt()} · heat ${s.heat.toInt()} · karma ${s.evil.toInt()}", color = Muted, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp))
    Action("Steal a paper", "Related work, very related.") { vm.steal() }
    val latest = s.models.lastOrNull()
    Action("Fake a benchmark", if (latest == null) "Train a model first" else "SOTA by spreadsheet") { latest?.let { vm.fake(it.id) } }
    Action("Farm the waitlist", "${Engine.money(8000.0)} · mostly bots") { vm.farm() }
}

@Composable
private fun EventSheet(s: GameState, id: String, vm: GameViewModel) {
    val ev = Content.events.find { it.id == id }
    val title = if (id == "acquire-close") "The term sheet is real" else ev?.title ?: "Decision"
    val body = if (id == "acquire-close") "They will pay ${Engine.money(s.acquireOffer)} and fold ${s.company} into a tooltip. You can walk." else ev?.body ?: ""
    val choices = if (id == "acquire-close") listOf(
        com.aihypetycoon.app.game.EventChoice("take", "Sign", "Soft landing. This is an ending.", com.aihypetycoon.app.game.Effect()),
        com.aihypetycoon.app.game.EventChoice("walk", "Walk", "Stay independent.", com.aihypetycoon.app.game.Effect()),
    ) else Content.choices(id)
    Column(
        Modifier.fillMaxSize().background(Ink.copy(alpha = 0.72f)).padding(16.dp),
        verticalArrangement = Arrangement.Bottom,
    ) {
        Column(Modifier.clip(RoundedCornerShape(16.dp)).background(Surface).padding(20.dp)) {
            Text("DECISION", color = Warn, fontSize = 11.sp, fontFamily = FontFamily.Monospace, letterSpacing = 2.sp)
            Text(title, color = Paper, fontSize = 28.sp, fontStyle = FontStyle.Italic, lineHeight = 30.sp)
            Spacer(Modifier.height(8.dp))
            Text(body, color = Muted, fontSize = 14.sp)
            Spacer(Modifier.height(16.dp))
            choices.forEach { c -> Action(c.label, c.hint) { vm.choose(c.id) } }
        }
    }
}

@Composable
private fun Panel(content: @Composable () -> Unit) {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Surface).padding(16.dp), content = { content() })
}

@Composable
private fun Stat(k: String, v: String, warn: Boolean = false) {
    Column {
        Text(k, color = Subtle, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
        Text(v, color = if (warn) Danger else Paper, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
    }
}

@Composable
private fun PrimaryBtn(label: String, onClick: () -> Unit) {
    TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Paper).height(52.dp)) {
        Text(label, color = Ink, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun Action(title: String, meta: String, onClick: () -> Unit) {
    TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp).clip(RoundedCornerShape(12.dp)).background(Elevated)) {
        Column(Modifier.fillMaxWidth().padding(4.dp)) {
            Text(title, color = Paper, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            if (meta.isNotBlank()) Text(meta, color = Subtle, fontSize = 12.sp)
        }
    }
}
