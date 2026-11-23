/* The Iliad: an illustrated, interactive telling
 * The engine: the invocation, the scroll-driven chapters, the camera, the
 * menu, character profiles and glossary notes.
 *
 * Each chapter is a sticky stage with step cards scrolling over it. When a
 * card crosses the reading line, its beat plays on the stage. Between cards
 * the camera drifts with the scroll, and some beats are "scrubbed": their
 * motion follows the reader's scroll position directly.
 */

(function () {
  "use strict";

  const D = window.ILIAD;
  const A = D.art;
  const CH = D.chapters;
  const LAST = CH.length - 1;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const SIDES = { achaean: "Achaean", trojan: "Trojan", olympian: "Olympian" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const chapNum = (i) => (i === 0 ? "Prologue" : i === LAST ? "Epilogue" : `Chapter ${ROMAN[i]}`);
  const chapWhere = (ch) => (ch.book ? `Book ${ch.book}` : ch.kicker);
  const numeral = (i) => (i === 0 ? "Α" : i === LAST ? "Ω" : ROMAN[i]);
  const shortTag = (i) => (i === 0 ? "Prologue" : i === LAST ? "Epilogue" : `Book ${CH[i].book}`);

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
   * Sound
   * ================================================================ */
  let soundOn = true;
  let quietUntil = 0;
  function sfx(name) {
    if (!soundOn || performance.now() < quietUntil) return;
    D.audio.unlock();
    D.audio.sfx(name);
  }

  /* ================================================================ *
   * Chapters: a title card, then a sticky stage with step cards
   * ================================================================ */
  const done = new Set(loadDone());
  function loadDone() { try { return JSON.parse(localStorage.getItem("iliad-read-v3") || "[]"); } catch (e) { return []; } }
  function saveDone() { try { localStorage.setItem("iliad-read-v3", JSON.stringify([...done])); } catch (e) { /* storage unavailable */ } }

  function stepHTML(ch, b, k, i) {
    const n = ch.beats.length;
    let tail = "";
    if (b.end && i === LAST) tail = `<div class="card-actions"><a class="btn-gold small" href="#numbers">The Iliad in numbers <span aria-hidden="true">↓</span></a></div>`;
    return `<article class="step${b.tableau ? " tableau" : ""}${k === n - 1 ? " last" : ""}" data-beat="${k}">
      <div class="card">
        <p class="step-n"><span>${String(k + 1).padStart(2, "0")}</span> / ${String(n).padStart(2, "0")}</p>
        <p class="say">${rich(b.say)}</p>
        ${b.quote ? `<blockquote class="quote"><p>“${b.quote[0]}”</p>${cite(b.quote[1])}</blockquote>` : ""}
        ${b.tap ? `<button type="button" class="tap-btn" data-tap="${k}"><span class="tap-dot" aria-hidden="true"></span>${b.tap.label}</button>` : ""}
        ${tail}
      </div>
    </article>`;
  }

  const stages = CH.map((ch, i) => {
    const sec = document.createElement("section");
    sec.className = "chapter";
    sec.id = "ch-" + i;
    sec.dataset.mode = ch.mode;
    sec.setAttribute("aria-label", `${chapNum(i)}: ${ch.title}`);
    sec.innerHTML = `
      <header class="ch-card">
        <span class="ch-numeral" aria-hidden="true">${numeral(i)}</span>
        <div class="ch-copy">
          <p class="kicker">${chapNum(i)} · ${chapWhere(ch)}</p>
          <h2 class="ch-title">${ch.title}</h2>
          <p class="ch-greek"><span lang="grc">${ch.greek}</span> <em>${ch.gloss}</em></p>
          <p class="ch-dek">${ch.dek}</p>
          ${ch.later ? `<p class="ch-flag">Told in later Greek poems, not in the Iliad itself</p>` : ""}
        </div>
      </header>
      <div class="scrolly">
        <div class="stage-wrap paused" data-mode="${ch.mode}" data-light="${ch.light}">
          <svg class="stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration: ${ch.title}"></svg>
          <div class="light" aria-hidden="true"></div>
          <div class="wash" aria-hidden="true"></div>
          <div class="note" role="status" hidden></div>
          <p class="stage-tag" aria-hidden="true"><span>${shortTag(i)}</span><b class="beat-count"></b></p>
        </div>
        <div class="steps">${ch.beats.map((b, k) => stepHTML(ch, b, k, i)).join("")}</div>
      </div>`;
    $("#chapters").appendChild(sec);
    return {
      i, ch, sec,
      scrolly: $(".scrolly", sec),
      wrap: $(".stage-wrap", sec),
      svg: $(".stage", sec),
      noteEl: $(".note", sec),
      countEl: $(".beat-count", sec),
      steps: $$(".step", sec),
      cards: $$(".step .card", sec),
      built: false, used: false, near: false, visible: false,
      beat: -1, p: -1, view: null, timers: [], C: null, R: null, layers: null
    };
  });

  /* give each stage its own ids for gradients and patterns, so that a
   * day scene and a night scene on the same page keep their own colors */
  function uniquify(svg, sfxId) {
    $$("defs [id]", svg).forEach((e) => { e.id += sfxId; });
    $$("[fill^='url(#'], [filter^='url(#'], [stroke^='url(#']", svg).forEach((e) => {
      ["fill", "filter", "stroke"].forEach((a) => {
        const v = e.getAttribute(a);
        if (v && v.startsWith("url(#")) e.setAttribute(a, v.replace(/url\(#([^)]+)\)/, `url(#$1${sfxId})`));
      });
    });
  }

  function ctxFor(st, layers) {
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
        t.id = setTimeout(() => { st.timers = st.timers.filter((x) => x !== t); fn(); }, ms);
        st.timers.push(t);
      },
      sfx: (n) => { if (!c.instant) sfx(n); },
      shake() {
        if (c.instant || reduceMotion) return;
        st.wrap.classList.remove("shake");
        void st.wrap.offsetWidth;
        st.wrap.classList.add("shake");
      },
      fly(el, from, to) {
        el.classList.remove("gone");
        el.style.transition = "none";
        el.style.transform = `translate(${from[0]}px, ${from[1]}px)`;
        void el.getBoundingClientRect();
        el.style.transition = c.instant ? "none" : "transform .6s cubic-bezier(.3,.1,.6,1)";
        el.style.transform = `translate(${to[0]}px, ${to[1]}px) rotate(8deg)`;
        c.later(900, () => el.classList.add("gone"));
      },
      pluck() { if (!c.instant && soundOn) { D.audio.unlock(); D.audio.lyre(); } },
      onTap(el, fn) {
        el.classList.add("toy");
        el.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
      },
      note(title, text) { showNote(st, title, text); },
      // move on, but only while the current beat is waiting for a touch
      advance() { if (st.beat >= 0 && st.ch.beats[st.beat].tap) goStep(st, st.beat + 1); }
    });
    return c;
  }

  function clearTimers(st) { st.timers.forEach((t) => clearTimeout(t.id)); st.timers = []; }
  function instantly(st, fn) {
    st.svg.classList.add("instant");
    st.C.instant = true;
    fn();
    void st.svg.getBoundingClientRect();
    st.C.instant = false;
    st.svg.classList.remove("instant");
  }
  // finish anything still animating from the last beat, at once
  function flushTimers(st) {
    if (!st.timers.length) return;
    instantly(st, () => { while (st.timers.length) { const t = st.timers.shift(); clearTimeout(t.id); t.fn(); } });
  }

  function build(st) {
    clearTimers(st);
    const svg = st.svg;
    svg.innerHTML = "";
    svg.dataset.mode = st.ch.mode;
    A.defs(svg);
    const world = A.g({ class: "world" }, svg);
    const layers = {};
    ["bg", "mid", "act", "fx", "fg", "ui"].forEach((n) => { layers[n] = A.g({ class: "layer-" + n }, world); });
    st.layers = layers;
    st.C = ctxFor(st, layers);
    st.R = st.ch.build(st.C);
    uniquify(svg, "-c" + st.i);
    if (st.ch.toys) st.ch.toys(st.R, st.C);
    st.built = true;
    st.used = false;
    st.beat = -1;
    st.p = -1;
  }

  function runAct(st, k, instant) {
    const bt = st.ch.beats[k];
    bt.act(st.R, st.C);
    if (instant && bt.scrub) bt.scrub(st.R, st.C, 1);
  }

  // show beat b: replay what came before at once, then play b
  function setBeat(st, b) {
    if (!st.built) build(st);
    if (b === st.beat) return;
    hideNote(st);
    const back = st.beat >= 0 && b < st.beat;
    if (st.beat >= 0 && !back) {
      flushTimers(st);
      if (b - st.beat > 1) instantly(st, () => { for (let k = st.beat + 1; k < b; k++) runAct(st, k, true); });
      runAct(st, b, false);
    } else {
      if (st.used) build(st);
      instantly(st, () => { for (let k = 0; k < (back ? b + 1 : b); k++) runAct(st, k, true); });
      if (!back) runAct(st, b, false);
    }
    st.used = true;
    st.beat = b;
    st.p = -1;
    const bt = st.ch.beats[b];
    st.steps.forEach((s, k) => s.classList.toggle("active", k === b));
    st.countEl.textContent = `${b + 1} / ${st.ch.beats.length}`;
    st.wrap.dataset.light = bt.light || st.ch.light;
    st.wrap.classList.toggle("washed", !!bt.wash);
    drawHint(st);
    if (b === st.ch.beats.length - 1 && !done.has(st.i)) { done.add(st.i); saveDone(); drawRead(); }
  }

  function drawHint(st) {
    const ui = st.layers.ui;
    ui.innerHTML = "";
    const bt = st.ch.beats[st.beat];
    if (!bt.tap) return;
    const [x, y, r] = bt.tap.at;
    const h = A.hint(ui, x, y, r);
    h.setAttribute("tabindex", "0");
    h.setAttribute("role", "button");
    h.setAttribute("aria-label", bt.tap.label);
    const go = (e) => { if (e) { e.stopPropagation(); e.preventDefault(); } tapBeat(st, st.beat); };
    h.addEventListener("click", go);
    h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") go(e); });
  }

  function tapBeat(st, k) {
    if (st.beat !== k) { goStep(st, k); return; }
    const bt = st.ch.beats[k];
    sfx("tick");
    if (bt.tap.fn) { if (bt.tap.fn(st.R, st.C)) goStep(st, k + 1); }
    else goStep(st, k + 1);
  }

  /* ================================================================ *
   * Scroll: the reading line, the camera, scrubbing, the progress bar
   * ================================================================ */
  const isPortrait = () => window.innerWidth / window.innerHeight < 1;
  const readLine = () => window.innerHeight * (isPortrait() ? 0.86 : 0.74);

  function goStep(st, k) {
    if (k >= st.steps.length) { jumpTo(CH[st.i + 1] ? "ch-" + (st.i + 1) : "numbers", true); return; }
    const top = st.cards[k].getBoundingClientRect().top + window.scrollY - readLine() * 0.7;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  // where the camera looks: a viewBox that frames the action on any screen
  function frameView(st, cam, tap) {
    const [cx, cy, z] = cam;
    const W = st.wrap.clientWidth || 1, H = st.wrap.clientHeight || 1;
    const a = W / H;
    let w, h, fx = 0.5, fy = 0.5, maxY = 900;
    if (a >= 1) {
      w = 1600 / z; h = w / a;
      if (h > 900) { h = 900 / Math.max(1, 1 + (z - 1) * 0.45); w = h * a; }
      fx = W >= 1100 ? 0.6 : 0.64; // the cards sit on the left
    } else {
      h = 1000 / (1 + (z - 1) * 0.3); w = h * a;
      fy = 0.28; maxY = 1160;          // the cards sit at the bottom
    }
    let x = cx - fx * w;
    // keep a glowing ring in view on narrow screens
    if (tap && a < 1) {
      const [tx, , tr] = tap;
      const m = Math.min(tr + 16, w / 2);
      x = clamp(x, tx + m - w, tx - m);
    }
    x = clamp(x, -300, 1900 - w);
    const y = clamp(cy - fy * h, -200, maxY - h);
    return { x, y, w, h };
  }

  function stepState(st) {
    const line = readLine();
    const tops = st.cards.map((s) => s.getBoundingClientRect());
    let b = 0;
    tops.forEach((r, k) => { if (r.top < line) b = k; });
    const t0 = tops[b].top;
    const t1 = b + 1 < tops.length ? tops[b + 1].top : tops[b].bottom;
    const p = clamp((line - t0) / Math.max(1, t1 - t0), 0, 1);
    return [b, p];
  }

  let lastT = performance.now();
  function loop(t) {
    const dt = Math.min(100, t - lastT);
    lastT = t;
    stages.forEach((st) => { if (st.visible) tick(st, dt); });
    requestAnimationFrame(loop);
  }

  function tick(st, dt) {
    const [b, p] = stepState(st);
    if (b !== st.beat) setBeat(st, b);
    const bt = st.ch.beats[st.beat];
    let cam = bt.cam || [800, 450, 1];
    if (bt.scrub && Math.abs(p - st.p) > 0.0005) {
      const c2 = bt.scrub(st.R, st.C, reduceMotion ? 1 : p);
      st.scrubCam = c2 || null;
      st.p = p;
    }
    if (bt.scrub && st.scrubCam) cam = st.scrubCam;
    else if (!reduceMotion) cam = [cam[0] + 22 * p, cam[1], cam[2] * (1 + 0.04 * p)]; // a slow push in
    const target = frameView(st, cam, bt.tap && bt.tap.at);
    if (!st.view) st.view = target;
    else {
      const k = reduceMotion ? 1 : 1 - Math.exp(-dt / 300);
      for (const key in target) st.view[key] += (target[key] - st.view[key]) * k;
    }
    const v = st.view;
    const vb = `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`;
    if (vb !== st.vb) {
      st.vb = vb;
      st.svg.setAttribute("viewBox", vb);
      // depth: the far layers lag behind the camera a little
      const mx = v.x + v.w / 2 - 800;
      st.layers.bg.setAttribute("transform", `translate(${(mx * 0.08).toFixed(1)} 0)`);
      st.layers.mid.setAttribute("transform", `translate(${(mx * 0.03).toFixed(1)} 0)`);
    }
  }

  // build stages a little before they arrive; pause them once they leave
  const nearObs = new IntersectionObserver((es) => es.forEach((e) => {
    const st = stages[+e.target.closest(".chapter").id.slice(3)];
    st.near = e.isIntersecting;
    if (st.near && !st.built) build(st);
  }), { rootMargin: "150% 0px" });
  const visObs = new IntersectionObserver((es) => es.forEach((e) => {
    const st = stages[+e.target.closest(".chapter").id.slice(3)];
    st.visible = e.isIntersecting;
    st.wrap.classList.toggle("paused", !st.visible);
    if (!st.visible) { hideNote(st); if (st.built) flushTimers(st); }
  }), { rootMargin: "0px" });
  stages.forEach((st) => { nearObs.observe(st.scrolly); visObs.observe(st.scrolly); });

  /* where the reader is: the top bar, the rail, the progress line */
  let nowKey = null;
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $("#progressBar").style.transform = `scaleX(${clamp(window.scrollY / Math.max(1, max), 0, 1)})`;
    const mid = window.innerHeight * 0.5;
    let key = "top";
    stages.forEach((st) => { const r = st.sec.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) key = st.sec.id; });
    const nr = $("#numbers").getBoundingClientRect();
    if (nr.top < mid) key = "numbers";
    document.body.classList.toggle("scrolled", window.scrollY > 40);
    if (key === nowKey) return;
    nowKey = key;
    let label = "";
    if (key.startsWith("ch-")) { const i = +key.slice(3); label = `<span>${shortTag(i)}</span> ${CH[i].title}`; }
    else if (key === "numbers") label = "<span>Infographics</span> The Iliad in numbers";
    $("#nowLabel").innerHTML = label;
    $$("#rail a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + key));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { hidePopover(); onScroll(); });

  // jump without gliding through every chapter on the way
  function jumpTo(id, smooth) {
    const el = document.getElementById(id);
    if (!el) return;
    closeMenu();
    closeDrawer();
    quietUntil = performance.now() + 600;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const near = Math.abs(top - window.scrollY) < window.innerHeight * 2.5;
    window.scrollTo({ top, behavior: smooth && near && !reduceMotion ? "smooth" : "auto" });
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  }

  /* ================================================================ *
   * Notes on the stage (shield rings, urns)
   * ================================================================ */
  function showNote(st, title, text) {
    const n = st.noteEl;
    n.innerHTML = `<p class="pop-title">${title}</p><p>${text}</p>`;
    n.hidden = false;
    n.classList.remove("in");
    void n.offsetWidth;
    n.classList.add("in");
  }
  function hideNote(st) { st.noteEl.hidden = true; }

  /* ================================================================ *
   * The hero picture: Achilles alone before Troy at night
   * ================================================================ */
  function buildHero() {
    const svg = $("#heroSvg");
    svg.dataset.mode = "night";
    A.defs(svg);
    const w = A.g({ class: "world" }, svg);
    const bg = A.g({ class: "hero-bg" }, w), mid = A.g({ class: "hero-mid" }, w), act = A.g({}, w);
    A.sky(bg, "night");
    A.moon(bg, 1180, 170, 40);
    A.hills(bg, 600, 60, "far");
    const fires = A.g({ class: "watchfires" }, bg);
    for (let i = 0; i < 22; i++) A.fire(fires, 120 + ((i * 71) % 1400), 640 + ((i * 29) % 50), 0.1 + (i % 3) * 0.04);
    A.walls(mid, 980, 690, 700, 250, { towers: [1080, 1560], gate: 1320 });
    A.ground(mid, 690, "ground");
    A.figure(act, Object.assign({}, D.cast.achilles), 840, 862, { scale: 1.45, facing: 1, pose: "stand" });
    A.frieze(act, 878);
    uniquify(svg, "-hero");
    window.addEventListener("scroll", () => {
      if (window.scrollY > window.innerHeight * 1.2) return;
      const y = window.scrollY;
      bg.setAttribute("transform", `translate(0 ${(y * 0.12).toFixed(1)})`);
      mid.setAttribute("transform", `translate(0 ${(y * 0.06).toFixed(1)})`);
    }, { passive: true });
  }

  /* ================================================================ *
   * The rail, the menu, the map, the cast
   * ================================================================ */
  function buildRail() {
    $("#rail").innerHTML = CH.map((ch, i) => `<a href="#ch-${i}" data-jump="ch-${i}"><i></i><span>${i === 0 || i === LAST ? chapNum(i) : `${ROMAN[i]} · ${ch.title}`}</span></a>`).join("")
      + `<a href="#numbers" data-jump="numbers" class="rail-num"><i></i><span>In numbers</span></a>`;
  }

  function drawRead() {
    const n = CH.filter((_, i) => done.has(i)).length;
    $("#readCount").textContent = n ? `${n} of ${CH.length} chapters read` : `${CH.length} chapters · about 20 minutes`;
    $$("#chapterList li").forEach((li, i) => li.classList.toggle("read", done.has(i)));
    $$(".m-medal").forEach((m) => m.classList.toggle("done", done.has(+m.dataset.chapter)));
  }

  function buildChapterList() {
    $("#chapterList").innerHTML = CH.map((ch, i) => `<li>
      <a href="#ch-${i}" data-jump="ch-${i}" class="cl-card" data-mode="${ch.mode}">
        <span class="cl-num">${numeral(i)}</span>
        <span class="cl-text"><small>${chapNum(i)} · ${chapWhere(ch)}</small><b>${ch.title}</b><em lang="grc">${ch.greek}</em><span class="cl-dek">${ch.dek}</span></span>
        <span class="cl-check" aria-label="Read"></span>
      </a></li>`).join("");
  }

  // where each book sits on the map of the Troad (600 x 720 grid)
  const MAP_AT = [[132, 232], [350, 400], [486, 470], [214, 184], [292, 318], [118, 300], [372, 498], [186, 262]];
  function buildMap() {
    const svg = $("#map");
    A.el("defs", { html: `<pattern id="mapWave" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 22 Q8 22 12 14 Q16 6 24 8 Q30 10 28 16 Q26 20 22 18 Q30 26 44 22 Q52 20 60 22" fill="none" class="m-wave-line"/></pattern>` }, svg);
    const g = A.g({}, svg);
    A.el("rect", { x: -300, y: -300, width: 1200, height: 1320, class: "m-sea" }, g);
    const waves = A.g({ class: "m-waves" }, g);
    for (let y = -40; y < 760; y += 34) A.el("rect", { x: -300, y, width: 1200, height: 30, fill: "url(#mapWave)", opacity: 0.35 }, waves);
    A.path("M1000 140 L600 150 C540 140 500 160 450 150 C400 140 360 150 320 160 C270 170 230 165 190 175 C150 185 120 200 92 218 C74 230 82 260 94 290 C106 330 98 380 88 420 C80 470 92 530 84 590 C80 640 90 690 96 720 C100 800 96 900 100 1120 L1000 1120 Z", { class: "m-land" }, g);
    A.path("M300 -400 L300 0 C330 20 380 30 430 28 C480 26 540 40 600 50 L1000 62 L1000 -400 Z", { class: "m-land far" }, g);
    A.path("M-400 -400 L210 -400 L210 0 C190 20 150 40 100 52 C60 60 20 80 0 96 L-400 130 Z", { class: "m-land far" }, g);
    A.path("M30 520 C40 500 70 498 78 512 C86 528 70 548 50 548 C34 548 24 534 30 520 Z", { class: "m-land" }, g);
    A.path("M450 700 L500 600 L540 650 L580 570 L640 700 Z", { class: "m-mount" }, g);
    A.path("M540 720 C500 640 430 600 380 560 C340 530 300 500 268 450 C240 400 250 360 236 310 C222 260 220 220 200 178", { class: "m-river" }, g);
    A.path("M600 330 C560 320 520 310 480 300 C420 286 360 300 300 330 C270 345 250 330 240 318", { class: "m-river" }, g);
    for (let i = 0; i < 8; i++) A.ship(g, 120 + i * 30, 196 - i * 4, 0.08, 1, { mast: true });
    for (let i = 0; i < 4; i++) A.tent(g, 112 + i * 34, 232 - i * 5, 0.13);
    const troy = A.g({ class: "m-troy" }, g);
    A.el("ellipse", { cx: 430, cy: 452, rx: 56, ry: 40, class: "m-hill" }, troy);
    A.walls(troy, 392, 470, 80, 30, { towers: [404, 460] });
    A.el("text", { x: 430, y: 548, "text-anchor": "middle", class: "m-label" }, troy).textContent = "ILION";
    A.el("text", { x: 345, y: 110, "text-anchor": "middle", class: "m-label sea" }, g).textContent = "HELLESPONT";
    A.el("text", { x: 36, y: 420, "text-anchor": "middle", class: "m-label sea", transform: "rotate(-90 36 420)" }, g).textContent = "AEGEAN SEA";
    A.el("text", { x: 540, y: 690, "text-anchor": "middle", class: "m-label" }, g).textContent = "IDA";
    A.el("text", { x: 52, y: 570, "text-anchor": "middle", class: "m-label small" }, g).textContent = "TENEDOS";
    A.path("M" + MAP_AT.map((p) => p.join(" ")).join(" L"), { class: "m-route" }, g);
    MAP_AT.forEach(([x, y], k) => {
      const i = k + 1;
      const outer = A.g({ class: "m-medal", transform: `translate(${x} ${y})`, tabindex: "0", role: "button", "data-chapter": i, "aria-label": `Book ${CH[i].book}: ${CH[i].title}` }, g);
      const m = A.g({ class: "m-in" }, outer);
      A.el("circle", { r: 30, class: "m-halo" }, m);
      A.el("circle", { r: 21, class: "m-disc" }, m);
      A.el("circle", { r: 17, class: "m-ring" }, m);
      A.el("text", { y: 6, "text-anchor": "middle", class: "m-num" }, m).textContent = ROMAN[i];
      A.g({ class: "m-laurel", html: `<use href="#wreathSym" x="-34" y="-28" width="68" height="44"/>` }, m);
    });
  }
  function medalCard(i) {
    const ch = CH[i];
    return `<p class="pop-kicker">${chapNum(i)} · Book ${ch.book}</p>
      <p class="pop-title">${ch.title}</p><p>${ch.dek}</p>
      <button type="button" class="pop-go" data-jump="ch-${i}">${done.has(i) ? "Read again" : "Go to this book"} ›</button>`;
  }

  function portrait(key, cls = "") {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "-110 -250 220 260");
    s.setAttribute("class", "portrait " + cls);
    s.setAttribute("aria-hidden", "true");
    const pose = { zeus: "hail", athena: "raise", apollo: "hold", achilles: "guard", hector: "guard", paris: "hold", priam: "point", helen: "point", andromache: "plead", thetis: "hail", aphrodite: "hail", hera: "point", agamemnon: "stand", menelaus: "guard", odysseus: "point", patroclus: "stand" }[key] || "stand";
    A.figure(s, Object.assign({}, D.cast[key], { halo: false, cls: (D.cast[key].cls || "") + (D.cast[key].halo ? " god" : "") }), 0, 0, { pose, scale: 1 });
    return s;
  }

  function buildGallery() {
    const grid = $("#galleryGrid");
    const groups = [["achaean", "The Achaeans"], ["trojan", "The Trojans"], ["olympian", "The Gods"]];
    grid.innerHTML = groups.map(([side, label]) => `
      <h3 class="gal-head side-${side}">${label}</h3>
      <ul class="gal-row">${Object.keys(D.characters).filter((k) => D.characters[k].side === side).map((k) =>
        `<li><button type="button" class="gal-card side-${side}" data-char="${k}"><span class="gal-fig" data-portrait="${k}"></span><span class="gal-name">${D.characters[k].name}</span><small>${D.characters[k].epithet.split(",")[0]}</small></button></li>`).join("")}</ul>`).join("");
    $$("[data-portrait]", grid).forEach((el) => el.appendChild(portrait(el.dataset.portrait, "small")));
  }

  const menu = $("#menu");
  let lastFocus = null;
  function openMenu(tab = "chapters") {
    if (menu.hidden) lastFocus = document.activeElement;
    closeDrawer(true);
    menu.hidden = false;
    document.documentElement.classList.add("modal-open");
    requestAnimationFrame(() => menu.classList.add("open"));
    showTab(tab);
    hidePopover();
    $(".close", menu).focus({ preventScroll: true });
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.classList.remove("open");
    menu.hidden = true;
    if ($("#drawer").hidden) document.documentElement.classList.remove("modal-open");
    hidePopover();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function showTab(tab) {
    $$(".tabs [data-tab]", menu).forEach((b) => { const on = b.dataset.tab === tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    $$(".tab-pane", menu).forEach((p) => { p.hidden = p.dataset.pane !== tab; });
    $(".menu-body", menu).scrollTop = 0;
  }

  /* a character's profile, in a drawer */
  const drawer = $("#drawer");
  function chip(k) {
    const c = D.characters[k];
    return `<button type="button" class="chip chip-${c.side}" data-char="${k}">${c.name}</button>`;
  }
  function openProfile(key) {
    const c = D.characters[key];
    if (!c) return;
    const body = $("#profileBody");
    const appears = CH.map((ch, i) => [i, ch]).filter(([i, ch]) => ch.later && ((i === 0 && ["paris", "helen", "hera", "athena", "aphrodite", "agamemnon", "menelaus"].includes(key)) || (i === LAST && ["achilles", "paris", "apollo", "odysseus", "priam", "andromache"].includes(key))));
    body.innerHTML = `
      <header class="pf-head side-${c.side}">
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
        ${c.moments.map(([n, t]) => `<li><button type="button" data-jump="ch-${n}">
          <span class="pm-num">${ROMAN[n]}</span><span>${t}<small>Book ${CH[n].book} · ${CH[n].title}</small></span></button></li>`).join("")}
        ${appears.map(([i, ch]) => `<li><button type="button" data-jump="ch-${i}"><span class="pm-num">${numeral(i)}</span><span>${chapNum(i)}<small>${ch.title}</small></span></button></li>`).join("")}
      </ol>
      <p class="pf-fate"><strong>Fate.</strong> ${c.fate}</p>`;
    $(".pf-portrait", body).appendChild(portrait(key));
    if (drawer.hidden) lastFocus = lastFocus || document.activeElement;
    drawer.hidden = false;
    document.documentElement.classList.add("modal-open");
    requestAnimationFrame(() => drawer.classList.add("open"));
    $(".drawer-sheet", drawer).scrollTop = 0;
    $(".close", drawer).focus({ preventScroll: true });
    hidePopover();
  }
  function closeDrawer(keepLock) {
    if (drawer.hidden) return;
    drawer.classList.remove("open");
    drawer.hidden = true;
    if (!keepLock && menu.hidden) document.documentElement.classList.remove("modal-open");
  }

  /* ================================================================ *
   * Popovers: glossary terms and map medals
   * ================================================================ */
  const pop = $("#popover");
  let popFor = null, popPinned = false;
  function showPopover(anchor, html, pinned) {
    pop.innerHTML = html;
    pop.hidden = false;
    popFor = anchor;
    popPinned = !!pinned;
    const r = anchor.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    const x = Math.max(10, Math.min(window.innerWidth - pw - 10, r.left + r.width / 2 - pw / 2));
    let y = r.top - ph - 12, below = false;
    if (y < 64) { y = r.bottom + 12; below = true; }
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
   * The invocation
   * ================================================================ */
  function prepareInvocation() {
    const line = $("#invLine");
    const words = line.textContent.split(" ");
    line.innerHTML = words.map((w, k) => `<span style="--d:${(0.9 + k * 0.09).toFixed(2)}s">${w}</span>`).join(" ");
  }
  function enter(withSound) {
    soundOn = withSound;
    syncSoundButtons();
    if (withSound) { D.audio.unlock(); sfx("chime"); }
    const inv = $("#invocation");
    inv.classList.add("leaving");
    document.documentElement.classList.remove("locked");
    document.body.classList.remove("locked");
    setTimeout(() => { inv.hidden = true; }, reduceMotion ? 0 : 1100);
    $(".brand").focus({ preventScroll: true });
  }
  function skipInvocation() {
    $("#invocation").hidden = true;
    document.documentElement.classList.remove("locked");
    document.body.classList.remove("locked");
  }
  function syncSoundButtons() {
    $$(".snd").forEach((x) => { x.classList.toggle("on", soundOn); x.setAttribute("aria-pressed", soundOn); });
  }

  /* ================================================================ *
   * Events
   * ================================================================ */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const jumpEl = t.closest("[data-jump]");
    const charEl = t.closest("[data-char]");
    const termEl = t.closest("[data-term]");
    const tapEl = t.closest("[data-tap]");
    const medal = t.closest(".m-medal");
    const enterEl = t.closest("[data-enter]");
    const menuEl = t.closest("[data-menu]");
    const tabEl = t.closest("[data-tab]");
    if (enterEl) { enter(enterEl.dataset.enter === "sound"); return; }
    if (jumpEl) { e.preventDefault(); hidePopover(); jumpTo(jumpEl.dataset.jump); return; }
    if (charEl) { e.preventDefault(); openProfile(charEl.dataset.char); return; }
    if (termEl) {
      e.preventDefault();
      if (popFor === termEl && popPinned) hidePopover();
      else showPopover(termEl, termHTML(termEl.dataset.term), true);
      return;
    }
    if (tapEl) { const st = stages[+tapEl.closest(".chapter").id.slice(3)]; tapBeat(st, +tapEl.dataset.tap); return; }
    if (medal) { showPopover(medal, medalCard(+medal.dataset.chapter), true); sfx("chime"); return; }
    if (menuEl) { openMenu(menuEl.dataset.menu); return; }
    if (tabEl) { showTab(tabEl.dataset.tab); return; }
    if (t.closest("#drawer [data-close]")) { closeDrawer(); return; }
    if (t.closest("#menu [data-close]")) { closeMenu(); return; }
    if (t.closest(".note")) { t.closest(".note").hidden = true; return; }
    const a = t.closest("a[href^='#']");
    if (a && a.getAttribute("href").length > 1) { e.preventDefault(); jumpTo(a.getAttribute("href").slice(1), true); return; }
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
    if (e.key === "Escape") { hidePopover(); if (!drawer.hidden) closeDrawer(); else closeMenu(); stages.forEach(hideNote); return; }
    const k = e.target.closest && e.target.closest(".m-medal, .fig[data-char], .fig[data-term]");
    if (k && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); k.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });

  $$(".snd").forEach((b) => b.addEventListener("click", () => {
    soundOn = !soundOn;
    syncSoundButtons();
    if (soundOn) sfx("tick");
  }));
  $$(".mus").forEach((b) => b.addEventListener("click", () => {
    D.audio.unlock();
    const on = D.audio.setMusic(!D.audio.musicOn);
    $$(".mus").forEach((x) => { x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
  }));

  /* ================================================================ *
   * Start
   * ================================================================ */
  // a laurel wreath symbol for the map medals
  (function wreathSymbol() {
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
    $("#sharedDefs defs").appendChild(sym);
  })();

  prepareInvocation();
  buildHero();
  buildRail();
  buildChapterList();
  buildMap();
  buildGallery();
  D.numbers.build($("#bento"), { goto: jumpTo });
  drawRead();
  onScroll();
  requestAnimationFrame(loop);

  // deep links: #ch-3 (and the older #scroll-3), #numbers, #map
  const hash = location.hash.slice(1);
  const legacy = /^scroll-(\d)$/.exec(hash);
  const target = legacy ? "ch-" + legacy[1] : hash;
  if (target === "map") { skipInvocation(); openMenu("map"); }
  else if (target && document.getElementById(target)) {
    skipInvocation();
    requestAnimationFrame(() => jumpTo(target));
  }
})();
