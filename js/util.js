// Small shared helpers used by the games.

/** Scale a canvas (with a fixed logical backing size) to fit its container
 *  while preserving aspect ratio. Call on enter and on resize. */
export function fitCanvas(canvas, container) {
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  if (!cw || !ch) return;
  const scale = Math.min(cw / canvas.width, ch / canvas.height);
  canvas.style.width = Math.max(1, Math.floor(canvas.width * scale)) + "px";
  canvas.style.height = Math.max(1, Math.floor(canvas.height * scale)) + "px";
}

/** Persisted high score / best value helpers (work fully offline). */
export function loadScore(key) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function saveScore(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** A fixed-timestep game loop driven by requestAnimationFrame. Returns a
 *  stop() function; screens must call it on exit to avoid leaks. */
export function createLoop(update) {
  let raf = 0;
  let last = performance.now();
  let running = true;
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(100, now - last);
    last = now;
    update(dt);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
  };
}
