/* The Iliad: an illustrated, interactive telling
 * "The Iliad in numbers": a set of small infographics.
 *
 * Line counts come from the Greek text in the Perseus Digital Library
 * (tlg0012.tlg001.perseus-grc2). The ships are counted from the Catalogue of
 * Ships in the same Greek text (2.494–759). The day spans are the ones the
 * poem states; the total follows the usual reckoning of its timeline.
 */

window.ILIAD = window.ILIAD || {};

ILIAD.numbers = (function () {
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV"];
  const LINES = [611, 877, 461, 544, 909, 529, 482, 565, 709, 579, 847, 471, 837, 521, 746, 867, 761, 617, 424, 503, 611, 515, 897, 804];
  const TOLD = { 1: 1, 3: 2, 6: 3, 9: 4, 16: 5, 18: 6, 22: 7, 24: 8 }; // book → chapter
  const fmt = (n) => n.toLocaleString("en-US");

  const SHIPS = [
    ["Agamemnon", "Mycenae", 100, "2.576", "agamemnon"],
    ["Nestor", "Pylos", 90, "2.602", null],
    ["Diomedes", "Argos", 80, "2.568", null],
    ["Idomeneus", "Crete", 80, "2.652", null],
    ["Menelaus", "Sparta", 60, "2.587", "menelaus"],
    ["Achilles", "the Myrmidons", 50, "2.685", "achilles"],
    ["Odysseus", "Ithaca", 12, "2.637", "odysseus"],
    ["Ajax", "Salamis", 12, "2.557", null]
  ];
  const SHIP_TOTAL = 1186;

  const DAYS = [
    [10, "The plague", "Apollo’s arrows fall for nine days", "1.53"],
    [1, "The quarrel", "Achilles withdraws", "Book I"],
    [12, "Zeus away", "The gods feast with the Ethiopians", "1.425"],
    [7, "The battles", "Books II–XXIII: four days of fighting, a truce, Patroclus’ funeral", "II–XXIII"],
    [12, "Hector’s body", "Dragged, and kept whole by Apollo", "24.31"],
    [1, "Priam’s night", "The ransom", "Book XXIV"],
    [11, "The funeral", "Nine days of mourning, the pyre, the mound", "24.664–667"]
  ];

  const svgNS = "http://www.w3.org/2000/svg";

  function card(cls, html) {
    const el = document.createElement("article");
    el.className = "viz " + cls;
    el.innerHTML = html;
    return el;
  }
  const source = (t) => `<p class="viz-src">${t}</p>`;

  /* 1. Lines in each book */
  function lines() {
    const told = Object.keys(TOLD).reduce((s, b) => s + LINES[b - 1], 0);
    const total = LINES.reduce((a, b) => a + b, 0);
    const W = 720, H = 230, base = 196, bw = 24, gap = 6, max = 950;
    let bars = "";
    LINES.forEach((n, k) => {
      const b = k + 1, x = 6 + k * (bw + gap), h = (n / max) * 170;
      const on = TOLD[b];
      const tip = `Book ${ROMAN[b]} · ${fmt(n)} lines${on ? ` · told in chapter ${ROMAN[on]}` : ""}`;
      bars += `<g class="bar${on ? " on" : ""}" style="--i:${k}" data-tip="${tip}" tabindex="0" role="img" aria-label="${tip}">
        <rect class="hit" x="${x - 3}" y="0" width="${bw + 6}" height="${H}"/>
        <path class="mark" d="M${x} ${base} V${base - h + 4} Q${x} ${base - h} ${x + 4} ${base - h} H${x + bw - 4} Q${x + bw} ${base - h} ${x + bw} ${base - h + 4} V${base} Z"/>
        <text x="${x + bw / 2}" y="${base + 18}" text-anchor="middle" class="tick${on ? " on" : ""}">${ROMAN[b]}</text></g>`;
    });
    const grid = [250, 500, 750].map((v) => { const y = base - (v / max) * 170; return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" class="grid"/><text x="${W + 34}" y="${y + 3}" text-anchor="end" class="axis">${v}</text>`; }).join("");
    return card("v-lines", `
      <p class="viz-kicker">Length</p>
      <div class="viz-hero"><b class="count" data-to="${total}">${fmt(total)}</b><span>lines of Greek verse, in 24 books</span></div>
      <p class="viz-lede">The eight books told here hold <strong>${fmt(told)}</strong> of them, about a third of the poem.</p>
      <div class="legend"><span><i class="sw on"></i>Told in this telling</span><span><i class="sw"></i>Not told</span></div>
      <svg class="chart" viewBox="0 0 ${W + 36} ${H + 8}" role="group" aria-label="Lines in each of the 24 books">${grid}<line x1="0" x2="${W}" y1="${base}" y2="${base}" class="baseline"/>${bars}</svg>
      <details class="viz-data"><summary>Show the numbers</summary><table><thead><tr><th>Book</th><th>Lines</th></tr></thead><tbody>${LINES.map((n, k) => `<tr><td>${ROMAN[k + 1]}${TOLD[k + 1] ? " ★" : ""}</td><td>${fmt(n)}</td></tr>`).join("")}</tbody></table></details>
      ${source("Lines counted in the Greek text, Perseus Digital Library. ★ marks the books told here.")}`);
  }

  /* 2. The Catalogue of Ships */
  function ships() {
    const cols = 34, r = 3.1, step = 8.4;
    const rows = Math.ceil(SHIP_TOTAL / cols);
    // dots run contingent by contingent, in the order of the list
    const owner = [];
    SHIPS.forEach((s, k) => { for (let i = 0; i < s[2]; i++) owner.push(k); });
    while (owner.length < SHIP_TOTAL) owner.push(-1);
    let dots = "";
    owner.forEach((o, i) => {
      const x = (i % cols) * step + r + 1, y = Math.floor(i / cols) * step + r + 1;
      const cast = o >= 0 && SHIPS[o][4];
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" class="ship-dot${o >= 0 ? " c" + o : ""}${cast ? " cast" : ""}${o >= 0 ? " named" : ""}" style="--i:${Math.floor(i / cols)}"/>`;
    });
    const max = 100;
    const rowsHTML = SHIPS.map(([who, from, n, ref, key], k) => `
      <li class="ship-row${key ? " cast" : ""}" data-c="${k}" tabindex="0" data-tip="${who} of ${from}: ${n} ships (Iliad ${ref})">
        <span class="sr-name">${key ? `<button type="button" class="char-link" data-char="${key}">${who}</button>` : who}<small>${from}</small></span>
        <span class="sr-bar"><i style="--w:${(n / max) * 100}%"></i></span>
        <span class="sr-n">${n}</span>
      </li>`).join("");
    const other = SHIP_TOTAL - SHIPS.reduce((s, x) => s + x[2], 0);
    return card("v-ships", `
      <p class="viz-kicker">The Catalogue of Ships · Book II</p>
      <div class="viz-hero"><b class="count" data-to="${SHIP_TOTAL}">${fmt(SHIP_TOTAL)}</b><span>Achaean ships, from 29 contingents</span></div>
      <p class="viz-lede">Each dot is one ship. The leaders you meet in this story are in gold.</p>
      <svg class="waffle" viewBox="0 0 ${cols * step + 2} ${rows * step + 2}" role="img" aria-label="1,186 dots, one for each ship">${dots}</svg>
      <ol class="ship-list">${rowsHTML}
        <li class="ship-row rest"><span class="sr-name">21 more<small>contingents</small></span><span class="sr-bar"></span><span class="sr-n">${other}</span></li>
      </ol>
      ${source("Counted from the Greek text of the Catalogue, Iliad 2.494–759.")}`);
  }

  /* 3. The gods take sides */
  function gods() {
    const A = [["Hera", "hera"], ["Athena", "athena"], ["Poseidon"], ["Hermes"], ["Hephaestus"]];
    const T = [["Ares"], ["Apollo", "apollo"], ["Artemis"], ["Leto"], ["Xanthos", null, "the river god"], ["Aphrodite", "aphrodite"]];
    const li = ([n, key, note]) => `<li>${key ? `<button type="button" class="char-link" data-char="${key}">${n}</button>` : n}${note ? ` <small>${note}</small>` : ""}</li>`;
    return card("v-gods", `
      <p class="viz-kicker">Book XX</p>
      <h3 class="viz-title">The gods take sides</h3>
      <div class="sides">
        <div class="side a"><p class="side-h"><i></i>With the Achaeans <b>${A.length}</b></p><ul>${A.map(li).join("")}</ul></div>
        <div class="side t"><p class="side-h"><i></i>With the Trojans <b>${T.length}</b></p><ul>${T.map(li).join("")}</ul></div>
      </div>
      <div class="tug" aria-hidden="true"><span class="a" style="--n:${A.length}"></span><span class="t" style="--n:${T.length}"></span></div>
      <p class="viz-note"><button type="button" class="char-link" data-char="zeus">Zeus</button> stays apart: “I shall stay here seated on Mount Olympus and look on in peace…”</p>
      ${source("Iliad 20.22–23 and 20.31–40.")}`);
  }

  /* 4. A chain of deaths */
  function chain() {
    const N = [
      ["Sarpedon", null, "Son of Zeus, Trojan ally", "XVI"],
      ["Patroclus", "patroclus", "Achilles’ dearest friend", "XVI"],
      ["Hector", "hector", "Prince of Troy", "XXII"],
      ["Achilles", "achilles", "Best of the Achaeans", "after the poem"]
    ];
    const by = ["killed by", "killed by", "killed by", "will be killed by"];
    const nodes = N.map(([n, key, d, b], k) => `
      <li class="node" style="--i:${k}">
        <span class="node-dot" aria-hidden="true"></span>
        <span class="node-name">${key ? `<button type="button" class="char-link" data-char="${key}">${n}</button>` : n}</span>
        <span class="node-d">${d}</span><span class="node-b">${b === "after the poem" ? "after the poem" : "Book " + b}</span>
        <span class="edge">${by[k]}</span>
      </li>`).join("");
    return card("v-chain", `
      <p class="viz-kicker">Fate</p>
      <h3 class="viz-title">Each death sets up the next</h3>
      <ol class="chain">${nodes}
        <li class="node end" style="--i:4"><span class="node-dot" aria-hidden="true"></span><span class="node-name"><button type="button" class="char-link" data-char="paris">Paris</button> &amp; <button type="button" class="char-link" data-char="apollo">Apollo</button></span><span class="node-d">foretold by the dying Hector</span><span class="node-b">22.359–360</span></li>
      </ol>
      ${source("Iliad, Books XVI and XXII.")}`);
  }

  /* 5. The days of the poem */
  function days() {
    const total = DAYS.reduce((s, d) => s + d[0], 0);
    let acc = 0;
    const segs = DAYS.map(([n, t, d, ref], k) => {
      const left = (acc / total) * 100;
      acc += n;
      return `<li class="seg s${k}" style="--l:${left}%;--w:${(n / total) * 100}%;--i:${k}" tabindex="0" data-tip="${t}: ${n === 1 ? "one day" : (k === 3 ? "about " : "") + n + " days"} (${ref})">
        <span class="seg-bar"></span>
        <span class="seg-label"><b>${k === 3 ? "≈" : ""}${n}</b> ${t}<small>${d}</small></span>
      </li>`;
    }).join("");
    return card("v-days", `
      <p class="viz-kicker">Time</p>
      <div class="viz-hero"><b>≈ 50</b><span>days of a ten-year war</span></div>
      <p class="viz-lede">The Iliad tells a few weeks in the tenth year. Most of the poem, Books II to XXIII, happens in about a week; the long waits sit at either end.</p>
      <ol class="days">${segs}</ol>
      <div class="days-axis" aria-hidden="true"><span>Day 1</span><span>about day 50</span></div>
      ${source("The spans are those the poem states (1.53, 1.425, 24.31, 24.664–667); the total follows the usual count of the poem’s days.")}`);
  }

  /* 6. Who appears where, in this telling */
  function matrix() {
    const D = ILIAD;
    const CH = D.chapters;
    const extra = { 0: ["paris", "helen", "hera", "athena", "aphrodite", "agamemnon", "menelaus"], 9: ["achilles", "paris", "apollo", "odysseus", "priam", "andromache"] };
    const order = ["achaean", "trojan", "olympian"];
    const keys = Object.keys(D.characters).sort((a, b) => order.indexOf(D.characters[a].side) - order.indexOf(D.characters[b].side));
    const head = CH.map((c, i) => `<th scope="col"><button type="button" data-jump="ch-${i}" title="${c.title}">${i === 0 ? "Α" : i === CH.length - 1 ? "Ω" : ROMAN[i]}</button></th>`).join("");
    const rows = keys.map((k, r) => {
      const c = D.characters[k];
      const inCh = new Set(c.moments.map((m) => m[0]));
      Object.entries(extra).forEach(([i, list]) => { if (list.includes(k)) inCh.add(+i); });
      return `<tr class="side-${c.side}"><th scope="row"><button type="button" class="char-link" data-char="${k}">${c.name}</button></th>${CH.map((ch, i) => `<td>${inCh.has(i) ? `<button type="button" class="cell on" style="--i:${r}" data-jump="ch-${i}" data-tip="${c.name} · ${ch.title}" aria-label="${c.name} in ${ch.title}"></button>` : `<span class="cell"></span>`}</td>`).join("")}</tr>`;
    }).join("");
    return card("v-matrix", `
      <p class="viz-kicker">The cast</p>
      <h3 class="viz-title">Who appears where, in this telling</h3>
      <div class="legend"><span><i class="sw side-achaean"></i>Achaeans</span><span><i class="sw side-trojan"></i>Trojans</span><span><i class="sw side-olympian"></i>Gods</span></div>
      <div class="matrix-wrap"><table class="matrix"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      ${source("Columns: Α prologue, I–VIII the eight books, Ω epilogue. Touch a dot to go there.")}`);
  }

  /* 7. The rhythm of a line */
  function meter() {
    // Iliad 1.1, scanned: — ∪ ∪ | — ∪ ∪ | — — | — ∪ ∪ | — ∪ ∪ | — —
    const feet = [[["μῆ", 1], ["νιν", 0], ["ἄ", 0]], [["ει", 1], ["δε", 0], ["θε", 0]], [["ὰ", 1], ["Πη", 1]], [["λη", 1], ["ϊ", 0], ["ά", 0]], [["δεω", 1], ["Ἀ", 0], ["χι", 0]], [["λῆ", 1], ["ος", 1]]];
    let k = 0;
    const html = feet.map((f, i) => `<span class="foot" style="--f:${i}">${f.map(([s, long]) => `<span class="syl ${long ? "long" : "short"}" data-k="${k++}"><i aria-hidden="true">${long ? "—" : "∪"}</i><b lang="grc">${s}</b></span>`).join("")}</span>`).join("");
    return card("v-meter", `
      <p class="viz-kicker">Rhythm</p>
      <h3 class="viz-title">Six beats to a line</h3>
      <p class="viz-lede">Every line is a dactylic hexameter: six feet, each a long syllable followed by two short ones or by one more long.</p>
      <div class="meter" aria-label="Iliad 1.1 scanned into six feet">${html}</div>
      <button type="button" class="play-meter"><span class="pm-ico" aria-hidden="true"></span>Hear the rhythm</button>
      ${source("Iliad 1.1: “Sing, O goddess, the anger of Achilles son of Peleus.”")}`);
  }

  function playMeter(btn) {
    const syls = Array.from(btn.closest(".viz").querySelectorAll(".syl"));
    const unit = 210;
    let t = 0;
    ILIAD.audio.unlock();
    syls.forEach((s) => {
      const long = s.classList.contains("long");
      setTimeout(() => {
        syls.forEach((x) => x.classList.remove("beat"));
        s.classList.add("beat");
        ILIAD.audio.sfx(long ? "long" : "short");
      }, t);
      t += long ? unit * 2 : unit;
    });
    setTimeout(() => syls.forEach((x) => x.classList.remove("beat")), t + 200);
  }

  function countUp(el) {
    const to = +el.dataset.to;
    if (!to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function build(root) {
    [lines(), ships(), gods(), chain(), days(), matrix(), meter()].forEach((c) => root.appendChild(c));

    // reveal each card as it scrolls into view
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll(".count").forEach(countUp);
      io.unobserve(e.target);
    }), { threshold: 0.2 });
    root.querySelectorAll(".viz").forEach((c) => io.observe(c));

    // one tooltip for every mark
    const tip = document.createElement("div");
    tip.className = "viz-tip";
    tip.hidden = true;
    document.body.appendChild(tip);
    const showTip = (el) => {
      tip.textContent = el.dataset.tip;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
      tip.style.top = (r.top - h - 10 < 60 ? r.bottom + 10 : r.top - h - 10) + "px";
    };
    root.addEventListener("pointerover", (e) => { const el = e.target.closest("[data-tip]"); if (el) showTip(el); });
    root.addEventListener("pointerout", (e) => { const el = e.target.closest("[data-tip]"); if (el && !el.contains(e.relatedTarget)) tip.hidden = true; });
    root.addEventListener("focusin", (e) => { const el = e.target.closest("[data-tip]"); if (el) showTip(el); });
    root.addEventListener("focusout", () => { tip.hidden = true; });
    window.addEventListener("scroll", () => { tip.hidden = true; }, { passive: true });

    // hovering a contingent lights its ships
    const waffle = root.querySelector(".waffle");
    root.querySelectorAll(".ship-row[data-c]").forEach((row) => {
      const on = () => { waffle.classList.add("focus"); waffle.querySelectorAll(".c" + row.dataset.c).forEach((d) => d.classList.add("hl")); };
      const off = () => { waffle.classList.remove("focus"); waffle.querySelectorAll(".hl").forEach((d) => d.classList.remove("hl")); };
      row.addEventListener("pointerenter", on);
      row.addEventListener("pointerleave", off);
      row.addEventListener("focus", on);
      row.addEventListener("blur", off);
    });

    root.querySelector(".play-meter").addEventListener("click", (e) => playMeter(e.currentTarget));
  }

  return { build };
})();
