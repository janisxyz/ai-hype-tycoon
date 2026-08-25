package com.aihypetycoon.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aihypetycoon.app.game.Engine
import com.aihypetycoon.app.game.GameState
import com.aihypetycoon.app.game.Save
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class GameViewModel(app: Application) : AndroidViewModel(app) {
    private val _state = MutableStateFlow<GameState?>(null)
    val state: StateFlow<GameState?> = _state

    init {
        Save.load(app)?.let { loaded ->
            if (loaded.ending == null) {
                val elapsed = System.currentTimeMillis() - loaded.lastRealMs
                val days = (elapsed / 900).toInt().coerceAtMost(36)
                var s = loaded
                if (days >= 2) repeat(days) { if (s.ending == null && s.eventId == null) s = Engine.tickDay(s) }
                _state.value = s.copy(lastRealMs = System.currentTimeMillis())
            }
        }
        viewModelScope.launch {
            while (isActive) {
                delay(850)
                val cur = _state.value ?: continue
                if (cur.speed > 0 && cur.eventId == null && cur.ending == null) {
                    var s = cur
                    repeat(cur.speed.coerceAtLeast(1)) {
                        if (s.eventId == null && s.ending == null) s = Engine.tickDay(s)
                    }
                    commit(s)
                }
            }
        }
    }

    private fun commit(s: GameState) {
        val next = s.copy(lastRealMs = System.currentTimeMillis())
        _state.value = next
        Save.write(getApplication(), next)
    }

    fun newGame(name: String) = commit(Engine.create(name))
    fun abandon() {
        Save.clear(getApplication())
        _state.value = null
    }
    fun setSpeed(n: Int) { _state.value?.let { _state.value = it.copy(speed = if (it.eventId != null || it.ending != null) 0 else n) } }
    fun hire(id: String) { _state.value?.let { commit(Engine.hire(it, id)) } }
    fun fire(id: String) { _state.value?.let { commit(Engine.fire(it, id)) } }
    fun buyGpu() { _state.value?.let { commit(Engine.buyGpu(it)) } }
    fun burst() { _state.value?.let { commit(Engine.burst(it)) } }
    fun train(id: String) { _state.value?.let { commit(Engine.train(it, id)) } }
    fun demo(id: String) { _state.value?.let { commit(Engine.demo(it, id)) } }
    fun raise() { _state.value?.let { commit(Engine.raise(it)) } }
    fun pivot() { _state.value?.let { commit(Engine.pivot(it)) } }
    fun steal() { _state.value?.let { commit(Engine.steal(it)) } }
    fun fake(id: String) { _state.value?.let { commit(Engine.fake(it, id)) } }
    fun farm() { _state.value?.let { commit(Engine.farm(it)) } }
    fun choose(id: String) { _state.value?.let { commit(Engine.choose(it, id)) } }
}
