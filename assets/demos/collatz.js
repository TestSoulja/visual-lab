/* 03 · Гипотеза Коллатца — график последовательности 3n + 1. */

(function () {
  "use strict";

  window.VisualLab = window.VisualLab || {};
  const VL = window.VisualLab;
  VL.demos = VL.demos || {};

  VL.demos.collatz = function (root) {
    const $ = function (selector) {
      return root.querySelector(selector);
    };

    const form = $("#collatz-form");
    const input = $("#collatz-input");
    const canvas = $("#collatz-canvas");
    const logInput = $("#collatz-log");
    const stepsOut = $("#collatz-steps");
    const maxOut = $("#collatz-max");
    const lenOut = $("#collatz-len");
    const peakOut = $("#collatz-peak");
    const seqOut = $("#collatz-seq");
    const randomBtn = $("#collatz-random");

    const MAX_START = 100000000;
    const GUARD = 1000000;

    let sequence = [];
    let peakIndex = 0;
    let peakValue = 0;
    let reveal = 1;
    let rafId = null;
    let active = false;

    function compute(start) {
      let value = Math.floor(start);
      if (!Number.isFinite(value) || value < 1) value = 1;
      value = Math.min(value, MAX_START);

      const result = [value];
      peakIndex = 0;
      peakValue = value;

      while (value > 1 && result.length < GUARD) {
        value = value % 2 === 0 ? value / 2 : value * 3 + 1;
        result.push(value);
        if (value > peakValue) {
          peakValue = value;
          peakIndex = result.length - 1;
        }
      }
      return result;
    }

    function compact(number) {
      const value = Number(number);
      if (value >= 1e9) return (value / 1e9).toFixed(value >= 1e10 ? 0 : 1) + " млрд";
      if (value >= 1e6) return (value / 1e6).toFixed(value >= 1e7 ? 0 : 1) + " млн";
      if (value >= 1e3) return (value / 1e3).toFixed(value >= 1e4 ? 0 : 1) + " тыс.";
      return String(value);
    }

    function renderChips() {
      seqOut.textContent = "";
      if (!sequence.length) return;

      const shown = sequence.slice(0, 12);
      shown.forEach(function (value) {
        const chip = document.createElement("span");
        chip.textContent = String(value);
        seqOut.appendChild(chip);
      });

      if (sequence.length > shown.length) {
        const chip = document.createElement("span");
        chip.textContent = "… " + sequence.length;
        seqOut.appendChild(chip);
      }
    }

    function draw() {
      const info = VL.fitCanvas(canvas);
      const ctx = info.ctx;
      const width = info.width;
      const height = info.height;
      if (width < 4 || height < 4 || sequence.length < 2) return;

      ctx.clearRect(0, 0, width, height);

      const padLeft = 56;
      const padRight = 26;
      const padTop = 24;
      const padBottom = 34;
      const plotWidth = width - padLeft - padRight;
      const plotHeight = height - padTop - padBottom;

      const logScale = logInput.checked;
      const toY = function (value) {
        return logScale ? Math.log10(value) : value;
      };

      const maxValue = peakValue || 1;
      const yTop = toY(maxValue) * 1.06;
      const points = Math.max(2, Math.round(sequence.length * reveal));

      const xFor = function (index) {
        return padLeft + (plotWidth * index) / Math.max(1, sequence.length - 1);
      };
      const yFor = function (value) {
        return padTop + plotHeight * (1 - toY(value) / yTop);
      };

      // Сетка
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.fillStyle = "rgba(152, 163, 192, 0.85)";
      ctx.lineWidth = 1;
      ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const gridLines = 4;
      for (let i = 0; i <= gridLines; i += 1) {
        const ratio = i / gridLines;
        const y = padTop + plotHeight * ratio;
        const value = yTop * (1 - ratio);
        const raw = logScale ? Math.pow(10, value) : value;

        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();
        ctx.fillText(compact(raw), padLeft - 8, y);
      }

      // Ось X
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("шаг 0", padLeft, height - padBottom + 10);
      ctx.fillText(
        "шаг " + VL.format(sequence.length - 1),
        width - padRight,
        height - padBottom + 10
      );

      // Градиент линии
      const lineGradient = ctx.createLinearGradient(padLeft, padTop, width - padRight, height - padBottom);
      lineGradient.addColorStop(0, "#ff6b5e");
      lineGradient.addColorStop(0.55, "#ffa25c");
      lineGradient.addColorStop(1, "#b58cff");

      // Площадь под графиком
      ctx.beginPath();
      ctx.moveTo(xFor(0), padTop + plotHeight);
      for (let i = 0; i < points; i += 1) {
        ctx.lineTo(xFor(i), yFor(sequence[i]));
      }
      ctx.lineTo(xFor(points - 1), padTop + plotHeight);
      ctx.closePath();
      const areaGradient = ctx.createLinearGradient(0, padTop, 0, padTop + plotHeight);
      areaGradient.addColorStop(0, "rgba(255, 107, 94, 0.22)");
      areaGradient.addColorStop(1, "rgba(181, 140, 255, 0.02)");
      ctx.fillStyle = areaGradient;
      ctx.fill();

      // Линия
      ctx.beginPath();
      for (let i = 0; i < points; i += 1) {
        const x = xFor(i);
        const y = yFor(sequence[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Точки для коротких последовательностей
      if (sequence.length <= 220 && reveal >= 1) {
        ctx.fillStyle = "#ffd6b0";
        for (let i = 0; i < points; i += 1) {
          ctx.beginPath();
          ctx.arc(xFor(i), yFor(sequence[i]), 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Пик
      if (peakIndex < points) {
        const px = xFor(peakIndex);
        const py = yFor(peakValue);
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = "rgba(255, 162, 92, 0.45)";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, padTop + plotHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffa25c";
        ctx.fill();

        ctx.fillStyle = "#ffd6b0";
        ctx.font = "12px 'Segoe UI', system-ui, sans-serif";
        ctx.textAlign = px > width - 120 ? "right" : "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("пик " + VL.format(peakValue), px + (px > width - 120 ? -7 : 7), py - 6);
      }
    }

    function animate() {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (VL.reducedMotion || !active) {
        reveal = 1;
        draw();
        return;
      }

      const started = performance.now();
      const duration = 650;

      function frame(now) {
        const progress = VL.clamp((now - started) / duration, 0, 1);
        reveal = 1 - Math.pow(1 - progress, 3);
        draw();
        if (progress < 1) rafId = window.requestAnimationFrame(frame);
        else rafId = null;
      }

      rafId = window.requestAnimationFrame(frame);
    }

    function update(start, shouldAnimate) {
      sequence = compute(start);
      reveal = shouldAnimate ? 0 : 1;

      stepsOut.textContent = VL.format(sequence.length - 1);
      maxOut.textContent = VL.format(peakValue);
      lenOut.textContent = VL.format(sequence.length);
      peakOut.textContent = VL.format(peakIndex);

      renderChips();

      if (shouldAnimate) animate();
      else draw();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      update(Number(input.value) || 1, true);
    });

    logInput.addEventListener("change", draw);

    VL.$$("[data-collatz]", root).forEach(function (button) {
      button.addEventListener("click", function () {
        input.value = button.dataset.collatz;
        update(Number(button.dataset.collatz), true);
      });
    });

    randomBtn.addEventListener("click", function () {
      const value = 2 + Math.floor(Math.random() * 99998);
      input.value = String(value);
      update(value, true);
    });

    VL.observeResize(canvas.parentElement, draw);

    update(27, false);

    return {
      start: function () {
        active = true;
        if (rafId === null && reveal < 1) animate();
      },
      pause: function () {
        active = false;
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        rafId = null;
      },
    };
  };
})();
