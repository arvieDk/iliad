/* The Iliad: an illustrated, interactive telling
 * The experience: the book cover, the map of the Troad, and the scene player.
 */

(function () {
  "use strict";

  const D = window.ILIAD;
  const A = D.art;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const SIDES = { achaean: "Achaean", trojan: "Trojan", olympian: "Olympian" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BLURBS = [
    "A quarrel over a captive splits the Achaean host.",
    "Paris and Menelaus fight for Helen while she watches from Troy.",
    "A last farewell at the Scaean Gates.",
    "Gifts and pleading cannot move Achilles.",
    "A friend goes to war in borrowed armor.",
    "Achilles mourns, and a god forges his shield.",
    "Three times around the walls of Troy.",
    "A king kneels before his son’s killer."
  ];
  // where each episode sits on the map of the Troad (600 x 720 grid)
  const MAP_AT = [[132, 232], [350, 400], [486, 470], [214, 184], [292, 318], [118, 300], [372, 498], [186, 262]];

  /* ================================================================ *
   * Text markup: [[Name]] opens a profile, {{key|text}} a glossary note
   * ================================================================ */
  function rich(html) {
    return html
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, a, b) => {
        const key = D.characters[a] ? a : D.aliases[a];
        const text = b || a;
        if (!key) return text;
        return `<button type="button" class="char char-${D.characters[key].side}" data-char="${key}">${text}</button>`;
      })
      .replace(/\{\{([^}|]+)\|([^}]+)\}\}/g, (m, key, text) =>
        D.glossary[key] ? `<button type="button" class="term" data-term="${key}">${text}</button>` : text);
  }
  function cite(ref) {
    return `<cite><span class="cite-ref">Iliad ${ref}</span> <span class="cite-src">${D.source.short}</span></cite>`;
  }

  /* ================================================================ *
   * Screens
   * ================================================================ */
  const screens = { intro: $("#intro"), hub: $("#hub"), scene: $("#scene") };
  let current = "intro";
  function show(name, withTurn = true) {
    if (name === current) return;
    const go = () => {
      Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
      current = name;
      document.body.dataset.screen = name;
      hidePopover();
      if (name === "hub") drawHubState();
    };
    if (withTurn && !reduceMotion) pageTurn(go);
    else go();
  }

  // a parchment leaf sweeps across the screen between views
  function pageTurn(mid) {
    const leaf = $("#turn");
    leaf.classList.remove("go");
    void leaf.offsetWidth;
    leaf.classList.add("go");
    sfx("flip");
    setTimeout(mid, 420);
    setTimeout(() => leaf.classList.remove("go"), 1000);
  }

  /* ================================================================ *
   * Intro: the book opens
   * ================================================================ */
  $("#openBook").addEventListener("click", () => {
    D.audio.unlock();
    const book = $(".intro-book");
    if (book.classList.contains("open")) return;
    book.classList.add("open");
    sfx("flip");
  });
  $("#enterTroy").addEventListener("click", () => show("hub"));

  /* ================================================================ *
   * Hub: the map of the Troad
   * ================================================================ */
  const done = new Set(loadDone());
  function loadDone() { try { return JSON.parse(localStorage.getItem("iliad-done") || "[]"); } catch (e) { return []; } }
  function saveDone() { try { localStorage.setItem("iliad-done", JSON.stringify([...done])); } catch (e) { /* storage unavailable */ } }

  function buildMap() {
    const svg = $("#map");
    // the map keeps its own pattern ids, apart from the scene's
    A.el("defs", { html: `<pattern id="mapWave" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 22 Q8 22 12 14 Q16 6 24 8 Q30 10 28 16 Q26 20 22 18 Q30 26 44 22 Q52 20 60 22" fill="none" class="m-wave-line"/></pattern>` }, svg);
    const g = A.g({}, svg);
    A.el("rect", { x: -300, y: -300, width: 1200, height: 1320, class: "m-sea" }, g);
    const waves = A.g({ class: "m-waves" }, g);
    for (let y = -40; y < 760; y += 34) A.el("rect", { x: -300, y, width: 1200, height: 30, fill: "url(#mapWave)", opacity: 0.35 }, waves);
    A.path("M1000 140 L600 150 C540 140 500 160 450 150 C400 140 360 150 320 160 C270 170 230 165 190 175 C150 185 120 200 92 218 C74 230 82 260 94 290 C106 330 98 380 88 420 C80 470 92 530 84 590 C80 640 90 690 96 720 C100 800 96 900 100 1120 L1000 1120 Z", { class: "m-land" }, g);
    A.path("M300 -400 L300 0 C330 20 380 30 430 28 C480 26 540 40 600 50 L1000 62 L1000 -400 Z", { class: "m-land far" }, g);
    A.path("M-400 -400 L210 -400 L210 0 C190 20 150 40 100 52 C60 60 20 80 0 96 L-400 130 Z", { class: "m-land far" }, g);
    A.path("M30 520 C40 500 70 498 78 512 C86 528 70 548 50 548 C34 548 24 534 30 520 Z", { class: "m-land" }, g);
    // Ida
    A.path("M450 700 L500 600 L540 650 L580 570 L640 700 Z", { class: "m-mount" }, g);
    // rivers
    A.path("M540 720 C500 640 430 600 380 560 C340 530 300 500 268 450 C240 400 250 360 236 310 C222 260 220 220 200 178", { class: "m-river" }, g);
    A.path("M600 330 C560 320 520 310 480 300 C420 286 360 300 300 330 C270 345 250 330 240 318", { class: "m-river" }, g);
    // ships along the shore
    for (let i = 0; i < 8; i++) A.ship(g, 120 + i * 30, 196 - i * 4, 0.08, 1, { mast: true });
    // tents
    for (let i = 0; i < 4; i++) A.tent(g, 112 + i * 34, 232 - i * 5, 0.13);
    // Troy
    const troy = A.g({ class: "m-troy" }, g);
    A.el("ellipse", { cx: 430, cy: 452, rx: 56, ry: 40, class: "m-hill" }, troy);
    A.walls(troy, 392, 470, 80, 30, { towers: [404, 460] });
    A.el("text", { x: 430, y: 548, "text-anchor": "middle", class: "m-label" }, troy).textContent = "ILION";
    A.el("text", { x: 345, y: 110, "text-anchor": "middle", class: "m-label sea" }, g).textContent = "HELLESPONT";
    A.el("text", { x: 36, y: 420, "text-anchor": "middle", class: "m-label sea", transform: "rotate(-90 36 420)" }, g).textContent = "AEGEAN SEA";
    A.el("text", { x: 540, y: 690, "text-anchor": "middle", class: "m-label" }, g).textContent = "IDA";
    A.el("text", { x: 52, y: 570, "text-anchor": "middle", class: "m-label small" }, g).textContent = "TENEDOS";
    // the route through the story
    A.path("M" + MAP_AT.map((p) => p.join(" ")).join(" L"), { class: "m-route" }, g);
    MAP_AT.forEach(([x, y], i) => {
      const outer = A.g({ class: "m-medal", transform: `translate(${x} ${y})`, tabindex: "0", role: "button", "data-episode": i, "aria-label": `Scroll ${ROMAN[i + 1]}: ${D.scenes[i].title}` }, g);
      const m = A.g({ class: "m-in" }, outer);
      A.el("circle", { r: 30, class: "m-halo" }, m);
      A.el("circle", { r: 21, class: "m-disc" }, m);
      A.el("circle", { r: 17, class: "m-ring" }, m);
      A.el("text", { y: 6, "text-anchor": "middle", class: "m-num" }, m).textContent = ROMAN[i + 1];
      const w = A.g({ class: "m-laurel" }, m);
      w.innerHTML = `<use href="#wreathSym" x="-34" y="-28" width="68" height="44"/>`;
    });
  }

  function drawHubState() {
    $$(".m-medal").forEach((m) => {
      const i = +m.dataset.episode;
      m.classList.toggle("done", done.has(i));
      m.classList.toggle("next", i === nextEpisode());
    });
    const n = nextEpisode();
    $("#hubNext").textContent = done.size === 0 ? "Begin the story" : n < 8 ? `Continue: Scroll ${ROMAN[n + 1]}` : "Begin again";
    $("#hubNext").dataset.episode = n < 8 ? n : 0;
    $("#hubCount").textContent = `${done.size} of 8 scrolls read`;
  }
  function nextEpisode() { for (let i = 0; i < 8; i++) if (!done.has(i)) return i; return 8; }

  function episodeCard(i) {
    const s = D.scenes[i];
    return `<p class="pop-kicker">Scroll ${ROMAN[i + 1]} · Book ${s.book}</p>
      <p class="pop-title">${s.title}</p><p>${BLURBS[i]}</p>
      <button type="button" class="pop-go" data-play="${i}">${done.has(i) ? "Watch again" : "Enter the scene"} ›</button>`;
  }

  /* ================================================================ *
   * The scene player
   * ================================================================ */
  const stage = $("#stage");
  const svg = $("#sceneSvg");
  const panel = $("#panel");
  let S = null;          // the running scene
  let beat = 0;
  let timers = [];
  let view = { x: 0, y: 0, w: 1600, h: 900 };
  let camAnim = null;

  function ctxFor(layers) {
    const c = Object.assign({}, layers, {
      A,
      instant: false,
      fig(key, x, y, opts = {}) {
        const base = D.cast[key];
        const spec = Object.assign({}, base, {
          char: opts.char || key,
          label: opts.label || D.characters[opts.char || key].name,
          cls: [base.cls, opts.cls].filter(Boolean).join(" ")
        });
        return A.figure(opts.parent || layers.act, spec, x, y, opts);
      },
      extra(key, x, y, opts = {}) {
        const base = D.extras[key];
        const spec = Object.assign({}, base, { cls: [base.cls, opts.cls].filter(Boolean).join(" "), hit: !!(opts.label || base.label) });
        const f = A.figure(opts.parent || layers.act, spec, x, y, opts);
        const term = (opts.label || base.label || "").toLowerCase();
        if (D.glossary[term]) { f.el.setAttribute("data-term", term); f.el.setAttribute("tabindex", "0"); f.el.setAttribute("role", "button"); }
        if (opts.label || base.label) f.el.setAttribute("aria-label", opts.label || base.label);
        return f;
      },
      later(ms, fn) {
        if (c.instant) { fn(); return; }
        const t = { fn };
        t.id = setTimeout(() => { timers = timers.filter((x) => x !== t); fn(); }, ms);
        timers.push(t);
      },
      sfx: (n) => { if (!c.instant) sfx(n); },
      shake() { if (c.instant || reduceMotion) return; stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); },
      fly(el, from, to) {
        el.classList.remove("gone");
        el.style.transition = "none";
        el.style.transform = `translate(${from[0]}px, ${from[1]}px)`;
        void el.getBoundingClientRect();
        el.style.transition = c.instant ? "none" : "transform .6s cubic-bezier(.3,.1,.6,1)";
        el.style.transform = `translate(${to[0]}px, ${to[1]}px) rotate(8deg)`;
        c.later(900, () => el.classList.add("gone"));
      },
      pluck() { if (!c.instant) D.audio.lyre(); },
      onTap(el, fn) {
        el.classList.add("toy");
        el.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
      },
      note(title, text) { showNote(title, text); },
      // move on, but only while the current beat is waiting for a touch
      advance() { if (S.beats[beat].tap) next(); }
    });
    return c;
  }

  let C = null; // context of the running scene
  let R = null; // its refs

  function clearTimers() { timers.forEach((t) => clearTimeout(t.id)); timers = []; }
  // finish anything still animating from the last beat, at once
  function flushTimers() {
    if (!timers.length) return;
    svg.classList.add("instant");
    C.instant = true;
    while (timers.length) { const t = timers.shift(); clearTimeout(t.id); t.fn(); }
    void svg.getBoundingClientRect();
    C.instant = false;
    svg.classList.remove("instant");
  }

  function build(i) {
    clearTimers();
    S = D.scenes[i];
    svg.innerHTML = "";
    svg.dataset.mode = S.mode;
    stage.dataset.mode = S.mode;
    A.defs(svg);
    const world = A.g({ class: "world" }, svg);
    const layers = {};
    ["bg", "mid", "act", "fx", "fg", "ui"].forEach((n) => { layers[n] = A.g({ class: "layer-" + n }, world); });
    C = ctxFor(layers);
    R = S.build(C);
    if (S.toys) S.toys(R, C);
    $("#sceneTitle").innerHTML = `<span>Scroll ${ROMAN[S.n]}</span> ${S.title}`;
    $("#sceneBook").textContent = `Book ${S.book}`;
    hideNote();
  }

  function play(i, b = 0) {
    show("scene");
    const delay = current === "scene" ? 0 : 420;
    setTimeout(() => { build(i); goTo(b, true); }, delay);
  }

  // jump to a beat: replay everything before it instantly, then animate it
  function goTo(b, fresh) {
    if (!fresh) build(S.n - 1);
    svg.classList.add("instant");
    C.instant = true;
    for (let k = 0; k < b; k++) S.beats[k].act(R, C);
    void svg.getBoundingClientRect();
    beat = b;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      svg.classList.remove("instant");
      C.instant = false;
      runBeat(b, fresh || b === 0);
    }));
  }

  function runBeat(b, snap) {
    const bt = S.beats[b];
    beat = b;
    bt.act(R, C);
    camera(bt.cam || [800, 450, 1], snap);
    drawPanel();
    drawHint();
  }

  function next() {
    if (beat < S.beats.length - 1) { hideNote(); flushTimers(); runBeat(beat + 1); return; }
    done.add(S.n - 1);
    saveDone();
    if (S.n < 8) play(S.n);
    else showEpilogue();
  }
  function prev() {
    if (beat > 0) { hideNote(); goTo(beat - 1, false); }
  }

  function drawPanel() {
    const bt = S.beats[beat];
    const last = beat === S.beats.length - 1;
    $("#narration").innerHTML = rich(bt.say);
    const q = $("#quote");
    if (bt.quote) {
      q.innerHTML = `<p>“${bt.quote[0]}”</p>${cite(bt.quote[1])}`;
      q.hidden = false;
    } else q.hidden = true;
    const t = $("#tapHint");
    t.hidden = !bt.tap;
    if (bt.tap) $("#tapLabel").textContent = bt.tap.label;
    $("#dots").innerHTML = S.beats.map((_, k) => `<span class="${k < beat ? "past" : k === beat ? "now" : ""}"></span>`).join("");
    $("#backBtn").disabled = beat === 0;
    const nb = $("#nextBtn");
    nb.querySelector("span").textContent = last ? (S.n < 8 ? `Scroll ${ROMAN[S.n + 1]}` : "Epilogue") : bt.tap ? "Skip" : "Continue";
    nb.classList.toggle("quiet", !!bt.tap);
    panel.classList.remove("fresh");
    void panel.offsetWidth;
    panel.classList.add("fresh");
    $("#panelBody").scrollTop = 0;
  }

  function drawHint() {
    C.ui.innerHTML = "";
    const bt = S.beats[beat];
    if (!bt.tap) return;
    const [x, y, r] = bt.tap.at;
    const h = A.hint(C.ui, x, y, r);
    h.setAttribute("tabindex", "0");
    h.setAttribute("role", "button");
    h.setAttribute("aria-label", bt.tap.label);
    const go = (e) => {
      e && e.stopPropagation();
      if (bt.tap.fn) { if (bt.tap.fn(R, C)) next(); }
      else next();
    };
    h.addEventListener("click", go);
    h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }

  /* the camera: a viewBox that frames the action on any screen shape */
  function camera([cx, cy, z], snap) {
    const W = stage.clientWidth || 1, H = stage.clientHeight || 1;
    const a = W / H;
    let w = 1600 / z, h = w / a;
    const maxH = 900;
    if (h > maxH) { h = maxH / Math.max(1, 1 + (z - 1) * 0.45); w = h * a; }
    let x = cx - w / 2, y = cy - h / 2;
    x = Math.max(-200, Math.min(1800 - w, x));
    y = Math.max(0, Math.min(900 - h, y));
    if (h >= 900) y = (900 - h) / 2;
    const target = { x, y, w, h };
    cancelAnimationFrame(camAnim);
    if (snap || reduceMotion) { view = target; setView(); return; }
    const from = Object.assign({}, view);
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      for (const key in target) view[key] = from[key] + (target[key] - from[key]) * e;
      setView();
      if (k < 1) camAnim = requestAnimationFrame(step);
    };
    camAnim = requestAnimationFrame(step);
  }
  function setView() { svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`); }

  function showNote(title, text) {
    const n = $("#note");
    n.innerHTML = `<p class="pop-title">${title}</p><p>${text}</p>`;
    n.hidden = false;
    n.classList.remove("in");
    void n.offsetWidth;
    n.classList.add("in");
  }
  function hideNote() { $("#note").hidden = true; }

  function showEpilogue() {
    openModal("about");
    show("hub");
  }

  /* ================================================================ *
   * Profiles and the gallery of characters
   * ================================================================ */
  function portrait(key, cls = "") {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "-110 -250 220 260");
    s.setAttribute("class", "portrait " + cls);
    s.setAttribute("aria-hidden", "true");
    const pose = { zeus: "hail", athena: "raise", apollo: "hold", achilles: "guard", hector: "guard", paris: "hold", priam: "point", helen: "point", andromache: "plead", thetis: "hail", aphrodite: "hail", hera: "point", agamemnon: "stand", menelaus: "guard", odysseus: "point", patroclus: "stand" }[key] || "stand";
    A.figure(s, Object.assign({}, D.cast[key], { halo: false }), 0, 0, { pose, scale: 1 });
    return s;
  }

  function chip(k) {
    const c = D.characters[k];
    return `<button type="button" class="chip chip-${c.side}" data-char="${k}">${c.name}</button>`;
  }

  function openProfile(key) {
    const c = D.characters[key];
    if (!c) return;
    const body = $("#profileBody");
    body.innerHTML = `
      <header class="pf-head side-bg-${c.side}">
        <div class="pf-portrait"></div>
        <div class="pf-id">
          <p class="pf-side">${SIDES[c.side]}</p>
          <h2 id="profileName">${c.name}</h2>
          <p class="pf-greek" lang="grc">${c.greek}</p>
          <p class="pf-epithet">${c.epithet}</p>
        </div>
      </header>
      <dl class="pf-facts">
        <div><dt>Lineage</dt><dd>${c.lineage}</dd></div>
        <div><dt>Home</dt><dd>${c.home}</dd></div>
      </dl>
      <p class="pf-bio">${c.bio}</p>
      <ul class="pf-traits">${c.traits.map((t) => `<li>${t}</li>`).join("")}</ul>
      <div class="pf-rel">
        ${c.allies.length ? `<div><h3>Allies &amp; kin</h3>${c.allies.map(chip).join("")}</div>` : ""}
        ${c.rivals.length ? `<div><h3>Rivals</h3>${c.rivals.map(chip).join("")}</div>` : ""}
      </div>
      <h3 class="pf-sub">Where to find ${c.name}</h3>
      <ol class="pf-moments">
        ${c.moments.map(([ch, t]) => `<li><button type="button" data-play="${ch - 1}">
          <span class="pm-num">${ROMAN[ch]}</span><span>${t}<small>${D.scenes[ch - 1].title}</small></span></button></li>`).join("")}
      </ol>
      <p class="pf-fate"><strong>Fate.</strong> ${c.fate}</p>`;
    $(".pf-portrait", body).appendChild(portrait(key));
    openModal("profile");
    $("#profile .sheet").scrollTop = 0;
  }

  function buildGallery() {
    const grid = $("#galleryGrid");
    const groups = [["achaean", "The Achaeans"], ["trojan", "The Trojans"], ["olympian", "The Gods"]];
    grid.innerHTML = groups.map(([side, label]) => `
      <h3 class="gal-head">${label}</h3>
      <ul class="gal-row">${Object.keys(D.characters).filter((k) => D.characters[k].side === side).map((k) =>
        `<li><button type="button" class="gal-card side-${side}" data-char="${k}"><span class="gal-fig" data-portrait="${k}"></span><span class="gal-name">${D.characters[k].name}</span><small>${D.characters[k].epithet.split(",")[0]}</small></button></li>`).join("")}</ul>`).join("");
    $$("[data-portrait]", grid).forEach((el) => el.appendChild(portrait(el.dataset.portrait, "small")));
  }

  /* ================================================================ *
   * Modals and popovers
   * ================================================================ */
  let lastFocus = null;
  function openModal(id) {
    const m = $("#" + id);
    $$(".modal").forEach((x) => { if (x !== m) x.hidden = true; });
    if (m.hidden) lastFocus = document.activeElement;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add("open"));
    const cl = $(".close", m);
    cl && cl.focus({ preventScroll: true });
    hidePopover();
  }
  function closeModals() {
    $$(".modal").forEach((m) => { m.classList.remove("open"); m.hidden = true; });
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  const pop = $("#popover");
  let popFor = null, popPinned = false;
  function showPopover(anchor, html, pinned) {
    pop.innerHTML = html;
    pop.hidden = false;
    popFor = anchor;
    popPinned = !!pinned;
    const r = anchor.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = Math.max(10, Math.min(window.innerWidth - pw - 10, r.left + r.width / 2 - pw / 2));
    let y = r.top - ph - 12, below = false;
    if (y < 10) { y = r.bottom + 12; below = true; }
    if (y + ph > window.innerHeight - 10) y = Math.max(10, window.innerHeight - ph - 10);
    pop.style.left = x + "px";
    pop.style.top = y + "px";
    pop.classList.toggle("below", below);
    pop.style.setProperty("--ax", Math.max(14, Math.min(pw - 14, r.left + r.width / 2 - x)) + "px");
    requestAnimationFrame(() => pop.classList.add("show"));
  }
  function hidePopover() { pop.classList.remove("show"); pop.hidden = true; popFor = null; popPinned = false; }
  function termHTML(key) { const [n, d] = D.glossary[key]; return `<p class="pop-title">${n}</p><p>${d}</p>`; }

  /* ================================================================ *
   * Sound
   * ================================================================ */
  let soundOn = true;
  function sfx(name) {
    if (!soundOn) return;
    D.audio.unlock();
    D.audio.sfx(name);
  }

  /* ================================================================ *
   * Events
   * ================================================================ */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const playEl = t.closest("[data-play]");
    const charEl = t.closest("[data-char]");
    const termEl = t.closest("[data-term]");
    const medal = t.closest(".m-medal");
    if (playEl) { e.preventDefault(); closeModals(); hidePopover(); play(+playEl.dataset.play); return; }
    if (charEl) { e.preventDefault(); openProfile(charEl.dataset.char); return; }
    if (termEl) {
      e.preventDefault();
      if (popFor === termEl && popPinned) hidePopover();
      else showPopover(termEl, termHTML(termEl.dataset.term), true);
      return;
    }
    if (medal) { showPopover(medal, episodeCard(+medal.dataset.episode), true); sfx("chime"); return; }
    if (t.closest("[data-close]")) { closeModals(); return; }
    if (t.closest(".popover")) return;
    if (!pop.hidden) hidePopover();
  });
  document.addEventListener("mouseover", (e) => {
    const termEl = e.target.closest && e.target.closest("button[data-term]");
    if (!termEl || popPinned || !window.matchMedia("(hover: hover)").matches) return;
    showPopover(termEl, termHTML(termEl.dataset.term), false);
  });
  document.addEventListener("mouseout", (e) => {
    const termEl = e.target.closest && e.target.closest("button[data-term]");
    if (termEl && !popPinned && popFor === termEl) hidePopover();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hidePopover(); closeModals(); hideNote(); return; }
    const k = e.target.closest && e.target.closest(".m-medal, .fig[data-char], .fig[data-term]");
    if (k && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); k.dispatchEvent(new MouseEvent("click", { bubbles: true })); return; }
    if (current !== "scene" || !$$(".modal").every((m) => m.hidden)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  });

  $("#nextBtn").addEventListener("click", () => { sfx("tick"); next(); });
  $("#backBtn").addEventListener("click", prev);
  $("#toMap").addEventListener("click", () => show("hub"));
  $("#hubNext").addEventListener("click", (e) => play(+e.currentTarget.dataset.episode));
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.open)));
  $$(".snd").forEach((b) => b.addEventListener("click", () => {
    soundOn = !soundOn;
    $$(".snd").forEach((x) => { x.classList.toggle("on", soundOn); x.setAttribute("aria-pressed", soundOn); });
    if (soundOn) sfx("tick");
  }));
  $$(".mus").forEach((b) => b.addEventListener("click", () => {
    D.audio.unlock();
    const on = D.audio.setMusic(!D.audio.musicOn);
    $$(".mus").forEach((x) => { x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
  }));
  $("#note").addEventListener("click", hideNote);

  // swipe between beats on touch screens
  let sx = null, sy = null;
  stage.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { sx = e.clientX; sy = e.clientY; } });
  stage.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { hidePopover(); if (S && current === "scene") camera(S.beats[beat].cam || [800, 450, 1], true); }, 100);
  });

  /* ================================================================ *
   * Start
   * ================================================================ */
  // a laurel wreath symbol for medals and covers
  (function wreathSymbol() {
    const defs = $("#sharedDefs");
    const sym = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    sym.setAttribute("id", "wreathSym");
    sym.setAttribute("viewBox", "0 0 200 120");
    let out = "";
    const cx = 100, cy = 58, r = 50, deg = Math.PI / 180, f = (n) => n.toFixed(1);
    [1, -1].forEach((side) => {
      const pt = (a) => [cx - side * r * Math.cos(a * deg), cy + r * Math.sin(a * deg)];
      const pts = [];
      for (let a = 96; a <= 234; a += 3) pts.push(pt(a));
      out += `<path d="M${pts.map((p) => f(p[0]) + " " + f(p[1])).join(" L")}" fill="none" stroke="currentColor" stroke-width="2.2"/>`;
      for (let a = 104; a <= 228; a += 9) {
        const [x, y] = pt(a);
        const ang = Math.atan2(r * Math.cos(a * deg), side * r * Math.sin(a * deg)) / deg;
        const len = 9.5 - (a - 104) / 34;
        [38, -38].forEach((tl) => { out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(len)}" ry="${f(len * 0.38)}" transform="rotate(${f(ang + tl)} ${f(x)} ${f(y)}) translate(${f(len * 0.85)} 0)" fill="currentColor"/>`; });
      }
    });
    out += `<path d="M93 104 Q100 99 107 104 L113 117 L104 111 L100 116 L96 111 L87 117 Z" fill="currentColor"/>`;
    sym.innerHTML = out;
    defs.appendChild(sym);
  })();

  buildMap();
  buildGallery();
  // a lone warrior stands on the inside page of the book
  $("#proemFig").appendChild(portrait("achilles", "proem"));
  drawHubState();
  document.body.dataset.screen = "intro";

  // deep links: #scroll-3 opens that episode
  const m = /#scroll-(\d)/.exec(location.hash);
  if (m && +m[1] >= 1 && +m[1] <= 8) play(+m[1] - 1);
  else if (location.hash === "#map") show("hub", false);
})();
