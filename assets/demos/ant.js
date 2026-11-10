/* 01 · Муравей Лэнгтона — клеточный автомат на Canvas. */

(function () {
  "use strict";

  window.VisualLab = window.VisualLab || {};
  const VL = window.VisualLab;
  VL.demos = VL.demos || {};

  VL.demos.ant = function (root) {
    const $ = function (selector) {
      return root.querySelector(selector);
    };

    const COLS = 150;
    const ROWS = 100;
    const CELL = 6;

    const WHITE = [255, 255, 255];
    const BLACK = [24, 24, 32];
    const ANT_COLOR = "#e8483c";

    // 0 — вверх, 1 — вправо, 2 — вниз, 3 — влево
    const DIRS = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    const ARROWS = ["↑", "→", "↓", "←"];
    const NAMES = ["вверх", "вправо", "вниз", "влево"];

    const canvas = $("#ant-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    ctx.imageSmoothingEnabled = false;

    // Поле рисуется в offscreen-буфер 150×100 и растягивается на экран.
    const off = document.createElement("canvas");
    off.width = COLS;
    off.height = ROWS;
    const offCtx = off.getContext("2d");
    const frameData = offCtx.createImageData(COLS, ROWS);
    const pixels = frameData.data;
    pixels.fill(255);

    const grid = new Uint8Array(COLS * ROWS);

    const state = {
      x: COLS >> 1,
      y: ROWS >> 1,
      dir: 1,
      steps: 0,
      black: 0,
      running: false,
      speed: 50,
    };

    const runBtn = $("#ant-run");
    const stepBtn = $("#ant-step");
    const resetBtn = $("#ant-reset");
    const speedInput = $("#ant-speed");
    const speedOut = $("#ant-speed-out");
    const stepsOut = $("#ant-steps");
    const blackOut = $("#ant-black");
    const dirOut = $("#ant-dir");

    function paint(x, y, isBlack) {
      const index = (y * COLS + x) * 4;
      const color = isBlack ? BLACK : WHITE;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = 255;
    }

    function step() {
      const index = state.y * COLS + state.x;

      if (grid[index]) {
        state.dir = (state.dir + 3) & 3; // налево
        grid[index] = 0;
        state.black -= 1;
        paint(state.x, state.y, false);
      } else {
        state.dir = (state.dir + 1) & 3; // направо
        grid[index] = 1;
        state.black += 1;
        paint(state.x, state.y, true);
      }

      const delta = DIRS[state.dir];
      state.x = (state.x + delta[0] + COLS) % COLS;
      state.y = (state.y + delta[1] + ROWS) % ROWS;
      state.steps += 1;
    }

    function render() {
      offCtx.putImageData(frameData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, COLS * CELL, ROWS * CELL);

      const centerX = state.x * CELL + CELL / 2;
      const centerY = state.y * CELL + CELL / 2;
      const delta = DIRS[state.dir];

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.atan2(delta[1], delta[0]));
      ctx.beginPath();
      ctx.moveTo(CELL, 0);
      ctx.lineTo(-CELL * 0.6, CELL * 0.65);
      ctx.lineTo(-CELL * 0.6, -CELL * 0.65);
      ctx.closePath();
      ctx.fillStyle = ANT_COLOR;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.stroke();
      ctx.restore();
    }

    function updateStats() {
      stepsOut.textContent = VL.format(state.steps);
      blackOut.textContent = VL.format(state.black);
      dirOut.textContent = ARROWS[state.dir] + " " + NAMES[state.dir];
    }

    let rafId = null;
    let lastStats = 0;
    let active = false;
    let userPaused = false;

    function frame(now) {
      if (!state.running || !active) {
        rafId = null;
        return;
      }

      const count = state.speed | 0;
      for (let i = 0; i < count; i += 1) step();

      render();

      if (now - lastStats > 120) {
        updateStats();
        lastStats = now;
      }

      rafId = window.requestAnimationFrame(frame);
    }

    function setRunning(value) {
      state.running = value;
      runBtn.textContent = value ? "Пауза" : "Старт";
      runBtn.classList.toggle("is-running", value);
      runBtn.setAttribute("aria-pressed", String(value));

      if (value && active && rafId === null) {
        lastStats = performance.now();
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function toggle() {
      userPaused = state.running;
      setRunning(!state.running);
    }

    function singleStep() {
      userPaused = true;
      setRunning(false);
      step();
      render();
      updateStats();
    }

    function reset() {
      userPaused = false;
      setRunning(false);
      grid.fill(0);
      pixels.fill(255);
      state.x = COLS >> 1;
      state.y = ROWS >> 1;
      state.dir = 1;
      state.steps = 0;
      state.black = 0;
      render();
      updateStats();
    }

    runBtn.addEventListener("click", toggle);
    stepBtn.addEventListener("click", singleStep);
    resetBtn.addEventListener("click", reset);

    speedInput.addEventListener("input", function () {
      state.speed = Number(speedInput.value) || 1;
      speedOut.textContent = String(state.speed);
    });

    document.addEventListener("keydown", function (event) {
      if (!active) return;
      const tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.code === "Space") {
        event.preventDefault();
        toggle();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        singleStep();
      } else if (
        event.key === "r" ||
        event.key === "R" ||
        event.key === "к" ||
        event.key === "К"
      ) {
        reset();
      }
    });

    render();
    updateStats();

    return {
      start: function () {
        active = true;
        if (!userPaused && !state.running) {
          setRunning(true);
        } else if (state.running && rafId === null) {
          lastStats = performance.now();
          rafId = window.requestAnimationFrame(frame);
        }
      },
      pause: function () {
        active = false;
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        rafId = null;
      },
    };
  };
})();
