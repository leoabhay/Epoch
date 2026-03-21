import { clamp } from "../runtime/util/math.js";

export function createUI() {
  const el = {
    hud: document.getElementById("hud"),
    hudLevel: document.getElementById("hudLevel"),
    hudTimeline: document.getElementById("hudTimeline"),
    hudTime: document.getElementById("hudTime"),
    btnPause: document.getElementById("btnPause"),

    screenMenu: document.getElementById("screenMenu"),
    screenLevels: document.getElementById("screenLevels"),
    screenAbout: document.getElementById("screenAbout"),
    screenHow: document.getElementById("screenHow"),
    screenGameOver: document.getElementById("screenGameOver"),

    btnPlay: document.getElementById("btnPlay"),
    btnLevels: document.getElementById("btnLevels"),
    btnAbout: document.getElementById("btnAbout"),
    btnHow: document.getElementById("btnHow"),

    btnLevelsBack: document.getElementById("btnLevelsBack"),
    btnAboutBack: document.getElementById("btnAboutBack"),
    btnHowBack: document.getElementById("btnHowBack"),

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

  // Update copyright year
  const yearEl = document.getElementById("copyrightYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const isMobileLike = () =>
    (navigator.maxTouchPoints ?? 0) > 0 ||
    window.matchMedia?.("(pointer: coarse)").matches ||
    window.innerWidth < 820;

  const show = (node, on) => node.classList.toggle("hidden", !on);

  const showScreen = (name) => {
    const screens = [el.screenMenu, el.screenLevels, el.screenAbout, el.screenHow, el.screenGameOver];
    for (const s of screens) {
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

  const onHUD = ({ level, timeline, time }) => {
    el.hudLevel.textContent = level;
    el.hudTimeline.textContent = timeline;
    el.hudTime.textContent = time;
  };

  const onStateChange = ({ state, levels, result }) => {
    _lastState = state;
    const playing = state === "playing";
    show(el.hud, playing);
    show(el.btnPause, true);
    if (playing) showScreen("__none__");

    if (!_levelsBuilt && _game && levels?.length) {
      _levelsBuilt = true;
      el.levelButtons.innerHTML = "";
      levels.forEach((lvl, i) => {
        const b = document.createElement("button");
        b.className = "btn";
        b.type = "button";
        b.textContent = `${i + 1}. ${lvl.name}`;
        b.addEventListener("click", () => _game.startLevel(i));
        el.levelButtons.appendChild(b);
      });
    }

    if (!playing) {
      if (state === "levels") showScreen("screenLevels");
      else if (state === "about") showScreen("screenAbout");
      else if (state === "how") showScreen("screenHow");
      else if (state === "gameover") {
        showScreen("screenGameOver");
        if (result?.kind === "fail") {
          el.goTitle.textContent = "Game Over";
          el.goSubtitle.textContent = `You fell in Level ${result.levelIndex + 1} (${result.levelName}) after ${result.timeText}.`;
        } else {
          el.goTitle.textContent = "Game Over";
          el.goSubtitle.textContent = "You fell out of time. Try the level again or return to the menu.";
        }
      } else {
        showScreen("screenMenu");
      }
    }
    show(el.mainFooter, !playing);
  };

  /** @type {import("../runtime/game.js").Game | null} */
  let _game = null;

  const bind = (game) => {
    _game = game;

    const unlockAudio = () => game.audio.unlock();
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    el.btnPause.addEventListener("click", () => {
      if (game.state === "playing") {
        toast("Paused");
        game.setState("menu");
      } else if (game.world) {
        game.setState("playing");
      }
    });

    el.btnPlay.addEventListener("click", () => {
      if (game.world && _lastState !== "playing") {
        game.setState("playing");
        return;
      }
      game.startLevel(0);
    });
    el.btnLevels.addEventListener("click", () => game.setState("levels"));
    el.btnAbout.addEventListener("click", () => game.setState("about"));
    el.btnHow.addEventListener("click", () => game.setState("how"));

    el.btnLevelsBack.addEventListener("click", () => game.setState("menu"));
    el.btnAboutBack.addEventListener("click", () => game.setState("menu"));
    el.btnHowBack.addEventListener("click", () => game.setState("menu"));

    el.btnGoMenu.addEventListener("click", () => {
      game.setState("menu");
    });
    el.btnGoRetry.addEventListener("click", () => {
      game.resetLevel();
    });

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
    // time is a tap action
    el.mTime.addEventListener("click", (e) => {
      e.preventDefault();
      game.input.setVirtual("time", true);
      queueMicrotask(() => game.input.setVirtual("time", false));
    });
  };

  return { bind, onStateChange, onHUD, toast };
}