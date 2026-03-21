import { createUI } from "./ui/uimanager.js";
import { Game } from "./runtime/game.js";

const canvas = document.getElementById("game");
const ui = createUI();

const game = new Game({
  canvas,
  onStateChange: ui.onStateChange,
  onHUD: ui.onHUD,
  onToast: ui.toast,
});

ui.bind(game);
game.start();