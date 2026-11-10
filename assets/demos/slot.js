/* 05 · Симулятор слота — правила 1:1 из 4_Slot.py. */

(function () {
  "use strict";

  window.VisualLab = window.VisualLab || {};
  const VL = window.VisualLab;
  VL.demos = VL.demos || {};

  VL.demos.slot = function (root) {
    const $ = function (selector) {
      return root.querySelector(selector);
    };

    const START_BALANCE = 10000;
    const BET = 1000;
    const SYMBOLS = ["0", "1", "2", "3", "4", "5"];
    const PAYOUTS = {
      "000": 6000,
      "555": 5000,
      "444": 3000,
      "333": 2000,
      "222": 1500,
      "111": 500,
    };
    const HISTORY_LIMIT = 8;
    const SPIN_STEP = 55;
    const REEL_STAGGER = 280;
    const BASE_DURATION = 620;

    const reels = [
      { element: $("#slot-reel-0"), value: "0" },
      { element: $("#slot-reel-1"), value: "0" },
      { element: $("#slot-reel-2"), value: "0" },
    ];

    const spinBtn = $("#slot-spin");
    const resetBtn = $("#slot-reset");
    const balanceOut = $("#slot-balance");
    const messageOut = $("#slot-message");
    const spinsOut = $("#slot-spins");
    const bestOut = $("#slot-best");
    const historyOut = $("#slot-history");

    const state = {
      balance: START_BALANCE,
      spins: 0,
      best: 0,
      spinning: false,
    };

    let spinTimer = null;

    function money(value) {
      return VL.format(value) + " $";
    }

    function updateBalance() {
      balanceOut.textContent = money(state.balance);
      balanceOut.style.color =
        state.balance <= 0 ? "var(--accent)" : state.balance < BET ? "var(--accent-strong)" : "var(--green)";
    }

    function updateControls() {
      spinBtn.disabled = state.spinning || state.balance < BET;
      spinBtn.textContent = state.balance < BET ? "Недостаточно средств" : "Крутить −1 000 $";
      resetBtn.disabled = state.spinning;
      updateBalance();
    }

    function setMessage(text, tone) {
      messageOut.textContent = text;
      messageOut.classList.toggle("is-win", tone === "win");
      messageOut.classList.toggle("is-loss", tone === "loss");
    }

    function clearWin() {
      reels.forEach(function (reel) {
        reel.element.classList.remove("is-win");
      });
    }

    function payoutFor(values) {
      return PAYOUTS[values.join("")] || 0;
    }

    function addHistory(values, payout) {
      const item = document.createElement("li");

      const combo = document.createElement("span");
      combo.textContent = values.join(" ");

      const result = document.createElement("b");
      result.textContent = payout > 0 ? "+" + money(payout) : "0 $";
      if (payout > 0) result.style.color = "var(--green)";

      item.appendChild(combo);
      item.appendChild(result);
      historyOut.prepend(item);

      while (historyOut.children.length > HISTORY_LIMIT) {
        historyOut.removeChild(historyOut.lastElementChild);
      }
    }

    function finishSpin(values) {
      state.spinning = false;

      let payout = 0;
      reels.forEach(function (reel, index) {
        reel.value = values[index];
        reel.element.textContent = reel.value;
        reel.element.classList.remove("is-spinning");
      });

      payout = payoutFor(values);
      state.balance += payout;
      state.spins += 1;
      if (payout > state.best) state.best = payout;

      spinsOut.textContent = VL.format(state.spins);
      bestOut.textContent = money(state.best);

      addHistory(values, payout);

      if (payout > 0) {
        reels.forEach(function (reel) {
          reel.element.classList.add("is-win");
        });
        setMessage("Три " + values[0] + " → +" + money(payout), "win");
      } else {
        const hasPair =
          values[0] === values[1] || values[1] === values[2] || values[0] === values[2];
        setMessage(
          hasPair ? "Пара — но выплата только за три одинаковых" : "Без выигрыша · −1 000 $",
          "loss"
        );
      }

      updateControls();

      if (state.balance < BET) {
        setMessage(
          state.balance <= 0
            ? "Баланс закончился. Нажмите «Сброс»."
            : "Не хватает на ставку. Нажмите «Сброс».",
          "loss"
        );
      }
    }

    function spin() {
      if (state.spinning || state.balance < BET) return;

      state.spinning = true;
      state.balance -= BET;
      updateControls();
      clearWin();
      setMessage("Барабаны крутятся…", "");

      reels.forEach(function (reel) {
        reel.element.classList.add("is-spinning");
        reel.element.setAttribute("aria-busy", "true");
      });

      const values = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ];

      const started = performance.now();
      const totalDuration = BASE_DURATION + REEL_STAGGER * 2;

      if (spinTimer !== null) window.clearInterval(spinTimer);
      spinTimer = window.setInterval(function () {
        const elapsed = performance.now() - started;

        reels.forEach(function (reel, index) {
          if (elapsed >= BASE_DURATION + REEL_STAGGER * index) {
            reel.element.textContent = values[index];
          } else {
            reel.element.textContent =
              SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          }
        });

        if (elapsed >= totalDuration + SPIN_STEP) {
          window.clearInterval(spinTimer);
          spinTimer = null;
          reels.forEach(function (reel) {
            reel.element.removeAttribute("aria-busy");
          });
          finishSpin(values);
        }
      }, SPIN_STEP);
    }

    function reset() {
      if (state.spinning) return;

      if (spinTimer !== null) {
        window.clearInterval(spinTimer);
        spinTimer = null;
      }

      state.balance = START_BALANCE;
      state.spins = 0;
      state.best = 0;

      reels.forEach(function (reel) {
        reel.value = "0";
        reel.element.textContent = "0";
        reel.element.classList.remove("is-spinning", "is-win");
        reel.element.removeAttribute("aria-busy");
      });

      historyOut.textContent = "";
      spinsOut.textContent = "0";
      bestOut.textContent = money(0);
      setMessage("Нажмите «Крутить»", "");
      updateControls();
    }

    spinBtn.addEventListener("click", spin);
    resetBtn.addEventListener("click", reset);

    // Пробел крутит барабаны, когда секция в фокусе и фокус не в поле ввода.
    root.addEventListener("keydown", function (event) {
      if (event.code !== "Space") return;
      const tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const active = document.activeElement;
      if (active && root.contains(active) && active !== document.body) {
        event.preventDefault();
        spin();
      }
    });

    updateControls();
    setMessage("Нажмите «Крутить»", "");

    return {
      start: function () {},
      pause: function () {},
    };
  };
})();
