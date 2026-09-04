// Main menu + About screens, styled like a feature-phone game list.

const GAMES = [
  { id: "snake", label: "Snake", ico: "🐍" },
  { id: "minesweeper", label: "Minesweeper", ico: "💣" },
  { id: "tetris", label: "Tetris", ico: "🧱" },
  { id: "about", label: "About", ico: "ℹ️" },
];

export function createMenu(ctx) {
  let index = 0;
  let root;

  function render() {
    root.innerHTML = "";
    GAMES.forEach((game, i) => {
      const item = document.createElement("div");
      item.className = "menu__item" + (i === index ? " menu__item--active" : "");
      item.innerHTML = `<span class="ico">${game.ico}</span><span>${game.label}</span>`;
      root.appendChild(item);
    });
  }

  function open() {
    ctx.show(GAMES[index].id);
  }

  return {
    title: "Flip Arcade",
    softLeft: "Select",
    softRight: "",
    onEnter() {
      root = document.createElement("div");
      root.className = "menu";
      ctx.viewport.appendChild(root);
      render();
    },
    onButton(btn) {
      switch (btn) {
        case "up":
          index = (index - 1 + GAMES.length) % GAMES.length;
          render();
          return true;
        case "down":
          index = (index + 1) % GAMES.length;
          render();
          return true;
        case "ok":
        case "softLeft":
        case "call":
          open();
          return true;
        default:
          // Number shortcuts 1..n jump straight into a game.
          if (btn.startsWith("num")) {
            const n = Number(btn.slice(3));
            if (n >= 1 && n <= GAMES.length) {
              index = n - 1;
              render();
              open();
            }
            return true;
          }
          return false;
      }
    },
  };
}

export function createAbout(ctx) {
  return {
    title: "About",
    softLeft: "",
    softRight: "Back",
    onEnter() {
      const panel = document.createElement("div");
      panel.className = "panel";
      panel.innerHTML = `
        <h3>FLIP ARCADE</h3>
        <p>Classic phone games, reborn as an offline PWA.</p>
        <p><b>Controls</b><br/>
        D-pad / arrow keys to move.<br/>
        <b>OK</b> confirm &middot; <b>#</b> flag (Mines).<br/>
        Red key or <b>Esc</b> returns to the menu.</p>
        <p>Install it to your home screen and it keeps working with no signal.</p>
      `;
      ctx.viewport.appendChild(panel);
    },
    onButton(btn) {
      if (btn === "softRight" || btn === "end") {
        ctx.show("menu");
        return true;
      }
      return false;
    },
  };
}
