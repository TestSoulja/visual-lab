/* 04 · Фрактальная черепаха — точный перенос алгоритма turtle на Canvas. */

(function () {
  "use strict";

  window.VisualLab = window.VisualLab || {};
  const VL = window.VisualLab;
  VL.demos = VL.demos || {};

  VL.demos.turtle = function (root) {
    const $ = function (selector) {
      return root.querySelector(selector);
    };

    const canvas = $("#turtle-canvas");
    const playBtn = $("#turtle-play");
    const resetBtn = $("#turtle-reset");
    const speedInput = $("#turtle-speed");
    const speedOut = $("#turtle-speed-out");
    const progressOut = $("#turtle-progress");
    const iterOut = $("#turtle-iter");
    const angleOut = $("#turtle-angle");

    const PAD = 26;
    const TOTAL = 1001; // 1 стартовый отрезок + 1000 итераций цикла

    const segments = [];
    let bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    /**
     * Точный повтор 3_Turtle.py:
     *   forward(n/2), right(90)
     *   1000 раз: forward(n), right(n), n += 1 пока i < 250, иначе n -= 1
     */
    (function build() {
      const rad = function (degrees) {
        return (degrees * Math.PI) / 180;
      };

      let x = 0;
      let y = 0;
      let heading = 0; // 0° — вправо, отрицательные значения — поворот направо
      let minX = 0;
      let minY = 0;
      let maxX = 0;
      let maxY = 0;

      function forward(length, turn, iteration) {
        const nextX = x + Math.cos(rad(heading)) * length;
        const nextY = y + Math.sin(rad(heading)) * length;

        segments.push({
          x1: x,
          y1: y,
          x2: nextX,
          y2: nextY,
          turn: turn,
          heading: heading,
          iteration: iteration,
        });

        x = nextX;
        y = nextY;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      forward(0.5, 90, -1);
      heading -= 90;

      let n = 1;
      for (let i = 0; i < 1000; i += 1) {
        forward(n, n, i);
        heading -= n;
        if (i < 250) n += 1;
        else n -= 1;
      }

      bounds = { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    })();

    const state = {
      drawn: 0,
      speed: Number(speedInput.value) || 6,
      running: false,
      done: false,
      active: false,
      userPaused: false,
    };

    let view = null;
    let rafId = null;

    function setupView(info) {
      const spanX = Math.max(1, bounds.maxX - bounds.minX);
      const spanY = Math.max(1, bounds.maxY - bounds.minY);
      const scale = Math.min(
        (info.width - PAD * 2) / spanX,
        (info.height - PAD * 2) / spanY
      );

      view = {
        scale: scale,
        cx: (bounds.minX + bounds.maxX) / 2,
        cy: (bounds.minY + bounds.maxY) / 2,
        width: info.width,
        height: info.height,
      };
    }

    function screenX(x) {
      return view.width / 2 + (x - view.cx) * view.scale;
    }

    function screenY(y) {
      return view.height / 2 - (y - view.cy) * view.scale;
    }

    function segmentColor(index) {
      const t = index / Math.max(1, TOTAL - 1);
      const hue = Math.round(10 + 300 * t);
      const lightness = Math.round(58 + 8 * Math.sin(t * Math.PI * 6));
      return "hsl(" + hue + ", 82%, " + lightness + "%)";
    }

    function drawSegment(ctx, index) {
      const segment = segments[index];
      if (!segment) return;

      ctx.strokeStyle = segmentColor(index);
      ctx.lineWidth = index < 300 ? 1.15 : 1.35;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(screenX(segment.x1), screenY(segment.y1));
      ctx.lineTo(screenX(segment.x2), screenY(segment.y2));
      ctx.stroke();
    }

    function drawRange(ctx, from, to) {
      for (let i = from; i < to; i += 1) drawSegment(ctx, i);
    }

    function redraw() {
      const info = VL.fitCanvas(canvas);
      if (info.width < 4 || info.height < 4) return;
      setupView(info);
      info.ctx.clearRect(0, 0, info.width, info.height);
      drawRange(info.ctx, 0, state.drawn);
    }

    function updateStats() {
      const drawn = Math.min(state.drawn, TOTAL);
      progressOut.textContent = VL.format(drawn) + " / " + VL.format(TOTAL);

      if (drawn === 0) {
        iterOut.textContent = "—";
        angleOut.textContent = "—";
        return;
      }

      const last = segments[drawn - 1];
      iterOut.textContent = last.iteration < 0 ? "старт" : VL.format(last.iteration + 1);
      angleOut.textContent = Math.round(((last.heading % 360) + 360) % 360) + "°";
    }

    function stopLoop() {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    function finish() {
      state.running = false;
      state.done = true;
      stopLoop();
      playBtn.textContent = "Повторить";
      playBtn.classList.remove("is-running");
    }

    function frame() {
      rafId = null;
      if (!state.running || !state.active) return;

      const info = VL.fitCanvas(canvas);
      setupView(info);

      const target = Math.min(TOTAL, state.drawn + state.speed);
      drawRange(info.ctx, state.drawn, target);
      state.drawn = target;
      updateStats();

      if (state.drawn >= TOTAL) finish();
      else rafId = window.requestAnimationFrame(frame);
    }

    function startLoop() {
      if (state.active && state.running && rafId === null) {
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function play() {
      if (state.done) {
        state.drawn = 0;
        state.done = false;
        state.userPaused = false;
        redraw();
        updateStats();
      }

      if (VL.reducedMotion) {
        state.drawn = TOTAL;
        redraw();
        updateStats();
        finish();
        return;
      }

      state.running = true;
      playBtn.textContent = "Пауза";
      playBtn.classList.add("is-running");
      startLoop();
    }

    function pause() {
      state.running = false;
      stopLoop();
      playBtn.textContent = state.done ? "Повторить" : "Старт";
      playBtn.classList.remove("is-running");
    }

    function toggle() {
      if (state.running) {
        state.userPaused = true;
        pause();
      } else {
        play();
      }
    }

    function reset() {
      stopLoop();
      state.drawn = 0;
      state.done = false;
      state.running = false;
      state.userPaused = false;
      playBtn.textContent = "Старт";
      playBtn.classList.remove("is-running");
      redraw();
      updateStats();
      play();
    }

    playBtn.addEventListener("click", toggle);
    resetBtn.addEventListener("click", reset);

    speedInput.addEventListener("input", function () {
      state.speed = Number(speedInput.value) || 1;
      speedOut.textContent = String(state.speed);
    });

    VL.observeResize(canvas.parentElement, redraw);

    redraw();
    updateStats();

    return {
      start: function () {
        state.active = true;

        if (VL.reducedMotion) {
          if (!state.done) {
            stopLoop();
            state.drawn = TOTAL;
            state.running = false;
            redraw();
            updateStats();
            finish();
          }
          return;
        }

        if (state.done || state.userPaused) return;
        if (!state.running) {
          state.running = true;
          playBtn.textContent = "Пауза";
          playBtn.classList.add("is-running");
        }
        startLoop();
      },
      pause: function () {
        state.active = false;
        stopLoop();
      },
    };
  };
})();
