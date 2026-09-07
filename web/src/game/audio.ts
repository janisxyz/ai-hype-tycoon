let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (c && c.state === "suspended") void c.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.045, slide = 1.25) {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function blip(kind: "ok" | "good" | "bad" | "evil" = "ok") {
  if (kind === "good") {
    tone(520, 0.12, "triangle", 0.04, 1.4);
    tone(780, 0.16, "sine", 0.025, 1.1);
    return;
  }
  if (kind === "bad") {
    tone(180, 0.18, "square", 0.03, 0.55);
    return;
  }
  if (kind === "evil") {
    tone(140, 0.2, "sawtooth", 0.03, 0.7);
    return;
  }
  tone(420, 0.12, "triangle", 0.04, 1.28);
}
