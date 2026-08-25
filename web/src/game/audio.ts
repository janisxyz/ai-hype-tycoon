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

export function blip(kind: "ok" | "good" | "bad" | "evil" = "ok") {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = kind === "evil" ? "sawtooth" : "triangle";
  const f = kind === "good" ? 620 : kind === "bad" ? 180 : kind === "evil" ? 140 : 420;
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(kind === "bad" ? 90 : f * 1.35, t + 0.09);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + 0.18);
}
