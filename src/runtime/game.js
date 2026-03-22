import { Input } from "./input/Input.js";
import { createAudio } from "./audio/audio.js";
import { clamp, fmtTime, lerp } from "./util/math.js";
import { Levels } from "../world/levels.js";
import { World } from "../world/World.js";
import { Renderer } from "../world/Renderer.js";

const STATE = {
  MENU: "menu",
  LEVELS: "levels",
  ABOUT: "about",
  HOW: "how",
  PLAYING: "playing",
  PAUSED: "paused",
  GAMEOVER: "gameover",
};

export class Game {
  constructor({ canvas, onStateChange, onHUD, onToast }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

    this.onStateChange = onStateChange ?? (() => {});
    this.onHUD = onHUD ?? (() => {});
    this.onToast = onToast ?? (() => {});

    this.input = new Input(window);
    this.audio = createAudio();
    this.renderer = new Renderer(this.ctx);

    this.state = STATE.MENU;
    this.levelIndex = 0;
    this.level = null;
    this.world = null;

    this.playTimeMs = 0;
    this.completed = false;
    this.result = null; // last completion / failure info

    this._accum = 0;
    this._last = 0;
    this._raf = 0;

    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize, { passive: true });
    window.addEventListener("orientationchange", this._onResize, { passive: true });

    this.resize();
    this._emitState();
  }

  start() {
    this._last = performance.now();
    const tick = (t) => {
      this._raf = requestAnimationFrame(tick);
      const dt = clamp(t - this._last, 0, 50);
      this._last = t;
      this.update(dt / 1000);
      this.render();
    };
    this._raf = requestAnimationFrame(tick);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("orientationchange", this._onResize);
    this.input.destroy();
  }

  resize() {
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.renderer.setViewport(w, h, dpr);
    }
  }

  setState(next) {
    if (this.state === next) return;
    this.state = next;
    this._emitState();
  }

  _emitState() {
    this.onStateChange({
      state: this.state,
      levels: Levels.map((l) => ({ id: l.id, name: l.name })),
      levelIndex: this.levelIndex,
      result: this.result,
    });
  }

  startLevel(index) {
    this.levelIndex = clamp(index, 0, Levels.length - 1);
    this.level = Levels[this.levelIndex];
    this.world = new World(this.level, this.audio);
    this.playTimeMs = 0;
    this.completed = false;
    this.result = null;
    this.onToast(`Level ${this.levelIndex + 1}: ${this.level.name}`);
    this.setState(STATE.PLAYING);
  }

  nextLevel() {
    const next = this.levelIndex + 1;
    if (next >= Levels.length) {
      this.onToast("All levels complete.");
      this.setState(STATE.MENU);
      return;
    }
    this.startLevel(next);
  }

  resetLevel() {
    this.startLevel(this.levelIndex);
  }

  _gameOver(reason) {
    if (this.state !== STATE.PLAYING || !this.world) return;
    this.audio.play("reset");
    this.result = {
      kind: "fail",
      reason,
      levelIndex: this.levelIndex,
      levelName: this.level.name,
      timeMs: this.playTimeMs,
      timeText: fmtTime(this.playTimeMs),
    };
    this.onToast("Game over.");
    this.state = STATE.GAMEOVER;
    this._emitState();
  }

  update(dt) {
    if (this.state !== STATE.PLAYING) {
      // keep background animating lightly
      this.renderer.updateIdle(dt);
      this.input.nextFrame();
      return;
    }

    if (!this.completed) this.playTimeMs += dt * 1000;

    // timeline switch
    if (this.input.wasPressed("time")) {
      const ok = this.world.timeShift();
      if (ok) this.audio.play("time");
    }

    // reset
    if (this.input.wasPressed("reset")) {
      this.audio.play("reset");
      this.resetLevel();
      this.input.nextFrame();
      return;
    }

    // step simulation (fixed-ish)
    const step = 1 / 120;
    this._accum = clamp(this._accum + dt, 0, 0.15);
    while (this._accum >= step) {
      this.world.step(step, this.input);
      this._accum -= step;
    }

    // game over: fell out of the world
    if (this.world.player.y > this.level.bounds.h + 2 * 64) {
      this._gameOver("fell");
      this.input.nextFrame();
      return;
    }

    if (!this.completed && this.world.isAtGoal()) {
      this.completed = true;
      this.audio.play("goal");
      this.onToast(`Complete! ${fmtTime(this.playTimeMs)}`);
      // small delay handled by renderer; then auto-advance
      this.world.onComplete();
      setTimeout(() => {
        if (this.state === STATE.PLAYING) this.nextLevel();
      }, 900);
    }

    const hud = this.world.getHUD();
    this.onHUD({
      level: `Level ${this.levelIndex + 1}`,
      timeline: hud.timeline,
      time: fmtTime(this.playTimeMs),
    });

    this.input.nextFrame();
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if ((this.state === STATE.PLAYING || this.state === STATE.PAUSED || this.state === STATE.GAMEOVER) && this.world) {
      this.renderer.renderWorld(this.world, w, h);
      return;
    }

    // menu/overlay background
    const t = performance.now() / 1000;
    const mix = 0.5 + 0.5 * Math.sin(t * 0.35);
    this.renderer.renderBackdrop(w, h, lerp(0.1, 0.9, mix));
  }
}

export const GameStates = STATE;