import { createLoop, fitCanvas, loadScore, saveScore } from "../util.js";

const COLS = 10;
const ROWS = 20;
const CELL = 8;

const COLORS = [
  null,
  "#39d0d8", // I
  "#f2d43c", // O
  "#b562e0", // T
  "#5ce06a", // S
  "#e5484d", // Z
  "#6c8cff", // J
  "#ff9f45", // L
];

const SHAPES = {
  1: [[1, 1, 1, 1]],
  2: [
    [2, 2],
    [2, 2],
  ],
  3: [
    [0, 3, 0],
    [3, 3, 3],
  ],
  4: [
    [0, 4, 4],
    [4, 4, 0],
  ],
  5: [
    [5, 5, 0],
    [0, 5, 5],
  ],
  6: [
    [6, 0, 0],
    [6, 6, 6],
  ],
  7: [
    [0, 0, 7],
    [7, 7, 7],
  ],
};

export function createTetris(ctx) {
  let canvas, g, stopLoop, onResize;
  let board, piece, score, lines, best, dropMs, acc, state, bag;

  function newBag() {
    const ids = [1, 2, 3, 4, 5, 6, 7];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }

  function nextId() {
    if (!bag || bag.length === 0) bag = newBag();
    return bag.pop();
  }

  function spawn() {
    const id = nextId();
    const shape = SHAPES[id].map((r) => r.slice());
    piece = { shape, x: ((COLS - shape[0].length) / 2) | 0, y: 0 };
    if (collides(piece.shape, piece.x, piece.y)) gameOver();
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  function collides(shape, ox, oy) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const nx = ox + x;
        const ny = oy + y;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function rotate(shape) {
    const h = shape.length;
    const w = shape[0].length;
    const out = Array.from({ length: w }, () => new Array(h).fill(0));
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) out[x][h - 1 - y] = shape[y][x];
    return out;
  }

  function tryRotate() {
    const r = rotate(piece.shape);
    for (const dx of [0, -1, 1, -2, 2]) {
      if (!collides(r, piece.x + dx, piece.y)) {
        piece.shape = r;
        piece.x += dx;
        return;
      }
    }
  }

  function move(dx) {
    if (!collides(piece.shape, piece.x + dx, piece.y)) piece.x += dx;
  }

  function softDrop() {
    if (!collides(piece.shape, piece.x, piece.y + 1)) {
      piece.y += 1;
      acc = 0;
    } else {
      lock();
    }
  }

  function hardDrop() {
    while (!collides(piece.shape, piece.x, piece.y + 1)) piece.y += 1;
    lock();
  }

  function lock() {
    for (let y = 0; y < piece.shape.length; y++)
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0)
          board[piece.y + y][piece.x + x] = piece.shape[y][x];
      }
    clearLines();
    spawn();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every((v) => v)) {
        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      score += [0, 40, 100, 300, 1200][cleared];
      lines += cleared;
      dropMs = Math.max(90, 600 - Math.floor(lines / 10) * 60);
    }
  }

  function gameOver() {
    state = "over";
    if (score > best) {
      best = score;
      saveScore("tetris.best", best);
    }
    ctx.phone.setSoftKeys("Retry", "Back");
  }

  function reset() {
    board = emptyBoard();
    score = 0;
    lines = 0;
    dropMs = 600;
    acc = 0;
    bag = newBag();
    state = "ready";
    spawn();
    ctx.phone.setSoftKeys("Start", "Back");
  }

  function cell(x, y, colorIdx) {
    g.fillStyle = COLORS[colorIdx];
    g.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
  }

  function draw() {
    g.fillStyle = "#0a1a12";
    g.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) if (board[y][x]) cell(x, y, board[y][x]);
    if (piece) {
      for (let y = 0; y < piece.shape.length; y++)
        for (let x = 0; x < piece.shape[y].length; x++)
          if (piece.shape[y][x]) cell(piece.x + x, piece.y + y, piece.shape[y][x]);
    }

    g.fillStyle = "#9be34a";
    g.font = '6px "Courier New", monospace';
    g.textBaseline = "top";
    g.fillText(String(score), 2, 2);

    if (state !== "playing") {
      g.fillStyle = "rgba(0,0,0,0.6)";
      g.fillRect(0, canvas.height * 0.34, canvas.width, 40);
      g.fillStyle = "#fff";
      g.textAlign = "center";
      g.font = '8px "Courier New", monospace';
      g.fillText(state === "ready" ? "TETRIS" : "GAME OVER", canvas.width / 2, canvas.height * 0.36);
      g.font = '6px "Courier New", monospace';
      g.fillText(
        state === "ready" ? "Press OK" : "Score " + score,
        canvas.width / 2,
        canvas.height * 0.46,
      );
      g.textAlign = "left";
    }
  }

  return {
    title: "Tetris",
    softLeft: "Start",
    softRight: "Back",
    onEnter() {
      best = loadScore("tetris.best");
      canvas = document.createElement("canvas");
      canvas.width = COLS * CELL;
      canvas.height = ROWS * CELL;
      ctx.viewport.appendChild(canvas);
      g = canvas.getContext("2d");
      onResize = () => fitCanvas(canvas, ctx.viewport);
      window.addEventListener("resize", onResize);
      onResize();
      reset();
      stopLoop = createLoop((dt) => {
        if (state === "playing") {
          acc += dt;
          if (acc >= dropMs) {
            acc -= dropMs;
            if (!collides(piece.shape, piece.x, piece.y + 1)) piece.y += 1;
            else lock();
          }
        }
        draw();
      });
    },
    onExit() {
      if (stopLoop) stopLoop();
      window.removeEventListener("resize", onResize);
    },
    onButton(btn) {
      if (state !== "playing") {
        if (btn === "ok" || btn === "softLeft" || btn === "call") {
          if (state === "over") reset();
          state = "playing";
          ctx.phone.setSoftKeys("", "Back");
          return true;
        }
        if (btn === "softRight" || btn === "end") {
          ctx.show("menu");
          return true;
        }
        return btn !== "end" ? true : false;
      }
      switch (btn) {
        case "left":
          move(-1);
          return true;
        case "right":
          move(1);
          return true;
        case "up":
          tryRotate();
          return true;
        case "down":
          softDrop();
          return true;
        case "ok":
        case "call":
          hardDrop();
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
