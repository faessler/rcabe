import { Phone } from "./phone.js";
import { createMenu, createAbout } from "./menu.js";
import { createSnake } from "./games/snake.js";
import { createMinesweeper } from "./games/minesweeper.js";
import { createTetris } from "./games/tetris.js";

const phone = new Phone({
  viewport: document.getElementById("viewport"),
  title: document.getElementById("statusTitle"),
  softLeft: document.getElementById("softLeftLabel"),
  softRight: document.getElementById("softRightLabel"),
  keypad: document.getElementById("keypad"),
});

phone.register("menu", createMenu);
phone.register("about", createAbout);
phone.register("snake", createSnake);
phone.register("minesweeper", createMinesweeper);
phone.register("tetris", createTetris);

phone.show("menu");

// Register the service worker so the arcade works fully offline once loaded.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support unavailable — the app still runs online */
    });
  });
}
