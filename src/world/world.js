import { smoothstep, clamp } from "../runtime/util/math.js";
import { aabbIntersect, moveAndCollide, applyPlatformerForces } from "./physics.js";

const TIMELINE = {
  PAST: "past",
  FUTURE: "future",
};

const PLAYER = {
  w: 44,
  h: 58,
};

export class World {
  constructor(level, audio) {
    this.level = level;
    this.audio = audio;

    this.timeline = TIMELINE.PAST;
    this.transition = {
      active: false,
      from: TIMELINE.PAST,
      to: TIMELINE.PAST,
      t: 1,
      dur: 0.26,
      flash: 0,
    };

    this.player = {
      x: level.spawn.x,
      y: level.spawn.y,
      w: PLAYER.w,
      h: PLAYER.h,
      vx: 0,
      vy: 0,
      onGround: false,
    };

    this.boxes = (level.boxes ?? []).map((b) => ({
      id: b.id,
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      vx: 0,
      vy: 0,
      onGround: false,
      shared: Boolean(b.shared),
    }));

    this.switches = (level.switches ?? []).map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      pressed: false,
      gates: s.gates ?? [],
    }));

    this.gates = new Map(Object.entries(level.gates ?? {})); // id -> rect
    this.gateOpen = new Map(); // id -> bool

    this.particles = [];
    this._completedFx = 0;
  }

  getTimelineLabel() {
    return this.timeline === TIMELINE.PAST ? "Past" : "Future";
  }

  getHUD() {
    return { timeline: this.getTimelineLabel() };
  }

  getSolids(timeline = this.timeline) {
    const base =
      timeline === TIMELINE.PAST ? this.level.past?.solids ?? [] : this.level.future?.solids ?? [];
    const shared = this.level.shared?.solids ?? [];

    const gateRects = [];
    for (const [id, r] of this.gates.entries()) {
      if (!this.gateOpen.get(id)) gateRects.push(r);
    }

    return [...shared, ...base, ...gateRects];
  }

  getDeco(timeline = this.timeline) {
    return timeline === TIMELINE.PAST ? this.level.past?.deco ?? [] : this.level.future?.deco ?? [];
  }

  getGoal() {
    return this.level.goal;
  }

  timeShift() {
    const from = this.timeline;
    const to = from === TIMELINE.PAST ? TIMELINE.FUTURE : TIMELINE.PAST;
    this.timeline = to;

    this.transition.active = true;
    this.transition.from = from;
    this.transition.to = to;
    this.transition.t = 0;
    this.transition.flash = 1;

    const cx = this.player.x + this.player.w / 2;
    const cy = this.player.y + this.player.h / 2;
    this._burst(cx, cy, 38);
    return true;
  }

  _burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 520;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 80,
        life: 0.55 + Math.random() * 0.35,
        age: 0,
        r: 2 + Math.random() * 2.5,
      });
    }
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.age += dt;
      p.vy += 1100 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  _updateSwitches() {
    for (const s of this.switches) {
      const was = s.pressed;
      const area = { x: s.x, y: s.y, w: s.w, h: s.h };
      const hit =
        aabbIntersect(this.player, area) ||
        this.boxes.some((b) => aabbIntersect(b, area));
      s.pressed = hit;
      if (!was && hit) {
        this.audio.play("switch");
        for (const gid of s.gates) this.gateOpen.set(gid, true);
      }
    }
  }

  step(dt, input) {
    // transition
    if (this.transition.active) {
      this.transition.t += dt / this.transition.dur;
      if (this.transition.t >= 1) {
        this.transition.t = 1;
        this.transition.active = false;
      }
      this.transition.flash = clamp(this.transition.flash - dt * 5.5, 0, 1);
    }

    // particles
    this._updateParticles(dt);

    // update gates from switches
    this._updateSwitches();

    const solids = this.getSolids(this.timeline);

    // boxes first (gravity)
    for (const b of this.boxes) {
      // tiny friction on ground
      if (b.onGround) {
        b.vx *= Math.pow(0.001, dt); // exponential-ish decay
      } else {
        b.vx *= Math.pow(0.02, dt);
      }
      b.vy += 2400 * dt;
      b.vy = clamp(b.vy, -2400, 2400);
      moveAndCollide(b, solids, dt);
    }

    // player movement
    const jumped = applyPlatformerForces(this.player, input, dt, {
      accel: 3600,
      maxSpeed: 480,
      friction: 3000,
      gravity: 2400,
      jumpVel: 860,
    });
    if (jumped) this.audio.play("jump");

    // horizontal vs solids
    const prevX = this.player.x;
    this.player.x += this.player.vx * dt;
    for (const s of solids) {
      if (!aabbIntersect(this.player, s)) continue;
      if (this.player.vx > 0) this.player.x = s.x - this.player.w;
      else if (this.player.vx < 0) this.player.x = s.x + s.w;
      this.player.vx = 0;
    }

    // horizontal vs boxes (push)
    for (const b of this.boxes) {
      if (!aabbIntersect(this.player, b)) continue;
      if (this.player.x > prevX) {
        // pushing right
        const overlap = this.player.x + this.player.w - b.x;
        const target = b.x + overlap;
        const old = b.x;
        b.x = target;
        const blocked =
          solids.some((s) => aabbIntersect(b, s)) ||
          this.boxes.some((o) => o !== b && aabbIntersect(b, o));
        if (blocked) {
          // blocked; undo and stop player
          b.x = old;
          this.player.x = b.x - this.player.w;
          this.player.vx = 0;
        } else {
          b.vx = Math.max(b.vx, 220);
        }
      } else {
        // pushing left
        const overlap = b.x + b.w - this.player.x;
        const target = b.x - overlap;
        const old = b.x;
        b.x = target;
        const blocked =
          solids.some((s) => aabbIntersect(b, s)) ||
          this.boxes.some((o) => o !== b && aabbIntersect(b, o));
        if (blocked) {
          b.x = old;
          this.player.x = b.x + b.w;
          this.player.vx = 0;
        } else {
          b.vx = Math.min(b.vx, -220);
        }
      }
    }

    // vertical vs solids
    this.player.y += this.player.vy * dt;
    this.player.onGround = false;
    for (const s of solids) {
      if (!aabbIntersect(this.player, s)) continue;
      if (this.player.vy > 0) {
        this.player.y = s.y - this.player.h;
        this.player.onGround = true;
      } else if (this.player.vy < 0) {
        this.player.y = s.y + s.h;
      }
      this.player.vy = 0;
    }

    // vertical vs boxes (stand on / bump)
    for (const b of this.boxes) {
      if (!aabbIntersect(this.player, b)) continue;
      if (this.player.vy > 0) {
        this.player.y = b.y - this.player.h;
        this.player.onGround = true;
      } else if (this.player.vy < 0) {
        this.player.y = b.y + b.h;
      }
      this.player.vy = 0;
    }
  }

  isAtGoal() {
    return aabbIntersect(this.player, this.level.goal);
  }

  onComplete() {
    this._completedFx = 0.8;
    this._burst(this.level.goal.x + this.level.goal.w / 2, this.level.goal.y, 52);
  }

  getTransitionMix() {
    if (!this.transition.active) return { active: false, mix: 1, flash: 0, from: this.timeline, to: this.timeline };
    const mix = smoothstep(this.transition.t);
    return { active: true, mix, flash: this.transition.flash, from: this.transition.from, to: this.transition.to };
  }
}