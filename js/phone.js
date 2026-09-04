// Core "phone" runtime: owns the screen stack, soft-key labels, status title,
// and routes logical button presses to the active screen.

const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  Enter: "ok",
  Space: "ok",
  KeyQ: "softLeft",
  KeyE: "softRight",
  Escape: "end",
  Backspace: "end",
  KeyF: "hash",
  Digit1: "num1",
  Digit2: "num2",
  Digit3: "num3",
  Digit4: "num4",
  Digit5: "num5",
  Digit6: "num6",
  Digit7: "num7",
  Digit8: "num8",
  Digit9: "num9",
  Digit0: "num0",
};

export class Phone {
  constructor(dom) {
    this.viewport = dom.viewport;
    this.title = dom.title;
    this.softLeft = dom.softLeft;
    this.softRight = dom.softRight;
    this.keypad = dom.keypad;
    this.screens = new Map();
    this.current = null;
    this._wireInput();
  }

  register(name, factory) {
    this.screens.set(name, factory);
  }

  show(name, params) {
    const factory = this.screens.get(name);
    if (!factory) throw new Error(`unknown screen: ${name}`);
    if (this.current && this.current.onExit) this.current.onExit();
    this.viewport.innerHTML = "";
    this.setSoftKeys("", "");
    const ctx = {
      phone: this,
      viewport: this.viewport,
      show: (n, p) => this.show(n, p),
    };
    const screen = factory(ctx);
    this.current = screen;
    this.setTitle(screen.title || "");
    this.setSoftKeys(screen.softLeft || "", screen.softRight || "");
    if (screen.onEnter) screen.onEnter(params || {});
  }

  setTitle(text) {
    this.title.textContent = text;
  }

  setSoftKeys(left, right) {
    this.softLeft.textContent = left || "";
    this.softRight.textContent = right || "";
  }

  dispatch(button) {
    if (!button) return;
    const handled =
      this.current && this.current.onButton
        ? this.current.onButton(button)
        : false;
    // "end" (red key) is a global hard-exit back to the main menu.
    if (!handled && button === "end") {
      this.show("menu");
    }
  }

  _wireInput() {
    window.addEventListener(
      "keydown",
      (e) => {
        const btn = KEY_MAP[e.code];
        if (!btn) return;
        e.preventDefault();
        if (e.repeat) return;
        this.dispatch(btn);
      },
      { passive: false },
    );

    // On-screen keypad: one tap = one action (no auto-repeat), so touch input
    // behaves exactly like a single key press. We fire on pointerdown for a
    // snappy feel and de-dupe the follow-up click that pointer taps also emit.
    const clearPressed = () => {
      this.keypad
        .querySelectorAll(".key.is-pressed")
        .forEach((el) => el.classList.remove("is-pressed"));
    };

    this.keypad.addEventListener(
      "pointerdown",
      (e) => {
        const keyEl = e.target.closest(".key");
        if (!keyEl) return;
        e.preventDefault();
        keyEl.classList.add("is-pressed");
        this._suppressClick = true;
        this.dispatch(keyEl.dataset.btn);
      },
      { passive: false },
    );

    // Fallback for environments without pointer events.
    this.keypad.addEventListener("click", (e) => {
      const keyEl = e.target.closest(".key");
      if (!keyEl) return;
      if (this._suppressClick) {
        this._suppressClick = false;
        return;
      }
      keyEl.classList.add("is-pressed");
      this.dispatch(keyEl.dataset.btn);
      setTimeout(clearPressed, 90);
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach((type) =>
      this.keypad.addEventListener(type, clearPressed),
    );
    this.keypad.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
