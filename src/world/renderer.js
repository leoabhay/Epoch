import { clamp, lerp, invLerp, smoothstep } from "../runtime/util/math.js";

const PAST = {
  skyA: "#1a1022",
  skyB: "#2a1b14",
  tint: "rgba(255,170,90,0.10)",
  ground: "#e6b07a",
  ground2: "#cf8a49",
  stroke: "rgba(0,0,0,0.28)",
  obj: "#ffd2a2",
  obj2: "#ff9e7b",
  player: "#ffe9d3",
  player2: "#ffb86c",
  particle: "rgba(255,198,132,0.90)",
};

const FUTURE = {
  skyA: "#0b1533",
  skyB: "#0b0f22",
  tint: "rgba(88,166,255,0.10)",
  ground: "#88c6ff",
  ground2: "#4f8fe0",
  stroke: "rgba(0,0,0,0.28)",
  obj: "#a9efff",
  obj2: "#6cf6c8",
  player: "#e8f4ff",
  player2: "#58a6ff",
  particle: "rgba(136,220,255,0.92)",
};

const roundRect = (ctx, x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.vw = 0;
    this.vh = 0;
    this.dpr = 1;

    this.camX = 0;
    this.camY = 0;
    this._t = 0;
  }

  setViewport(w, h, dpr) {
    this.vw = w;
    this.vh = h;
    this.dpr = dpr;
  }

  updateIdle(dt) {
    this._t += dt;
  }

  renderBackdrop(w, h, mix01) {
    const ctx = this.ctx;
    const t = this._t + performance.now() / 1000;
    const skyA = mix01 < 0.5 ? PAST.skyA : FUTURE.skyA;
    const skyB = mix01 < 0.5 ? PAST.skyB : FUTURE.skyB;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, skyA);
    g.addColorStop(1, skyB);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // soft moving bands
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 5; i++) {
      const y = (h * (0.15 + i * 0.15)) + Math.sin(t * 0.35 + i) * 18;
      ctx.fillRect(0, y, w, 2);
    }
    ctx.globalAlpha = 1;
  }

  renderWorld(world, w, h) {
    const ctx = this.ctx;
    // zoom based on viewport so gameplay scale feels consistent on phones vs desktop
    const baseW = 1280;
    const baseH = 720;
    const scale = clamp(Math.min(w / baseW, h / baseH), 0.6, 1.4);
    const viewW = w / scale;
    const viewH = h / scale;
    const mixInfo = world.getTransitionMix();

    const palette = world.timeline === "past" ? PAST : FUTURE;
    const bounds = world.level.bounds;
    const px = world.player.x + world.player.w / 2;
    const py = world.player.y + world.player.h / 2;

    // camera smoothing
    const targetX = px - viewW * 0.5;
    const targetY = py - viewH * 0.52;
    const s = 1 - Math.pow(0.0005, 1 / 60);
    this.camX = lerp(this.camX, targetX, s);
    this.camY = lerp(this.camY, targetY, s);
    this.camX = clamp(this.camX, 0, Math.max(0, bounds.w - viewW));
    this.camY = clamp(this.camY, 0, Math.max(0, bounds.h - viewH));

    this._t += 1 / 60;

    // background / parallax
    ctx.save();
    ctx.scale(scale, scale);
    this._drawParallax(viewW, viewH, palette, this.camX, this.camY);

    ctx.translate(-this.camX, -this.camY);

    const drawTimeline = (tl, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      this._drawDeco(world.getDeco(tl), tl === "past" ? PAST : FUTURE);
      this._drawSolids(world.getSolids(tl), tl === "past" ? PAST : FUTURE);
      this._drawGoal(world.getGoal(), tl === "past" ? PAST : FUTURE);
      this._drawSwitches(world.switches, tl === "past" ? PAST : FUTURE);
      ctx.restore();
    };

    if (mixInfo.active) {
      drawTimeline(mixInfo.from, 1 - mixInfo.mix);
      drawTimeline(mixInfo.to, mixInfo.mix);
    } else {
      drawTimeline(world.timeline, 1);
    }

    // entities (single pass)
    this._drawBoxes(world.boxes, palette);
    this._drawPlayer(world.player, palette);
    this._drawParticles(world.particles, palette);

    ctx.restore(); // world & parallax (scaled space)

    // overlays: timeline tint + time flash (screen space)
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.tint;
    ctx.fillRect(0, 0, w, h);

    if (mixInfo.active) {
      // edge shimmer
      const edge = 0.18 + 0.35 * (1 - Math.abs(mixInfo.mix * 2 - 1));
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = edge;
      const cg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.65);
      cg.addColorStop(0, "rgba(255,255,255,0.12)");
      cg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }

    if (mixInfo.flash > 0) {
      ctx.globalAlpha = mixInfo.flash * 0.65;
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fillRect(0, 0, w, h);
    }

    // subtle vignette
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.2, w * 0.5, h * 0.55, Math.max(w, h) * 0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  _drawParallax(w, h, pal, camX, camY) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.skyA);
    g.addColorStop(1, pal.skyB);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const t = this._t;
    const layer = (depth, color, yBase, amp) => {
      const xOff = -camX * depth + Math.sin(t * 0.2 * (1 + depth)) * 18;
      const yOff = -camY * depth;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(xOff, h);
      const steps = 7;
      for (let i = 0; i <= steps; i++) {
        const x = xOff + (w + 200) * (i / steps);
        const y = yBase + yOff + Math.sin(i * 0.9 + t * 0.18) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(xOff + w + 260, h);
      ctx.closePath();
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    layer(0.08, "rgba(255,255,255,0.04)", h * 0.62, 26);
    layer(0.14, "rgba(255,255,255,0.06)", h * 0.70, 30);
    layer(0.24, "rgba(0,0,0,0.14)", h * 0.78, 32);
  }

  _drawSolids(solids, pal) {
    const ctx = this.ctx;
    for (const s of solids) {
      // base
      ctx.fillStyle = pal.ground;
      roundRect(ctx, s.x, s.y, s.w, s.h, 14);
      ctx.fill();

      // top sheen
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = pal.ground2;
      roundRect(ctx, s.x, s.y, s.w, Math.min(10, s.h), 14);
      ctx.fill();
      ctx.globalAlpha = 1;

      // stroke
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 2;
      roundRect(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, 14);
      ctx.stroke();
    }
  }

  _drawGoal(goal, pal) {
    const ctx = this.ctx;
    const cx = goal.x + goal.w / 2;
    const cy = goal.y + goal.h / 2;
    const r = Math.max(goal.w, goal.h) * 0.9;
    const t = this._t;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
    g.addColorStop(0, pal.obj2);
    g.addColorStop(0.6, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.55, r * 0.8, Math.sin(t * 0.9) * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // anchor outline
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    roundRect(ctx, goal.x, goal.y, goal.w, goal.h, 10);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  _drawPlayer(p, pal) {
    const ctx = this.ctx;
    const x = p.x;
    const y = p.y;
    ctx.fillStyle = pal.player;
    roundRect(ctx, x, y, p.w, p.h, 16);
    ctx.fill();

    ctx.globalAlpha = 0.28;
    ctx.fillStyle = pal.player2;
    roundRect(ctx, x + 4, y + 6, p.w - 8, Math.min(14, p.h - 10), 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    // visor
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    roundRect(ctx, x + p.w * 0.22, y + p.h * 0.30, p.w * 0.56, p.h * 0.22, 10);
    ctx.fill();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = pal.obj2;
    roundRect(ctx, x + p.w * 0.24, y + p.h * 0.32, p.w * 0.52, p.h * 0.08, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  _drawBoxes(boxes, pal) {
    const ctx = this.ctx;
    for (const b of boxes) {
      ctx.fillStyle = "rgba(16,22,42,0.60)";
      roundRect(ctx, b.x, b.y, b.w, b.h, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth = 2;
      roundRect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, 12);
      ctx.stroke();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = pal.obj2;
      roundRect(ctx, b.x + 4, b.y + 4, b.w - 8, 8, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  _drawSwitches(switches, pal) {
    const ctx = this.ctx;
    for (const s of switches) {
      const on = s.pressed;
      ctx.fillStyle = on ? pal.obj2 : "rgba(255,255,255,0.18)";
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      roundRect(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  _drawParticles(particles, pal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const p of particles) {
      const a = 1 - clamp(p.age / p.life, 0, 1);
      ctx.globalAlpha = 0.55 * a;
      ctx.fillStyle = pal.particle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawDeco(items, pal) {
    const ctx = this.ctx;
    for (const d of items) {
      if (d.type === "tree") this._drawTree(d.x, d.y, d.scale ?? 1, pal);
      else if (d.type === "sapling") this._drawSapling(d.x, d.y, d.scale ?? 1, pal);
      else if (d.type === "ruin") this._drawRuin(d.x, d.y, d.scale ?? 1, pal);
      else if (d.type === "bridge") this._drawBridge(d.x, d.y, d.scale ?? 1, pal);
      else if (d.type === "structure") this._drawStructure(d.x, d.y, d.scale ?? 1, pal);
    }
  }

  _drawTree(x, y, s, pal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    roundRect(ctx, -8, -84, 16, 86, 10);
    ctx.fill();

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = pal.obj;
    roundRect(ctx, -7, -86, 14, 84, 10);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pal.obj2;
    ctx.beginPath();
    ctx.ellipse(0, -105, 54, 30, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-26, -98, 42, 24, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(30, -98, 42, 24, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  _drawSapling(x, y, s, pal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = pal.obj;
    roundRect(ctx, -4, -40, 8, 40, 8);
    ctx.fill();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = pal.obj2;
    ctx.beginPath();
    ctx.ellipse(0, -52, 22, 14, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  _drawRuin(x, y, s, pal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, -40, -42, 70, 42, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    roundRect(ctx, -30, -70, 38, 70, 10);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawBridge(x, y, s, pal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pal.obj;
    roundRect(ctx, 0, -8, 240, 16, 12);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < 8; i++) {
      roundRect(ctx, 10 + i * 28, -6, 14, 12, 6);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawStructure(x, y, s, pal) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, -56, -70, 110, 70, 16);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = pal.obj2;
    roundRect(ctx, -40, -54, 34, 28, 10);
    ctx.fill();
    roundRect(ctx, 6, -54, 34, 28, 10);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}