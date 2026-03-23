import { clamp } from "../runtime/util/math.js";

export function createUI() {
  const el = {
    hud: document.getElementById("hud"),
    hudLevel: document.getElementById("hudLevel"),
    hudTimeline: document.getElementById("hudTimeline"),
    hudTime: document.getElementById("hudTime"),
    btnPause: document.getElementById("btnPause"),
    btnReset: document.getElementById("btnReset"),
    btnMute: document.getElementById("btnMute"),
    muteIcon: document.getElementById("muteIcon"),

    screenMenu: document.getElementById("screenMenu"),
    screenLevels: document.getElementById("screenLevels"),
    screenAbout: document.getElementById("screenAbout"),
    screenHow: document.getElementById("screenHow"),
    screenSettings: document.getElementById("screenSettings"),
    screenGameOver: document.getElementById("screenGameOver"),
    screenPause: document.getElementById("screenPause"),

    btnPlay: document.getElementById("btnPlay"),
    btnLevels: document.getElementById("btnLevels"),
    btnAbout: document.getElementById("btnAbout"),
    btnHow: document.getElementById("btnHow"),
    btnSettings: document.getElementById("btnSettings"),

    btnLevelsBack: document.getElementById("btnLevelsBack"),
    btnAboutBack: document.getElementById("btnAboutBack"),
    btnHowBack: document.getElementById("btnHowBack"),
    btnSettingsBack: document.getElementById("btnSettingsBack"),

    btnResume: document.getElementById("btnResume"),
    btnRestart: document.getElementById("btnRestart"),
    btnPauseMenu: document.getElementById("btnPauseMenu"),

    cfgPerf: document.getElementById("cfgPerf"),
    cfgShake: document.getElementById("cfgShake"),

    goTitle: document.getElementById("goTitle"),
    goSubtitle: document.getElementById("goSubtitle"),
    btnGoMenu: document.getElementById("btnGoMenu"),
    btnGoRetry: document.getElementById("btnGoRetry"),

    levelButtons: document.getElementById("levelButtons"),
    toast: document.getElementById("toast"),

    mobile: document.getElementById("mobileControls"),
    mLeft: document.getElementById("mLeft"),
    mRight: document.getElementById("mRight"),
    mJump: document.getElementById("mJump"),
    mTime: document.getElementById("mTime"),
    mainFooter: document.getElementById("mainFooter"),
  };

  let _toastTimer = 0;
  let _levelsBuilt = false;
  let _lastState = "menu";
  
  // Game Config
  const config = {
    perf: false,
    shake: true,
  };

  // Update copyright year
  const yearEl = document.getElementById("copyrightYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const isMobileLike = () =>
    (navigator.maxTouchPoints ?? 0) > 0 ||
    window.matchMedia?.("(pointer: coarse)").matches ||
    window.innerWidth < 768;

  const show = (node, on) => {
    if (node) node.classList.toggle("hidden", !on);
  };

  const showScreen = (name) => {
    const screens = [
      el.screenMenu, 
      el.screenLevels, 
      el.screenAbout, 
      el.screenHow, 
      el.screenGameOver, 
      el.screenPause,
      el.screenSettings
    ];
    for (const s of screens) {
      if (!s) continue;
      const on = s.id === name;
      show(s, on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
    }
  };

  const toast = (msg) => {
    clearTimeout(_toastTimer);
    el.toast.textContent = msg;
    show(el.toast, true);
    _toastTimer = setTimeout(() => show(el.toast, false), clamp(1600 + msg.length * 18, 1600, 3400));
  };

  const _glowPast = document.getElementById("glow-past");
  const _glowFuture = document.getElementById("glow-future");

  const onHUD = ({ level, timeline, time }) => {
    el.hudLevel.textContent = level;
    el.hudTimeline.textContent = timeline;
    el.hudTime.textContent = time;

    const isPast = timeline.toLowerCase() === "past";
    el.hudTimeline.classList.toggle("past-accent", isPast);
    el.hudTimeline.classList.toggle("future-accent", !isPast);

    if (_glowPast && _glowFuture) {
      _glowPast.style.opacity = isPast ? "0.35" : "0.05";
      _glowFuture.style.opacity = isPast ? "0.05" : "0.35";
    }
  };

  const onStateChange = ({ state, levels, result }) => {
    _lastState = state;
    const isPaused = state === "paused";
    const isPlaying = state === "playing" || isPaused;
    
    show(el.hud, isPlaying);
    
    if (state === "playing") {
      showScreen("__none__");
    } else if (isPaused) {
      showScreen("screenPause");
    }

    if (!_levelsBuilt && _game && levels?.length) {
      _levelsBuilt = true;
      el.levelButtons.innerHTML = "";
      levels.forEach((lvl, i) => {
        const b = document.createElement("button");
        b.className = "level-row group animate-slide-down";
        b.style.animationDelay = `${i * 0.05}s`;
        b.type = "button";
        b.innerHTML = `
          <div class="flex items-center gap-6">
            <span class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black border border-white/10 group-hover:bg-white/20 transition-all">${String(i + 1).padStart(2, '0')}</span>
            <div class="flex flex-col text-left">
              <span class="font-bold text-white/90 text-sm italic tracking-tighter uppercase">${lvl.name}</span>
              <span class="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Ready to play</span>
            </div>
          </div>
          <svg class="w-5 h-5 opacity-0 group-hover:opacity-40 transition-all translate-x-2 group-hover:translate-x-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        `;
        b.addEventListener("click", () => _game.startLevel(i));
        el.levelButtons.appendChild(b);
      });
    }

    if (!isPlaying) {
      if (state === "levels") showScreen("screenLevels");
      else if (state === "about") showScreen("screenAbout");
      else if (state === "how") showScreen("screenHow");
      else if (state === "settings") showScreen("screenSettings");
      else if (state === "gameover") {
        showScreen("screenGameOver");
        if (result?.kind === "fail") {
          el.goTitle.textContent = "Simulation Failed";
          el.goSubtitle.textContent = `Temporal drift exceeded safe limits at level ${result.levelIndex + 1}.`;
        } else {
          el.goTitle.textContent = "System Offline";
          el.goSubtitle.textContent = "Protocol complete. Data logs synchronized.";
        }
      } else {
        showScreen("screenMenu");
      }
    }
    show(el.mainFooter, state === "menu" || state === "about" || state === "how" || state === "settings");
  };

  /** @type {import("../runtime/game.js").Game | null} */
  let _game = null;

  const updateConfigUI = () => {
    // Perf Toggle
    const dotPerf = el.cfgPerf.querySelector('div');
    el.cfgPerf.classList.toggle('bg-white/20', config.perf);
    el.cfgPerf.classList.toggle('bg-white/5', !config.perf);
    dotPerf.classList.toggle('left-7', config.perf);
    dotPerf.classList.toggle('left-1', !config.perf);
    dotPerf.classList.toggle('bg-white', config.perf);
    dotPerf.classList.toggle('bg-white/20', !config.perf);

    // Shake Toggle
    const dotShake = el.cfgShake.querySelector('div');
    el.cfgShake.classList.toggle('bg-white/20', config.shake);
    el.cfgShake.classList.toggle('bg-white/5', !config.shake);
    dotShake.classList.toggle('left-7', config.shake);
    dotShake.classList.toggle('left-1', !config.shake);
    dotShake.classList.toggle('bg-white', config.shake);
    dotShake.classList.toggle('bg-white/20', !config.shake);
  };

  const bind = (game) => {
    _game = game;

    const unlockAudio = () => game.audio.unlock();
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    // HUD Actions
    el.btnPause.addEventListener("click", () => {
      if (game.state === "playing") game.setState("paused");
      else if (game.state === "paused") game.setState("playing");
    });

    el.btnReset.addEventListener("click", () => {
      game.resetLevel();
    });

    el.btnMute.addEventListener("click", () => {
      const isMuted = game.audio.toggleMute();
      el.btnMute.classList.toggle("opacity-40", isMuted);
      el.btnMute.classList.toggle("opacity-100", !isMuted);
      el.muteIcon.innerHTML = isMuted 
        ? '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path>'
        : '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>';
    });

    // Menu Actions
    el.btnPlay.addEventListener("click", () => {
      if (game.world && _lastState === "paused") {
        game.setState("playing");
      } else {
        game.startLevel(game.levelIndex);
      }
    });
    
    el.btnLevels.addEventListener("click", () => game.setState("levels"));
    el.btnSettings.addEventListener("click", () => game.setState("settings"));
    el.btnAbout.addEventListener("click", () => game.setState("about"));
    el.btnHow.addEventListener("click", () => game.setState("how"));

    el.btnLevelsBack.addEventListener("click", () => game.setState("menu"));
    el.btnAboutBack.addEventListener("click", () => game.setState("menu"));
    el.btnHowBack.addEventListener("click", () => game.setState("menu"));
    el.btnSettingsBack.addEventListener("click", () => {
      game.setState("menu");
      toast("Config Synchronized");
    });

    // Config Toggles
    el.cfgPerf.addEventListener("click", () => {
      config.perf = !config.perf;
      updateConfigUI();
    });
    el.cfgShake.addEventListener("click", () => {
      config.shake = !config.shake;
      updateConfigUI();
    });
    updateConfigUI();

    // Pause Screen Actions
    el.btnResume.addEventListener("click", () => game.setState("playing"));
    el.btnRestart.addEventListener("click", () => game.resetLevel());
    el.btnPauseMenu.addEventListener("click", () => game.setState("menu"));

    // Game Over Actions
    el.btnGoMenu.addEventListener("click", () => game.setState("menu"));
    el.btnGoRetry.addEventListener("click", () => game.resetLevel());

    const updateMobile = () => {
      const on = isMobileLike();
      show(el.mobile, on);
      el.mobile.setAttribute("aria-hidden", on ? "false" : "true");
    };
    updateMobile();
    window.addEventListener("resize", updateMobile, { passive: true });

    const bindHold = (button, action) => {
      const down = (e) => {
        e.preventDefault();
        game.input.setVirtual(action, true);
      };
      const up = (e) => {
        e.preventDefault();
        game.input.setVirtual(action, false);
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("pointerleave", up);
    };

    bindHold(el.mLeft, "left");
    bindHold(el.mRight, "right");
    bindHold(el.mJump, "jump");
    el.mTime.addEventListener("click", (e) => {
      e.preventDefault();
      game.input.setVirtual("time", true);
      queueMicrotask(() => game.input.setVirtual("time", false));
    });
  };

  return { bind, onStateChange, onHUD, toast };
}