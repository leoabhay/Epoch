import { clamp } from "../util/math.js";

export function createAudio() {
  /** @type {AudioContext | null} */
  let ctx = null;
  let master = null;

  const ensure = () => {
    if (ctx) return ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    return ctx;
  };

  const unlock = async () => {
    const c = ensure();
    if (!c) return;
    if (c.state === "suspended") await c.resume();
  };

  const now = () => (ctx ? ctx.currentTime : 0);

  const tone = (freq, dur, type, gain, slideTo = null) => {
    const c = ensure();
    if (!c || !master) return;
    const t0 = now();

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(clamp(gain, 0.0001, 1), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(master);

    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  };

  const noise = (dur, gain, hpFreq = 250) => {
    const c = ensure();
    if (!c || !master) return;
    const t0 = now();

    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

    const src = c.createBufferSource();
    src.buffer = buf;

    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = hpFreq;

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(clamp(gain, 0.0001, 1), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(hp);
    hp.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  };

  const play = (name) => {
    // don’t auto-unlock without a gesture; but if unlocked, play.
    if (!ensure() || !ctx || ctx.state !== "running") return;
    switch (name) {
      case "jump":
        tone(520, 0.08, "square", 0.18, 720);
        tone(220, 0.12, "sine", 0.08, 180);
        break;
      case "time":
        noise(0.18, 0.18, 520);
        tone(220, 0.15, "sawtooth", 0.12, 880);
        break;
      case "goal":
        tone(523.25, 0.08, "triangle", 0.13);
        tone(659.25, 0.10, "triangle", 0.12);
        tone(783.99, 0.14, "triangle", 0.10);
        break;
      case "switch":
        tone(180, 0.06, "square", 0.10, 140);
        break;
      case "reset":
        tone(160, 0.12, "sine", 0.10, 90);
        noise(0.08, 0.07, 420);
        break;
      default:
        break;
    }
  };

  return { unlock, play };
}