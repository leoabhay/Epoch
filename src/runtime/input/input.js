const KEYMAP = new Map([
  ["ArrowLeft", "left"],
  ["KeyA", "left"],
  ["ArrowRight", "right"],
  ["KeyD", "right"],
  ["Space", "jump"],
  ["ArrowUp", "jump"],
  ["KeyW", "jump"],
  ["KeyT", "time"],
  ["KeyR", "reset"],
]);

export class Input {
  constructor(target) {
    this.target = target;

    this._down = new Set();
    this._pressed = new Set();
    this._released = new Set();

    this._virtualDown = new Map(); // action -> boolean
    this._virtualPressed = new Set();

    this._onKeyDown = (e) => {
      const action = KEYMAP.get(e.code);
      if (!action) return;
      if (e.code === "Space") e.preventDefault();
      if (!this._down.has(action)) this._pressed.add(action);
      this._down.add(action);
    };

    this._onKeyUp = (e) => {
      const action = KEYMAP.get(e.code);
      if (!action) return;
      this._down.delete(action);
      this._released.add(action);
    };

    target.addEventListener("keydown", this._onKeyDown);
    target.addEventListener("keyup", this._onKeyUp);
  }

  destroy() {
    this.target.removeEventListener("keydown", this._onKeyDown);
    this.target.removeEventListener("keyup", this._onKeyUp);
  }

  nextFrame() {
    this._pressed.clear();
    this._released.clear();
    this._virtualPressed.clear();
  }

  setVirtual(action, isDown) {
    const was = Boolean(this._virtualDown.get(action));
    this._virtualDown.set(action, Boolean(isDown));
    if (!was && isDown) this._virtualPressed.add(action);
  }

  isDown(action) {
    return this._down.has(action) || Boolean(this._virtualDown.get(action));
  }

  wasPressed(action) {
    return this._pressed.has(action) || this._virtualPressed.has(action);
  }
}