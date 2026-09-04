import { loadScore, saveScore } from "../util.js";

const COLS = 8;
const ROWS = 10;
const MINES = 12;

export function createMinesweeper(ctx) {
  let grid; // cells: {mine, open, flag, n}
  let cx, cy, state, seeded, flags, best;
  let root, hud;

  function blankGrid() {
    grid = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) row.push({ mine: false, open: false, flag: false, n: 0 });
      grid.push(row);
    }
  }

  function reset() {
    blankGrid();
    cx = 0;
    cy = 0;
    flags = 0;
    seeded = false;
    state = "playing";
    ctx.phone.setSoftKeys("Flag", "Back");
    render();
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }

  function neighbors(x, y) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (inBounds(x + dx, y + dy)) out.push(grid[y + dy][x + dx]);
      }
    return out;
  }

  function seed(safeX, safeY) {
    let placed = 0;
    while (placed < MINES) {
      const x = (Math.random() * COLS) | 0;
      const y = (Math.random() * ROWS) | 0;
      const isSafe = Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;
      if (grid[y][x].mine || isSafe) continue;
      grid[y][x].mine = true;
      placed++;
    }
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        grid[y][x].n = neighbors(x, y).filter((c) => c.mine).length;
    seeded = true;
  }

  function floodOpen(x, y) {
    const stack = [[x, y]];
    while (stack.length) {
      const [px, py] = stack.pop();
      const cell = grid[py][px];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      if (cell.n === 0) {
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx;
            const ny = py + dy;
            if (inBounds(nx, ny) && !grid[ny][nx].open) stack.push([nx, ny]);
          }
      }
    }
  }

  function reveal() {
    if (state !== "playing") return;
    const cell = grid[cy][cx];
    if (cell.flag || cell.open) return;
    if (!seeded) seed(cx, cy);
    if (cell.mine) {
      cell.open = true;
      lose();
      return;
    }
    floodOpen(cx, cy);
    checkWin();
    render();
  }

  function toggleFlag() {
    if (state !== "playing") return;
    const cell = grid[cy][cx];
    if (cell.open) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    render();
  }

  function lose() {
    state = "lost";
    for (const row of grid) for (const c of row) if (c.mine) c.open = true;
    ctx.phone.setSoftKeys("Retry", "Back");
    render();
  }

  function checkWin() {
    let closed = 0;
    for (const row of grid) for (const c of row) if (!c.open) closed++;
    if (closed === MINES) {
      state = "won";
      best = best === 0 ? 1 : best; // record that a win happened
      saveScore("mines.wins", loadScore("mines.wins") + 1);
      ctx.phone.setSoftKeys("Retry", "Back");
    }
  }

  function render() {
    root.innerHTML = "";
    hud = document.createElement("div");
    hud.className = "hud";
    const remaining = MINES - flags;
    let status = "";
    if (state === "won") status = " · WIN!";
    else if (state === "lost") status = " · BOOM";
    hud.innerHTML = `<span>💣 ${remaining}</span><span>Wins ${loadScore(
      "mines.wins",
    )}${status}</span>`;
    root.appendChild(hud);

    const gridEl = document.createElement("div");
    gridEl.className = "ms-grid";
    gridEl.style.setProperty("--cols", COLS);
    gridEl.style.setProperty("--rows", ROWS);
    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = grid[y][x];
        const el = document.createElement("div");
        let cls = "ms-cell";
        if (cell.open) {
          cls += " ms-cell--open";
          if (cell.mine) cls += " ms-cell--mine";
          else if (cell.n > 0) cls += " n" + cell.n;
        }
        if (cell.flag) cls += " ms-cell--flag";
        if (x === cx && y === cy && state === "playing") cls += " ms-cell--cursor";
        el.className = cls;
        if (cell.open) el.textContent = cell.mine ? "✳" : cell.n > 0 ? cell.n : "";
        else if (cell.flag) el.textContent = "⚑";
        gridEl.appendChild(el);
      }
    }
    root.appendChild(gridEl);
  }

  function move(dx, dy) {
    cx = Math.max(0, Math.min(COLS - 1, cx + dx));
    cy = Math.max(0, Math.min(ROWS - 1, cy + dy));
    render();
  }

  return {
    title: "Minesweeper",
    softLeft: "Flag",
    softRight: "Back",
    onEnter() {
      best = loadScore("mines.wins");
      root = document.createElement("div");
      root.style.width = "100%";
      root.style.height = "100%";
      root.style.position = "relative";
      root.style.display = "flex";
      root.style.alignItems = "center";
      root.style.justifyContent = "center";
      ctx.viewport.appendChild(root);
      reset();
    },
    onExit() {},
    onButton(btn) {
      switch (btn) {
        case "up":
          move(0, -1);
          return true;
        case "down":
          move(0, 1);
          return true;
        case "left":
          move(-1, 0);
          return true;
        case "right":
          move(1, 0);
          return true;
        case "ok":
        case "call":
          if (state === "playing") reveal();
          else reset();
          return true;
        case "softLeft":
          if (state === "playing") toggleFlag();
          else reset();
          return true;
        case "hash":
        case "star":
          toggleFlag();
          return true;
        case "softRight":
        case "end":
          ctx.show("menu");
          return true;
        default:
          return false;
      }
    },
  };
}
