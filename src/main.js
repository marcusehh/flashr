import "./style.css";
import { parseCards } from "./parse.js";

const app = document.querySelector("#app");
const backBtn = document.querySelector("#backbtn");

const state = {
  deckName: "",
  cards: [],
  html: false,
  order: [],
  pos: 0,
  showBack: false,
  mode: "sequential", // or "random"
  loaderError: "",
};

// ---------- Navigation ----------
// A stack of previously-visited screens. The constant back button pops it.
const history = [];
let current = "loader";

const screens = {
  loader: renderLoader,
  setup: renderSetup,
  study: renderStudy,
  done: renderDone,
};

// Navigate to a new screen, remembering the current one so Back can return.
// Pass { replace: true } to swap the current screen without adding a step.
function go(screen, { replace = false } = {}) {
  if (!replace && screen !== current) history.push(current);
  current = screen;
  render();
}

function back() {
  if (!history.length) return;
  current = history.pop();
  render();
}

// Re-render the current screen in place (no history change).
function render() {
  screens[current]();
  backBtn.classList.toggle("hidden", history.length === 0);
}

backBtn.addEventListener("click", back);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOrder() {
  const seq = state.cards.map((_, i) => i);
  state.order = state.mode === "random" ? shuffle(seq) : seq;
  state.pos = 0;
  state.showBack = false;
}

function typesetMath() {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([app]).catch(() => {});
  }
}

// ---------- Loader screen ----------
function renderLoader() {
  const error = state.loaderError;
  state.loaderError = "";
  app.innerHTML = `
    <div class="wrap">
      <h1>flashr</h1>
      <p class="sub">A minimal flashcard studier. Pick a deck to begin.</p>

      <h2 class="section">Library</h2>
      <div id="library"><p class="hint">Loading decks…</p></div>
      ${error ? `<p class="sub" style="margin-top:16px;color:#000"><strong>${error}</strong></p>` : ""}
    </div>
  `;

  loadLibrary();
}

function loaderError(msg) {
  state.loaderError = msg;
  go("loader");
}

// Load the unit/chapter list from /public/decks.json and render the library.
async function loadLibrary() {
  const box = document.querySelector("#library");
  if (!box) return;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}decks.json`);
    if (!res.ok) throw new Error();
    const units = await res.json();
    if (!Array.isArray(units) || !units.length) {
      box.innerHTML = `<p class="hint">No decks in the library yet.</p>`;
      return;
    }

    box.innerHTML = units
      .map((unit, ui) => {
        const chapters = unit.chapters || [];
        const chapterBtns = chapters
          .map(
            (ch, ci) =>
              `<button class="deck-item" data-unit="${ui}" data-chapter="${ci}">
                 <span class="deck-name">${escapeHtml(ch.name || ch.file)}</span>
                 <span class="deck-count" data-count="${ui}-${ci}">…</span>
               </button>`
          )
          .join("");
        return `
          <div class="unit">
            <div class="unit-head">
              <span class="unit-name">${escapeHtml(unit.name)}</span>
              <button class="unit-all" data-unit="${ui}">Study entire unit</button>
            </div>
            <div class="deck-list">${chapterBtns}</div>
          </div>`;
      })
      .join("");

    countCards(units);

    box.querySelectorAll(".deck-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const unit = units[Number(btn.dataset.unit)];
        const ch = unit.chapters[Number(btn.dataset.chapter)];
        loadDeck([ch.file], ch.name);
      });
    });
    box.querySelectorAll(".unit-all").forEach((btn) => {
      btn.addEventListener("click", () => {
        const unit = units[Number(btn.dataset.unit)];
        loadDeck(
          unit.chapters.map((c) => c.file),
          unit.name
        );
      });
    });
  } catch {
    box.innerHTML = `<p class="hint">Could not load the deck library.</p>`;
  }
}

// Asynchronously fetch each chapter file, count its cards, and fill in the
// per-chapter and per-unit totals once known.
async function countCards(units) {
  for (let ui = 0; ui < units.length; ui++) {
    const chapters = units[ui].chapters || [];
    let unitTotal = 0;
    await Promise.all(
      chapters.map(async (ch, ci) => {
        let n = 0;
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}${encodeURI(ch.file)}`);
          if (res.ok) n = parseCards(await res.text()).cards.length;
        } catch {
          n = -1;
        }
        unitTotal += Math.max(0, n);
        const el = document.querySelector(`[data-count="${ui}-${ci}"]`);
        if (el) el.textContent = n < 0 ? "—" : `${n}`;
      })
    );
    const unitBtn = document.querySelector(`.unit-all[data-unit="${ui}"]`);
    if (unitBtn) unitBtn.textContent = `Study entire unit (${unitTotal})`;
  }
}

