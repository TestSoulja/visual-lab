/* Visual Lab — общая обвязка: реестр демо, ленивый запуск, навигация. */

(function () {
  "use strict";

  const VL = (window.VisualLab = window.VisualLab || {});

  VL.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  VL.$ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  VL.$$ = function (selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  };

  VL.clamp = function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  };

  VL.format = function (value) {
    return Number(value).toLocaleString("ru-RU");
  };

  /** Подгоняет размер canvas под CSS-размер с учётом devicePixelRatio. */
  VL.fitCanvas = function (canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== Math.round(height * dpr)
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, width: width, height: height, dpr: dpr };
  };

  /** Вызывает callback при изменении размера элемента (с дебаунсом). */
  VL.observeResize = function (element, callback) {
    let frame = 0;
    const schedule = function () {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        callback();
      });
    };

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(schedule);
      observer.observe(element);
      return function () {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", schedule, { passive: true });
    return function () {
      window.removeEventListener("resize", schedule);
    };
  };

  VL.demos = VL.demos || {};

  function boot() {
    const sections = VL.$$("[data-demo]");
    const controllers = new Map();
    const navLinks = new Map();

    VL.$$(".nav a").forEach(function (link) {
      navLinks.set(link.getAttribute("href").slice(1), link);
    });

    function controllerFor(section) {
      const name = section.dataset.demo;
      if (controllers.has(name)) return controllers.get(name);
      const factory = VL.demos[name];
      if (typeof factory !== "function") return null;
      const controller = factory(section, VL) || {};
      controllers.set(name, controller);
      return controller;
    }

    function activate(section) {
      const controller = controllerFor(section);
      if (controller && typeof controller.start === "function") controller.start();
    }

    function deactivate(section) {
      const controller = controllers.get(section.dataset.demo);
      if (controller && typeof controller.pause === "function") controller.pause();
    }

    if (typeof IntersectionObserver === "function") {
      const demoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) activate(entry.target);
            else deactivate(entry.target);
          });
        },
        { threshold: 0.12 }
      );
      sections.forEach(function (section) {
        demoObserver.observe(section);
      });
    } else {
      sections.forEach(activate);
    }

    function updateActiveNav() {
      const offset = 140;
      let current = null;

      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= offset) current = section.id;
      });

      if (window.scrollY < 12) current = null;

      navLinks.forEach(function (link, id) {
        link.classList.toggle("is-active", id === current);
      });
    }

    let navFrame = 0;
    function scheduleNav() {
      if (navFrame) return;
      navFrame = window.requestAnimationFrame(function () {
        navFrame = 0;
        updateActiveNav();
      });
    }

    window.addEventListener("scroll", scheduleNav, { passive: true });
    window.addEventListener("resize", scheduleNav, { passive: true });
    updateActiveNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
