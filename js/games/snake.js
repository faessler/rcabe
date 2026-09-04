import { createLoop, fitCanvas, loadScore, saveScore } from "../util.js";

const COLS = 16;
const ROWS = 20;
const CELL = 8;
const START_STEP = 280; // ms per move (gentle enough for touch play)
const MIN_STEP = 100;

export function createSnake(ctx) {
  let canvas, g, stopLoop, onResize;
  let snake, dir, nextDir, food, score, best, step, acc, state;

  function reset() {
    snake = [
      { x: 7, y: 10 },
      { x: 6, y: 10 },
      { x: 5, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    step = START_STEP;
    acc = 0;
    placeFood();
    state = "ready";
    updateSoft();
  }

  function placeFood() {
    while (true) {
      const f = {
        x: (Math.random() * COLS) | 0,
        y: (Math.random() * ROWS) | 0,
      };
      if (!snake.some((s) => s.x === f.x && s.y === f.y)) {
        food = f;
        return;
      }
    }
  }

  function updateSoft() {
    if (state === "ready") ctx.phone.setSoftKeys("Start", "Back");
    else if (state === "over") ctx.phone.setSoftKeys("Retry", "Back");
    else ctx.phone.setSoftKeys("", "Back");
  }

  function turn(nx, ny) {
    // Disallow reversing directly into the neck.
    if (nx === -dir.x && ny === -dir.y) return;
    nextDir = { x: nx, y: ny };
  }

  function stepGame() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= COLS ||
      head.y >= ROWS ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      gameOver();
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      step = Math.max(MIN_STEP, START_STEP - score * 8);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    state = "over";
    if (score > best) {
      best = score;
      saveScore("snake.best", best);
    }
    updateSoft();
  }

  function draw() {
    g.fillStyle = "#0f2a1e";
    g.fillRect(0, 0, canvas.width, canvas.height);

    // food
    g.fillStyle = "#e5484d";
    g.fillRect(food.x * CELL + 1, food.y * CELL + 1, CELL - 2, CELL - 2);

    // snake
    snake.forEach((s, i) => {
      g.fillStyle = i === 0 ? "#d7ffa6" : "#8bd450";
      g.fillRect(s.x * CELL, s.y * CELL, CELL - 1, CELL - 1);
    });

    // HUD
    g.fillStyle = "#9be34a";
    g.font = '7px "Courier New", monospace';
    g.textBaseline = "top";
    g.fillText("S:" + score, 2, 2);
    const bestLabel = "HI:" + best;
    g.fillText(bestLabel, canvas.width - bestLabel.length * 4 - 2, 2);

    if (state !== "playing") {
      g.fillStyle = "rgba(0,0,0,0.55)";
      g.fillRect(0, ROWS * CELL * 0.32, canvas.width, 44);
      g.fillStyle = "#ffffff";
      g.textAlign = "center";
      g.font = '9px "Courier New", monospace';
      if (state === "ready") {
        g.fillText("SNAKE", canvas.width / 2, ROWS * CELL * 0.34);
        g.font = '7px "Courier New", monospace';
        g.fillText("Press OK", canvas.width / 2, ROWS * CELL * 0.45);
      } else {
        g.fillText("GAME OVER", canvas.width / 2, ROWS * CELL * 0.34);
        g.font = '7px "Courier New", monospace';
        g.fillText("Score " + score, canvas.width / 2, ROWS * CELL * 0.45);
      }
      g.textAlign = "left";
    }
  }

  return {
    title: "Snake",
    softLeft: "Start",
    softRight: "Back",
    onEnter() {
      best = loadScore("snake.best");
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
          while (acc >= step) {
            acc -= step;
            stepGame();
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
      switch (btn) {
        case "up":
          turn(0, -1);
          return true;
        case "down":
          turn(0, 1);
          return true;
        case "left":
          turn(-1, 0);
          return true;
        case "right":
          turn(1, 0);
          return true;
        case "ok":
        case "call":
        case "softLeft":
          if (state === "ready") state = "playing";
          else if (state === "over") reset();
          if (state === "playing" || state === "ready") updateSoft();
          if (state === "playing") ctx.phone.setSoftKeys("", "Back");
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