// Fetch one or more stored deck files, merge their cards, and start setup.
async function loadDeck(files, name) {
  try {
    const texts = await Promise.all(
      files.map(async (f) => {
        const res = await fetch(`${import.meta.env.BASE_URL}${encodeURI(f)}`);
        if (!res.ok) throw new Error();
        return res.text();
      })
    );
    let cards = [];
    let html = false;
    for (const text of texts) {
      const parsed = parseCards(text);
      cards = cards.concat(parsed.cards);
      html = html || parsed.html;
    }
    if (!cards.length) {
      loaderError("That deck contained no cards.");
      return;
    }
    state.deckName = name;
    state.cards = cards;
    state.html = html;
    go("setup");
  } catch {
    loaderError("Could not load that deck.");
  }
}

// ---------- Setup screen (choose order) ----------
function renderSetup() {
  app.innerHTML = `
    <div class="wrap">
      <h1>${escapeHtml(state.deckName)}</h1>
      <p class="sub">${state.cards.length} card${state.cards.length === 1 ? "" : "s"} loaded.</p>

      <div class="options">
        <span>Order:</span>
        <div class="seg" id="seg">
          <button data-mode="sequential" class="${state.mode === "sequential" ? "active" : ""}">Sequential</button>
          <button data-mode="random" class="${state.mode === "random" ? "active" : ""}">Random</button>
        </div>
      </div>

      <div class="controls" style="margin-top:32px">
        <button id="start" class="primary">Start studying</button>
      </div>
    </div>
  `;

  document.querySelectorAll("#seg button").forEach((b) => {
    b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      render();
    });
  });
  document.querySelector("#start").addEventListener("click", () => {
    buildOrder();
    go("study");
  });
}

// ---------- Study screen ----------
function renderStudy() {
  const card = state.cards[state.order[state.pos]];
  const pct = ((state.pos + (state.showBack ? 1 : 0)) / state.order.length) * 100;

  app.innerHTML = `
    <div class="wrap">
      <div class="topbar">
        <span></span>
        <span>${state.pos + 1} / ${state.order.length} &middot; ${state.mode}</span>
      </div>
      <div class="progress"><div style="width:${pct}%"></div></div>

      <div class="card" id="card">
        <div class="side front">${field(card.front)}</div>
        ${
          state.showBack
            ? `<div class="divider"></div><div class="side back">${field(card.back)}</div>`
            : `<div class="flip-hint">Click card or press Space to reveal</div>`
        }
        ${
          state.showBack && card.tags
            ? `<div class="tags">${escapeHtml(card.tags)}</div>`
            : ""
        }
      </div>

      <div class="controls">
        <button id="prev" ${state.pos === 0 ? "disabled" : ""}>&larr; Prev</button>
        ${
          state.showBack
            ? `<button id="next" class="primary">${state.pos === state.order.length - 1 ? "Finish" : "Next →"}</button>`
            : `<button id="flip" class="primary">Show answer</button>`
        }
      </div>
      <p class="kbd"><span>Space</span> flip <span>&rarr;</span> next <span>&larr;</span> prev <span>R</span> restart</p>
    </div>
  `;

  document.querySelector("#card").addEventListener("click", flip);
  document.querySelector("#prev").addEventListener("click", prev);
  const flipBtn = document.querySelector("#flip");
  if (flipBtn) flipBtn.addEventListener("click", flip);
  const nextBtn = document.querySelector("#next");
  if (nextBtn) nextBtn.addEventListener("click", next);

  typesetMath();
}

function renderDone() {
  app.innerHTML = `
    <div class="wrap">
      <div class="done">
        <h2>Deck complete</h2>
        <p class="sub">You studied ${state.order.length} card${state.order.length === 1 ? "" : "s"}.</p>
        <div class="controls" style="justify-content:center;margin-top:24px">
          <button id="restart" class="primary">Study again</button>
        </div>
      </div>
    </div>
  `;
  document.querySelector("#restart").addEventListener("click", () => {
    buildOrder();
    go("study", { replace: true });
  });
}

// ---------- Actions ----------
function flip() {
  state.showBack = !state.showBack;
  render();
}
function next() {
  if (state.pos === state.order.length - 1) {
    // Replace study with done so Back returns to setup, not a finished deck.
    go("done", { replace: true });
    return;
  }
  state.pos++;
  state.showBack = false;
  render();
}
function prev() {
  if (state.pos === 0) return;
  state.pos--;
  state.showBack = false;
  render();
}

document.addEventListener("keydown", (e) => {
  if (current !== "study") return;
  if (e.key === " ") {
    e.preventDefault();
    flip();
  } else if (e.key === "ArrowRight") {
    if (state.showBack) next();
    else flip();
  } else if (e.key === "ArrowLeft") {
    prev();
  } else if (e.key.toLowerCase() === "r") {
    buildOrder();
    render();
  }
});

// ---------- Helpers ----------
function field(value) {
  // html:true decks contain markup we want to render; otherwise escape it.
  return state.html ? value : escapeHtml(value);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

render();
