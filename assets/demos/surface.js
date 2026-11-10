/* 02 · Поверхность z = sin(√(x² + y²)) — программный 3D-рендер на Canvas 2D. */

(function () {
  "use strict";

  window.VisualLab = window.VisualLab || {};
  const VL = window.VisualLab;
  VL.demos = VL.demos || {};

  VL.demos.surface = function (root) {
    const $ = function (selector) {
      return root.querySelector(selector);
    };

    const canvas = $("#surface-canvas");
    const autoInput = $("#surface-auto");
    const resInput = $("#surface-res");
    const resOut = $("#surface-res-out");
    const resOut2 = $("#surface-res-out-2");
    const facesOut = $("#surface-faces");
    const resetBtn = $("#surface-reset");

    const MIN = -10;
    const MAX = 10;
    const HOME = { yaw: -0.7, pitch: 0.95, zoom: 1 };

    const state = {
      yaw: HOME.yaw,
      pitch: HOME.pitch,
      zoom: HOME.zoom,
      auto: !VL.reducedMotion,
      res: Number(resInput.value) || 48,
      active: false,
      dragging: false,
    };

    autoInput.checked = state.auto;

    let info = VL.fitCanvas(canvas);
    let rafId = null;
    let dragFrom = { x: 0, y: 0 };

    let grid = null;

    const palette = [];
    (function buildPalette() {
      for (let i = 0; i < 128; i += 1) {
        const t = i / 127;
        const hue = Math.round(205 - 190 * t);
        const saturation = Math.round(70 + 12 * t);
        const lightness = Math.round(34 + 23 * t);
        palette.push("hsl(" + hue + ", " + saturation + "%, " + lightness + "%)");
      }
    })();

    function buildGrid(resolution) {
      const count = resolution * resolution;
      const quads = (resolution - 1) * (resolution - 1);

      grid = {
        resolution: resolution,
        screenX: new Float32Array(count),
        screenY: new Float32Array(count),
        heights: new Float32Array(count),
        depth: new Float32Array(count),
        quadDepth: new Float32Array(quads),
        order: new Int32Array(quads),
      };

      for (let i = 0; i < quads; i += 1) grid.order[i] = i;

      facesOut.textContent = VL.format(quads);
    }

    function render() {
      if (!info || info.width < 4 || info.height < 4) return;

      const ctx = info.ctx;
      const width = info.width;
      const height = info.height;
      const resolution = state.res;

      if (!grid || grid.resolution !== resolution) buildGrid(resolution);

      ctx.clearRect(0, 0, width, height);

      const step = (MAX - MIN) / (resolution - 1);
      // Запас под поворот: при yaw ≈ 45° проекция квадрата 20 × 20
      // расширяется примерно до 28.3 единиц по каждой оси.
      const scale = Math.min(width / 31, height / 20) * state.zoom;
      const centerX = width / 2;
      const centerY = height / 2 + height * 0.03;

      const cosYaw = Math.cos(state.yaw);
      const sinYaw = Math.sin(state.yaw);
      const cosPitch = Math.cos(state.pitch);
      const sinPitch = Math.sin(state.pitch);

      const screenX = grid.screenX;
      const screenY = grid.screenY;
      const heights = grid.heights;
      const depth = grid.depth;

      let index = 0;
      for (let row = 0; row < resolution; row += 1) {
        const y = MIN + row * step;
        for (let col = 0; col < resolution; col += 1) {
          const x = MIN + col * step;
          const z = Math.sin(Math.sqrt(x * x + y * y));

          const rotatedX = x * cosYaw - y * sinYaw;
          const rotatedY = x * sinYaw + y * cosYaw;
          const viewY = rotatedY * cosPitch - z * sinPitch;
          const viewZ = rotatedY * sinPitch + z * cosPitch;

          screenX[index] = centerX + rotatedX * scale;
          screenY[index] = centerY - viewZ * scale;
          depth[index] = viewY;
          heights[index] = z;
          index += 1;
        }
      }

      const quadDepth = grid.quadDepth;
      let quad = 0;
      for (let row = 0; row < resolution - 1; row += 1) {
        for (let col = 0; col < resolution - 1; col += 1) {
          const a = row * resolution + col;
          const b = a + 1;
          const c = a + resolution + 1;
          const d = a + resolution;
          quadDepth[quad] =
            (depth[a] + depth[b] + depth[c] + depth[d]) * 0.25;
          quad += 1;
        }
      }

      const order = grid.order;
      order.sort(function (left, right) {
        return quadDepth[right] - quadDepth[left];
      });

      const rowLength = resolution - 1;
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.7;

      for (let i = 0; i < order.length; i += 1) {
        const q = order[i];
        const row = (q / rowLength) | 0;
        const col = q % rowLength;
        const a = row * resolution + col;
        const b = a + 1;
        const c = a + resolution + 1;
        const d = a + resolution;

        const z = (heights[a] + heights[b] + heights[c] + heights[d]) * 0.25;
        const t = VL.clamp((z + 1) / 2, 0, 1);
        const color = palette[Math.round(t * 127)];

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(screenX[a], screenY[a]);
        ctx.lineTo(screenX[b], screenY[b]);
        ctx.lineTo(screenX[c], screenY[c]);
        ctx.lineTo(screenX[d], screenY[d]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    function tick(now) {
      rafId = null;
      if (!state.active || !state.auto || state.dragging) return;

      state.yaw += 0.0042;
      state.pitch = 0.95 + Math.sin(now * 0.00016) * 0.1;
      render();
      rafId = window.requestAnimationFrame(tick);
    }

    function startLoop() {
      if (rafId === null && state.active && state.auto) {
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function stopLoop() {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    function resetView() {
      state.yaw = HOME.yaw;
      state.pitch = HOME.pitch;
      state.zoom = HOME.zoom;
      render();
    }

    canvas.addEventListener("pointerdown", function (event) {
      state.dragging = true;
      dragFrom = { x: event.clientX, y: event.clientY };
      if (typeof canvas.setPointerCapture === "function") {
        canvas.setPointerCapture(event.pointerId);
      }
      canvas.style.cursor = "grabbing";
    });

    canvas.addEventListener("pointermove", function (event) {
      if (!state.dragging) return;

      const dx = event.clientX - dragFrom.x;
      const dy = event.clientY - dragFrom.y;
      dragFrom = { x: event.clientX, y: event.clientY };

      state.yaw += dx * 0.008;
      state.pitch = VL.clamp(state.pitch + dy * 0.006, 0.15, 1.45);
      render();
    });

    function endDrag() {
      if (!state.dragging) return;
      state.dragging = false;
      canvas.style.cursor = "grab";
      if (state.auto) startLoop();
    }

    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", endDrag);

    canvas.addEventListener(
      "wheel",
      function (event) {
        event.preventDefault();
        const factor = event.deltaY > 0 ? 0.92 : 1.08;
        state.zoom = VL.clamp(state.zoom * factor, 0.55, 2.4);
        render();
      },
      { passive: false }
    );

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";

    autoInput.addEventListener("change", function () {
      state.auto = autoInput.checked;
      state.pitch = HOME.pitch;
      if (state.auto) startLoop();
      else {
        stopLoop();
        render();
      }
    });

    resInput.addEventListener("input", function () {
      const value = Number(resInput.value) || 48;
      state.res = value;
      resOut.textContent = String(value);
      resOut2.textContent = String(value);
      buildGrid(value);
      render();
    });

    resetBtn.addEventListener("click", resetView);

    VL.observeResize(canvas.parentElement, function () {
      info = VL.fitCanvas(canvas);
      render();
    });

    buildGrid(state.res);
    render();

    return {
      start: function () {
        state.active = true;
        if (state.auto) startLoop();
        else render();
      },
      pause: function () {
        state.active = false;
        stopLoop();
      },
    };
  };
})();
