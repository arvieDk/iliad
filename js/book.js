/* The Iliad: an interactive book
 * Renders the pages and drives the page-turning book.
 */

(function () {
  "use strict";

  const D = window.ILIAD;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const SIDES = {
    achaean: "Achaean",
    trojan: "Trojan",
    olympian: "Olympian"
  };

  /* Draw the laurel wreath symbol: leaves set along two arcs */
  (function drawWreath() {
    const sym = document.getElementById("wreath");
    if (!sym) return;
    const cx = 100, cy = 58, r = 50;
    const deg = Math.PI / 180;
    const f = (n) => n.toFixed(1);
    let out = "";
    [1, -1].forEach((side) => {
      // side 1 is the right branch, -1 the left; both grow upward from the bottom
      const pt = (a) => [cx - side * r * Math.cos(a * deg), cy + r * Math.sin(a * deg)];
      const pts = [];
      for (let a = 96; a <= 234; a += 3) pts.push(pt(a));
      out += `<path d="M${pts.map((p) => f(p[0]) + " " + f(p[1])).join(" L")}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`;
      for (let a = 104, k = 0; a <= 228; a += 9, k++) {
        const [x, y] = pt(a);
        // direction of growth along the arc
        const tx = side * r * Math.sin(a * deg), ty = r * Math.cos(a * deg);
        const ang = Math.atan2(ty, tx) / deg;
        const len = 9.5 - (a - 104) / 34;
        [38, -38].forEach((tilt) => {
          out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(len)}" ry="${f(len * 0.38)}" transform="rotate(${f(ang + tilt)} ${f(x)} ${f(y)}) translate(${f(len * 0.85)} 0)" fill="currentColor"/>`;
        });
      }
      const [ex, ey] = pt(236);
      const ta = Math.atan2(r * Math.cos(236 * deg), side * r * Math.sin(236 * deg)) / deg;
      out += `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="6" ry="2.4" transform="rotate(${f(ta)} ${f(ex)} ${f(ey)}) translate(4 0)" fill="currentColor"/>`;
    });
    // ribbon tie at the bottom
    out += `<path d="M93 104 Q100 99 107 104 L113 117 L104 111 L100 116 L96 111 L87 117 Z" fill="currentColor"/>`;
    sym.innerHTML = out;
  })();

  /* Where each chapter begins (index in ILIAD.pages) */
  const chapterStart = {};
  D.pages.forEach((p, i) => {
    if (p.type === "opener") chapterStart[p.ch] = i;
  });
  const specialPage = {
    contents: D.pages.findIndex((p) => p.type === "contents"),
    cast: D.pages.findIndex((p) => p.type === "personae"),
    map: D.pages.findIndex((p) => p.type === "map"),
    sources: D.pages.findIndex((p) => p.type === "sources")
  };

  /* ================================================================ *
   * Text markup
   * ================================================================ */
  function rich(html) {
    return html
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, a, b) => {
        let key, text;
        if (b) { key = a; text = b; } else { key = D.aliases[a]; text = a; }
        if (!key || !D.characters[key]) return text;
        return `<button type="button" class="char char-${D.characters[key].side}" data-char="${key}">${text}</button>`;
      })
      .replace(/\{\{([^}|]+)\|([^}]+)\}\}/g, (m, key, text) => {
        if (!D.glossary[key]) return text;
        return `<button type="button" class="term" data-term="${key}">${text}</button>`;
      });
  }

  function citeText(ref) {
    return `<span class="cite-ref">Iliad ${ref}</span> <span class="cite-src">${D.source.short}</span>`;
  }

  function ornament(kind = "rule") {
    if (kind === "rule") {
      return `<div class="orn-rule" aria-hidden="true"><span></span><svg viewBox="0 0 40 40"><use href="#rosette"/></svg><span></span></div>`;
    }
    if (kind === "wreath") {
      return `<svg class="orn-wreath" viewBox="0 0 200 120" aria-hidden="true"><use href="#wreath"/></svg>`;
    }
    return "";
  }

  function medallion(key, size = "") {
    const c = D.characters[key];
    return `<span class="medallion med-${c.side} ${size}" aria-hidden="true"><span>${c.initial}</span></span>`;
  }

  function chapterOf(i) {
    const p = D.pages[i];
    return p && p.ch ? D.chapters[p.ch - 1] : null;
  }

  /* ================================================================ *
   * Page renderers
   * ================================================================ */
  const R = {};

  R.cover = () => `
    <div class="cover-frame">
      <div class="cover-inner">
        <p class="cover-kicker">ΟΜΗΡΟΥ</p>
        <h1 class="cover-title">ΙΛΙΑΣ</h1>
        <div class="cover-emblem">
          <svg class="cover-wreath" viewBox="0 0 200 120"><use href="#wreath"/></svg>
          <svg class="cover-helm" viewBox="0 0 100 100"><use href="#helmet"/></svg>
        </div>
        <p class="cover-sub">The Iliad of Homer</p>
        <p class="cover-tag">The Wrath of Achilles<br>in Eight Scrolls</p>
        <p class="cover-hint"><span>Tap to open</span></p>
      </div>
    </div>`;

  R.backcover = () => `
    <div class="cover-frame">
      <div class="cover-inner back">
        <svg class="back-amphora" viewBox="0 0 60 100" aria-hidden="true"><use href="#amphora"/></svg>
        <p class="back-quote" lang="grc">μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος<br><span lang="en">“Sing, goddess, the wrath of Achilles, son of Peleus.” The first line of the Iliad, sung for nearly three thousand years.</span></p>
        <p class="cover-kicker">ΤΕΛΟΣ</p>
        <button type="button" class="btn-gold" data-goto="0">Return to the beginning</button>
      </div>
    </div>`;

  R.endpaper = () => `<div class="endpaper-pattern" aria-hidden="true"></div>`;

  R.title = () => `
    <div class="title-page">
      <p class="small-caps">Here begins</p>
      <h1 class="tp-title">The Iliad</h1>
      <p class="tp-of">of</p>
      <h2 class="tp-homer">Homer</h2>
      ${ornament("wreath")}
      <p class="tp-sub">The Wrath of Achilles, told in eight scrolls, with passages from the translation of</p>
      <p class="tp-trans">Samuel Butler</p>
      <p class="tp-note">as revised by Timothy Power &amp; Gregory Nagy</p>
      <div class="tp-foot">
        <span class="meander-band"></span>
        <p>Ilion · the ninth year of the war</p>
      </div>
    </div>`;

  R.proem = () => `
    <div class="proem">
      <p class="small-caps center">The Invocation</p>
      ${ornament("rule")}
      <blockquote class="ex proem-text"><p><span class="dropcap-letter">S</span>ing, O goddess, the anger of [[Achilles]] son of Peleus, that brought countless ills upon the {{achaeans|Achaeans}}. Many a brave soul did it send hurrying down to {{hades|Hades}}, and many a hero did it yield a prey to dogs and vultures, for so was the will of [[Zeus]] fulfilled from the day on which the {{atreus|son of Atreus}}, king of men, and great Achilles, first fell out with one another.</p>
      <cite>${citeText("1.1–7")}</cite></blockquote>
      <p class="proem-note">The first word of the poem in Greek is <button type="button" class="term" data-term="menis"><em>mênis</em></button>, “wrath.” Everything that follows grows from it.</p>
    </div>`;

  R.contents = () => `
    <h2 class="page-title">Contents</h2>
    ${ornament("rule")}
    <ol class="toc">
      ${D.chapters.map((c) => `
        <li><button type="button" data-goto="${chapterStart[c.n]}">
          <span class="toc-num">${ROMAN[c.n]}</span>
          <span class="toc-title">${c.title}<small>${c.blurb}</small></span>
          <span class="toc-page">${chapterStart[c.n]}</span>
        </button></li>`).join("")}
    </ol>
    <div class="toc-extra">
      <button type="button" data-goto="${specialPage.cast}">Dramatis Personae</button>
      <button type="button" data-goto="${specialPage.map}">Map of the Troad</button>
      <button type="button" data-goto="${specialPage.sources}">Sources</button>
    </div>`;

  R.personae = (p) => {
    const mortal = p.side === "mortal";
    const groups = mortal
      ? [["achaean", "The Achaeans"], ["trojan", "The Trojans"]]
      : [["olympian", "The Gods of Olympus"]];
    const body = groups.map(([side, label]) => {
      const keys = Object.keys(D.characters).filter((k) => D.characters[k].side === side);
      return `
        <h3 class="cast-head">${label}</h3>
        <ul class="cast-grid ${side}">
          ${keys.map((k) => `<li><button type="button" class="cast-card" data-char="${k}">
            ${medallion(k)}
            <span class="cast-name">${D.characters[k].name}<small>${D.characters[k].epithet.split(",")[0]}</small></span>
          </button></li>`).join("")}
        </ul>`;
    }).join("");
    return `
      <h2 class="page-title">${mortal ? "Dramatis Personae" : "The Immortals"}</h2>
      ${ornament("rule")}
      ${body}
      ${mortal ? "" : `
      <div class="how-to">
        <h3 class="cast-head">How to read this book</h3>
        <ul>
          <li><span class="char char-achaean demo">Names</span> open a profile of that hero or god.</li>
          <li><span class="term demo">Dotted words</span> explain themselves when you hover or tap.</li>
          <li>Turn pages with the arrows, the arrow keys, a swipe, or a tap on the page edge.</li>
        </ul>
      </div>`}`;
  };

  R.map = () => {
    const pins = D.places.map((pl) => `
      <g class="pin" tabindex="0" role="button" data-place="${pl.id}" aria-label="${pl.name}" transform="translate(${pl.x} ${pl.y})">
        <circle class="pin-halo" r="20"/>
        <circle class="pin-dot" r="8"/>
        <text class="pin-label" y="${pl.ly || -16}" text-anchor="middle">${pl.name.replace(/ \(.*\)/, "")}</text>
      </g>`).join("");
    return `
      <h2 class="page-title">The Troad</h2>
      <p class="map-sub">Tap a place to learn its part in the story</p>
      <svg class="map" viewBox="0 0 600 720" role="img" aria-label="Map of Troy and its plain">
        <defs>
          <pattern id="waves" width="40" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 8 Q10 2 20 8 T40 8" fill="none" stroke="#6f8796" stroke-width="1.2" opacity=".55"/>
          </pattern>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#8a6a3a" stroke-width="1" opacity=".35"/>
          </pattern>
        </defs>
        <rect x="-400" y="-400" width="1400" height="1520" fill="#c9d3cf"/>
        <rect x="-400" y="-400" width="1400" height="1520" fill="url(#waves)"/>
        <!-- land -->
        <path class="land" d="M1000 140 L600 150 C540 140 500 160 450 150 C400 140 360 150 320 160 C270 170 230 165 190 175 C150 185 120 200 92 218 C74 230 82 260 94 290 C106 330 98 380 88 420 C80 470 92 530 84 590 C80 640 90 690 96 720 C100 800 96 900 100 1120 L1000 1120 Z"/>
        <!-- across the strait -->
        <path class="land far" d="M300 -400 L300 0 C330 20 380 30 430 28 C480 26 540 40 600 50 L1000 62 L1000 -400 Z"/>
        <path class="land far" d="M-400 -400 L210 -400 L210 0 C190 20 150 40 100 52 C60 60 20 80 0 96 L-400 130 Z"/>
        <!-- Tenedos -->
        <path class="land" d="M30 520 C40 500 70 498 78 512 C86 528 70 548 50 548 C34 548 24 534 30 520 Z"/>
        <!-- mountains (Ida) -->
        <g class="mount" transform="translate(470 560)">
          <path d="M0 80 L40 0 L80 80 Z"/><path d="M50 80 L85 20 L120 80 Z"/><path d="M-30 80 L0 34 L30 80 Z"/>
        </g>
        <!-- rivers -->
        <path class="river" d="M540 700 C500 640 430 600 380 560 C340 530 300 500 268 450 C240 400 250 360 236 310 C222 260 220 220 200 178"/>
        <path class="river" d="M600 330 C560 320 520 310 480 300 C420 286 360 300 300 330 C270 345 250 330 240 318"/>
        <!-- plain -->
        <ellipse cx="290" cy="320" rx="120" ry="70" fill="url(#hatch)"/>
        <!-- Troy -->
        <g class="city" transform="translate(412 440)">
          <circle r="34" class="city-hill"/>
          <path d="M-22 10 L-22 -8 L-14 -14 L-14 -22 L-6 -22 L-6 -14 L6 -14 L6 -22 L14 -22 L14 -14 L22 -8 L22 10 Z" class="city-wall"/>
        </g>
        <!-- ships -->
        <g class="ships">
          ${[[150, 196], [176, 186], [204, 180], [232, 176], [260, 172], [288, 168], [316, 164], [120, 210]].map(([x, y]) =>
            `<path d="M${x - 12} ${y} q12 8 24 0 l-3 -4 h-18 z M${x} ${y - 4} v-12 l7 8 z"/>`).join("")}
        </g>
        <text class="sea-label" x="40" y="380" transform="rotate(-90 40 380)">AEGEAN SEA</text>
        <text class="region-label" x="500" y="40">THRACE</text>
        <!-- compass -->
        <g class="compass" transform="translate(545 230)">
          <circle r="22"/><path d="M0 -18 L6 0 L0 18 L-6 0 Z"/><text y="-26" text-anchor="middle">N</text>
        </g>
        ${pins}
      </svg>`;
  };

  R.prologue = () => `
    <h2 class="page-title">Before the Tale</h2>
    ${ornament("rule")}
    <p class="dropcap">At the wedding of Peleus and the sea-goddess [[Thetis]], the parents of [[Achilles]], the goddess Strife threw down a golden apple marked <em>for the fairest</em>. [[Hera]], [[Athena]], and [[Aphrodite]] each claimed it, and the Trojan prince [[Paris]] was made their judge. He chose Aphrodite, who promised him the most beautiful woman in the world.</p>
    <p>That woman was [[Helen]], wife of [[Menelaos|Menelaus]], king of {{lacedaemon|Lacedaemon}}. Paris carried her off to Troy, and Menelaus’ brother [[Agamemnon]] gathered the kings of Greece and a thousand ships to bring her back.</p>
    <p>For nine years the {{achaeans|Achaeans}} have besieged {{ilion|Ilion}}. The poem tells of only a few weeks in the tenth year: the quarrel, the wrath, and what it cost.</p>`;

  R.opener = (p) => {
    const c = D.chapters[p.ch - 1];
    return `
      <header class="opener-head">
        <span class="meander-band"></span>
        <p class="opener-greek">ΡΑΨΩΙΔΙΑ ${c.greek}</p>
        <p class="opener-num">Scroll ${ROMAN[c.n]}</p>
        <h2 class="opener-title">${c.title}</h2>
        <p class="opener-book">from Book ${c.book} of the Iliad</p>
      </header>
      <div class="prose">${rich(p.html)}</div>`;
  };

  R.text = (p) => `<div class="prose">${rich(p.html)}</div>`;

  R.shield = () => {
    const rings = [
      ["rim", 228, "Okeanos", "18.607–608", "Around the very rim of the shield runs the mighty river Okeanos, the stream that encircles the whole world."],
      ["dance", 200, "The Dancing Floor", "18.590–606", "A dancing floor like the one Daedalus once built for Ariadne. Youths and maidens dance hand in hand, the girls in fine linen, the young men with golden daggers, while a minstrel sings and tumblers whirl among them."],
      ["herds", 168, "Herds and Lions", "18.573–589", "Cattle of gold and tin hurry lowing to pasture by a rushing river. Two lions seize a bull, and the herdsmen and their dogs cannot drive them off. Beyond lies a broad pasture of white sheep, with folds and huts."],
      ["fields", 134, "Field, Harvest, and Vineyard", "18.541–572", "Ploughmen turn the soft earth, darkening behind them though it is made of gold. Reapers cut the grain on a king’s estate while a feast is made ready. In a vineyard heavy with grapes, young people carry the fruit in baskets as a boy plays the lyre."],
      ["cities", 98, "Two Cities of Men", "18.490–540", "In one city there are weddings and torch-lit dancing, and elders sitting in judgment over the blood-price for a slain man. The other city is under siege; its people lay an ambush by a river, and the battle that follows is fought among Strife, Panic, and Fate."],
      ["cosmos", 58, "Earth, Sky, and Sea", "18.483–489", "At the center Hephaestus set the earth, the heavens, and the sea, the untiring sun and the full moon, and the constellations: the Pleiades, the Hyades, mighty Orion, and the Bear that never bathes in Ocean."]
    ];
    const svgRings = rings.map(([id, r, name]) => `
      <circle class="ring ring-${id}" data-ring="${id}" r="${r}" tabindex="0" role="button" aria-label="${name}"/>`).join("");
    return `
      <h2 class="page-title">The Shield of Achilles</h2>
      <p class="map-sub">Tap a ring of the shield</p>
      <div class="shield-wrap">
        <svg class="shield" viewBox="-240 -240 480 480" aria-label="The shield of Achilles">
          <defs>
            <radialGradient id="bronze" cx="40%" cy="35%" r="75%">
              <stop offset="0" stop-color="#f6dfa0"/><stop offset=".55" stop-color="#c79a45"/><stop offset="1" stop-color="#7a5521"/>
            </radialGradient>
          </defs>
          <circle r="236" fill="#4a3112"/>
          ${svgRings}
          <g class="shield-art" pointer-events="none">
            <!-- cosmos: sun, moon, stars -->
            <circle r="16" cx="-18" cy="-6" fill="#fff3c4" opacity=".9"/>
            <path d="M22 -18 a16 16 0 1 0 0 28 a12 12 0 1 1 0 -28z" fill="#f3e6c0" opacity=".9"/>
            ${[[-34, 30], [-10, 34], [14, 30], [34, 18], [-40, -30], [6, -40], [36, -34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff8dd"/>`).join("")}
            <!-- dancers on the dance ring -->
            ${Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2;
              const x = Math.cos(a) * 184, y = Math.sin(a) * 184;
              return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 180 / Math.PI + 90).toFixed(1)})"><circle r="3.4" cy="-8" fill="#3d2a0e"/><path d="M0 -4 L-6 10 H6 Z" fill="#3d2a0e"/></g>`;
            }).join("")}
            <!-- waves on the rim -->
            ${Array.from({ length: 36 }, (_, i) => {
              const a = (i / 36) * 360;
              return `<path transform="rotate(${a}) translate(0 -214)" d="M-9 0 q4.5 -7 9 0 q4.5 7 9 0" fill="none" stroke="#2b4a5a" stroke-width="2.4"/>`;
            }).join("")}
            <!-- fields: furrows -->
            ${Array.from({ length: 18 }, (_, i) => `<path transform="rotate(${i * 20})" d="M0 -104 V-128" stroke="#5a3d12" stroke-width="3"/>`).join("")}
            <!-- herds -->
            ${Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30 + 15}) translate(0 -151)"><ellipse rx="8" ry="4.5" fill="#4a3212"/><circle cx="8" cy="-2" r="3" fill="#4a3212"/></g>`).join("")}
            <!-- cities: two little towers -->
            <g transform="translate(-76 0)" fill="#4a3212"><path d="M-12 10 V-6 h6 v-6 h4 v6 h4 v-6 h4 v6 h6 V10 Z"/></g>
            <g transform="translate(76 0)" fill="#4a3212"><path d="M-12 10 V-6 h6 v-6 h4 v6 h4 v-6 h4 v6 h6 V10 Z"/></g>
          </g>
        </svg>
      </div>
      <div class="shield-info" aria-live="polite">
        <h3>Five layers of bronze, tin, silver, and gold</h3>
        <p>Each ring shows a part of the world at peace and at war. ${citeText("18.478–608")}</p>
      </div>
      <template class="shield-data">${JSON.stringify(rings.map(([id, , name, ref, text]) => ({ id, name, ref, text })))}</template>`;
  };

  R.afterword = () => `
    <h2 class="page-title">After the Iliad</h2>
    ${ornament("rule")}
    <p class="dropcap">The Iliad ends with a funeral, not with the fall of Troy. The rest of the story was told in other poems, now mostly lost, and retold by later writers.</p>
    <p>Not long after Hector’s death, [[Achilles]] is struck in the heel by an arrow of [[Paris]], guided by [[Apollo]], just as Hector foretold. [[Odysseus]] devises the wooden horse; the Achaeans hide inside it, and Troy is taken by night. [[Priam]] is slain at his altar, and [[Andromache]] is led away as a captive. [[Helen]] goes home with [[Menelaos|Menelaus]].</p>
    <p>Odysseus’ long journey home is the subject of the <em>Odyssey</em>. The flight of the Trojan Aeneas from the burning city became Virgil’s <em>Aeneid</em>.</p>
    <div class="facts">
      <div><strong>24</strong><span>books</span></div>
      <div><strong>~15,700</strong><span>lines of verse</span></div>
      <div><strong>8th c.</strong><span>BCE, composed</span></div>
    </div>`;

  R.sources = () => `
    <h2 class="page-title">Sources</h2>
    ${ornament("rule")}
    <p>Every passage set in italics in this book is quoted word for word from:</p>
    <p class="source-full">${D.source.full}</p>
    <p>The digital text is published under a <a href="${D.source.licenseUrl}" target="_blank" rel="noopener">${D.source.license}</a> license. <a href="${D.source.url}" target="_blank" rel="noopener">View the source text on GitHub.</a> The bracketed Greek glosses of the Perseus edition are omitted, and cuts are marked with an ellipsis (…). Line numbers follow the Greek text.</p>
    <p>The connecting narrative, character profiles, glossary, and map notes are original summaries written for this book.</p>
    ${ornament("rule")}
    <p class="colophon">Set in Cinzel and EB Garamond. Ornaments drawn in SVG after the meanders and laurels of Greek vase painting.</p>`;

  /* ================================================================ *
   * Building a page
   * ================================================================ */
  function pageEl(i) {
    const p = D.pages[i];
    const el = document.createElement("section");
    el.className = `page pg-${p.type}`;
    el.dataset.index = i;
    const isCover = p.type === "cover" || p.type === "backcover";
    const isPlain = isCover || p.type === "endpaper";
    let inner = (R[p.type] || R.text)(p);
    if (["opener", "text"].includes(p.type) === false) inner = rich(inner);
    const ch = chapterOf(i);
    const head = (p.type === "text" || p.type === "shield") && ch
      ? `<header class="running-head"><span>Scroll ${ROMAN[ch.n]}</span><span>${ch.title}</span></header>` : "";
    el.innerHTML = isPlain
      ? inner
      : `<div class="page-frame">${head}<div class="page-body">${inner}</div><footer class="folio-foot"><span>${i}</span></footer></div>`;
    $$("cite[data-ref]", el).forEach((c) => { c.innerHTML = citeText(c.dataset.ref); });
    return el;
  }

  const pageCache = {};
  function getPage(i) {
    // pages are rebuilt when the layout changes, so make fresh nodes each time
    pageCache[i] = pageEl(i);
    return pageCache[i];
  }

  /* ================================================================ *
   * The book
   * ================================================================ */
  const book = $("#book");
  const stage = $("#stage");
  const folio = $("#folio");
  let mode = null;       // "spread" | "single"
  let list = [];         // page indexes shown in this mode
  let leaves = [];       // DOM leaves
  let pos = 0;           // number of turned leaves
  let busyUntil = 0;
  let soundOn = true;
  const FLIP_MS = 900;

  function decideMode() {
    const W = window.innerWidth, H = window.innerHeight;
    return W >= 860 && W / H > 1.05 ? "spread" : "single";
  }

  function layout() {
    const W = window.innerWidth;
    const tb = $("#toolbar").offsetHeight || 60;
    const H = window.innerHeight - tb;
    const RATIO = 0.7; // page width : height
    let pw, ph;
    if (mode === "spread") {
      pw = Math.min((W - 64) / 2, (H - 40) * RATIO, 640);
      ph = pw / RATIO;
    } else if (H < 520) {
      // phones held sideways: a wide, short page that scrolls if it must
      pw = Math.min(W - 24, 680);
      ph = H - 16;
    } else {
      pw = Math.min(W - 20, (H - 20) * RATIO, 560);
      ph = Math.min(pw / 0.6, H - 20); // phones get a taller page
      ph = Math.max(ph, pw / RATIO);
    }
    pw = Math.floor(pw);
    ph = Math.floor(ph);
    document.documentElement.style.setProperty("--pw", pw + "px");
    document.documentElement.style.setProperty("--tb-h", tb + 16 + "px");
    document.documentElement.style.setProperty("--ph", ph + "px");
    const fs = mode === "single" && H < 520 ? 14 : Math.max(13.5, pw * 0.0395);
    document.documentElement.style.setProperty("--fs", fs.toFixed(2) + "px");
  }

  /* Which page (index in ILIAD.pages) is the reader looking at? */
  function currentPage() {
    if (mode === "single") return list[Math.min(pos, list.length - 1)];
    const right = list[pos * 2];
    const left = list[pos * 2 - 1];
    return right !== undefined ? right : left;
  }

  function posForPage(i) {
    if (mode === "single") {
      let k = list.indexOf(i);
      if (k < 0) k = list.findIndex((x) => x > i);
      return Math.max(0, k);
    }
    // in a spread, an even page is on the right (front of leaf i/2)
    return i % 2 === 0 ? i / 2 : (i + 1) / 2;
  }

  function build(keepPage) {
    mode = decideMode();
    document.body.dataset.mode = mode;
    layout();
    list = D.pages.map((p, i) => i).filter((i) => mode === "spread" || !D.pages[i].desktopOnly);
    book.innerHTML = "";
    leaves = [];
    const n = mode === "spread" ? Math.ceil(list.length / 2) : list.length;
    for (let k = 0; k < n; k++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      const front = document.createElement("div");
      front.className = "face front";
      const back = document.createElement("div");
      back.className = "face back";
      if (mode === "spread") {
        front.appendChild(getPage(list[2 * k]));
        if (list[2 * k + 1] !== undefined) back.appendChild(getPage(list[2 * k + 1]));
      } else {
        front.appendChild(getPage(list[k]));
        back.innerHTML = `<section class="page pg-verso"></section>`;
      }
      const t = D.pages[list[mode === "spread" ? 2 * k : k]].type;
      if (k === 0 || t === "backcover" || (mode === "spread" && k === n - 1)) leaf.classList.add("hard");
      leaf.appendChild(front);
      leaf.appendChild(back);
      leaf.dataset.k = k;
      book.appendChild(leaf);
      leaves.push(leaf);
    }
    pos = Math.min(posForPage(keepPage || 0), leaves.length - (mode === "single" ? 1 : 0));
    leaves.forEach((l, k) => l.classList.toggle("flipped", k < pos));
    restack();
    bookState();
    initShields();
  }

  function restack() {
    const n = leaves.length;
    leaves.forEach((l, k) => {
      l.style.zIndex = k < pos ? k + 1 : n * 2 - k;
    });
  }

  function bookState() {
    const closedFront = pos === 0;
    const closedBack = mode === "spread" ? pos >= leaves.length : false;
    book.classList.toggle("closed-front", closedFront);
    book.classList.toggle("closed-back", closedBack);
    const cur = currentPage();
    folio.textContent = labelFor(cur);
    $("#prevBtn").disabled = pos === 0;
    $("#nextBtn").disabled = mode === "spread" ? pos >= leaves.length : pos >= leaves.length - 1;
    // keep hidden pages out of the tab order
    leaves.forEach((l, k) => {
      const visFront = k === pos;
      const visBack = mode === "spread" && k === pos - 1;
      l.querySelector(".front").inert = !visFront;
      l.querySelector(".back").inert = !visBack;
    });
    try { history.replaceState(null, "", cur ? `#page-${cur}` : location.pathname); } catch (e) { /* file: URLs */ }
  }

  function labelFor(i) {
    const p = D.pages[i];
    if (!p) return "";
    const names = {
      cover: "Cover", backcover: "The End", endpaper: "", title: "Title", proem: "Invocation",
      contents: "Contents", personae: "Dramatis Personae", map: "Map of the Troad",
      prologue: "Before the Tale", afterword: "After the Iliad", sources: "Sources"
    };
    if (p.ch) return `Scroll ${ROMAN[p.ch]} · p. ${i}`;
    return names[p.type] || `p. ${i}`;
  }

  function turn(to, opts = {}) {
    const max = mode === "spread" ? leaves.length : leaves.length - 1;
    to = Math.max(0, Math.min(max, to));
    if (to === pos) return;
    const now = performance.now();
    if (now < busyUntil && !opts.force) return;
    const dir = to > pos ? 1 : -1;
    const count = Math.abs(to - pos);
    const fast = count > 1;
    const stagger = fast ? Math.min(90, 700 / count) : 0;
    const dur = fast ? 650 : FLIP_MS;
    book.classList.toggle("fast", fast);
    let order = 0;
    for (let s = 0; s < count; s++) {
      const k = dir > 0 ? pos + s : pos - 1 - s;
      const leaf = leaves[k];
      const delay = s * stagger;
      setTimeout(() => {
        leaf.style.zIndex = 1000 + order++;
        leaf.classList.toggle("flipped", dir > 0);
        leaf.classList.add("turning");
        setTimeout(() => leaf.classList.remove("turning"), dur);
      }, delay);
    }
    if (soundOn) {
      ILIAD.audio.flip(fast ? "fast" : "slow");
      if (fast) setTimeout(() => ILIAD.audio.flip("fast"), Math.min(count * stagger, 500));
    }
    pos = to;
    busyUntil = now + Math.min(count * stagger + dur * 0.35, 1200);
    bookState();
    setTimeout(restack, count * stagger + dur + 20);
    hidePopover();
  }

  function next() { turn(pos + 1); }
  function prev() { turn(pos - 1); }
  function goToPage(i) { turn(posForPage(i), { force: true }); }

  /* ================================================================ *
   * Profiles
   * ================================================================ */
  const modal = $("#profile");
  let lastFocus = null;

  function chip(k) {
    const c = D.characters[k];
    return `<button type="button" class="chip chip-${c.side}" data-char="${k}">${c.name}</button>`;
  }

  function openProfile(key) {
    const c = D.characters[key];
    if (!c) return;
    $("#profileBody").innerHTML = `
      <header class="pf-head">
        <div class="pf-medal">
          <svg class="pf-wreath" viewBox="0 0 200 120" aria-hidden="true"><use href="#wreath"/></svg>
          ${medallion(key, "large")}
        </div>
        <p class="pf-side side-${c.side}">${SIDES[c.side]}</p>
        <h2 id="profileName">${c.name}</h2>
        <p class="pf-greek" lang="grc">${c.greek}</p>
        <p class="pf-epithet">${c.epithet}</p>
      </header>
      <span class="meander-band"></span>
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
      <h3 class="pf-sub">Key moments</h3>
      <ol class="pf-moments">
        ${c.moments.map(([ch, t]) => `<li><button type="button" data-goto="${chapterStart[ch]}" data-close>
          <span class="pm-num">${ROMAN[ch]}</span><span>${t}<small>${D.chapters[ch - 1].title}</small></span></button></li>`).join("")}
      </ol>
      <p class="pf-fate"><strong>Fate.</strong> ${c.fate}</p>`;
    if (modal.hidden) lastFocus = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
    $(".tablet", modal).scrollTop = 0;
    $(".close", modal).focus({ preventScroll: true });
    hidePopover();
  }

  function closeProfile() {
    if (modal.hidden) return;
    modal.classList.remove("open");
    setTimeout(() => { modal.hidden = true; }, 250);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  /* ================================================================ *
   * Glossary and map popover
   * ================================================================ */
  const pop = $("#popover");
  let popFor = null;
  let popPinned = false;
  let hideTimer = null;

  function showPopover(anchor, html, pinned) {
    clearTimeout(hideTimer);
    pop.innerHTML = html;
    pop.hidden = false;
    popFor = anchor;
    popPinned = !!pinned;
    const r = anchor.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = r.left + r.width / 2 - pw / 2;
    x = Math.max(10, Math.min(window.innerWidth - pw - 10, x));
    let y = r.top - ph - 10;
    let below = false;
    if (y < 10) { y = r.bottom + 10; below = true; }
    pop.style.left = x + "px";
    pop.style.top = y + "px";
    pop.classList.toggle("below", below);
    pop.style.setProperty("--ax", (r.left + r.width / 2 - x) + "px");
    requestAnimationFrame(() => pop.classList.add("show"));
  }

  function hidePopover() {
    pop.classList.remove("show");
    pop.hidden = true;
    popFor = null;
    popPinned = false;
  }

  function termHTML(key) {
    const [name, def] = D.glossary[key];
    return `<p class="pop-title">${name}</p><p>${def}</p>`;
  }

  function placeHTML(id) {
    const pl = D.places.find((p) => p.id === id);
    const c = D.chapters[pl.ch - 1];
    return `<p class="pop-title">${pl.name}</p><p>${pl.text}</p>
      <button type="button" class="pop-link" data-goto="${chapterStart[pl.ch]}">Read Scroll ${ROMAN[c.n]}: ${c.title} ›</button>`;
  }

  /* ================================================================ *
   * Shield
   * ================================================================ */
  function initShields() {
    $$(".pg-shield").forEach((pg) => {
      const tpl = $(".shield-data", pg);
      if (!tpl) return;
      const data = JSON.parse(tpl.innerHTML);
      const info = $(".shield-info", pg);
      const select = (id) => {
        const d = data.find((x) => x.id === id);
        $$(".ring", pg).forEach((r) => r.classList.toggle("active", r.dataset.ring === id));
        info.innerHTML = `<h3>${d.name}</h3><p>${d.text} ${citeText(d.ref)}</p>`;
      };
      $$(".ring", pg).forEach((r) => {
        r.addEventListener("click", (e) => { e.stopPropagation(); select(r.dataset.ring); });
        r.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(r.dataset.ring); }
        });
      });
    });
  }

  /* ================================================================ *
   * Events
   * ================================================================ */
  function isInteractive(el) {
    return el.closest("button, a, .pin, .ring, .popover, .shield-info, input, select, textarea");
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    ILIAD.audio.unlock && soundOn && ILIAD.audio.unlock();

    const closeEl = t.closest("[data-close]");
    const gotoEl = t.closest("[data-goto]");
    const charEl = t.closest("[data-char]");
    const termEl = t.closest("[data-term]");
    const pinEl = t.closest(".pin");

    if (gotoEl) {
      e.preventDefault();
      if (closeEl || gotoEl.closest(".modal")) closeProfile();
      hidePopover();
      goToPage(+gotoEl.dataset.goto);
      return;
    }
    if (charEl) { e.preventDefault(); openProfile(charEl.dataset.char); return; }
    if (closeEl) { closeProfile(); return; }
    if (termEl) {
      e.preventDefault();
      if (popFor === termEl && popPinned) hidePopover();
      else showPopover(termEl, termHTML(termEl.dataset.term), true);
      return;
    }
    if (pinEl) {
      e.preventDefault();
      showPopover(pinEl, placeHTML(pinEl.dataset.place), true);
      return;
    }
    if (t.closest(".popover")) return;
    if (!pop.hidden) { hidePopover(); return; }

    // a tap on the page itself turns it
    const face = t.closest(".face");
    if (!face || isInteractive(t)) return;
    if (String(window.getSelection && window.getSelection()).length) return;
    if (mode === "spread") {
      if (book.classList.contains("closed-front")) return next();
      if (book.classList.contains("closed-back")) return prev();
      return face.classList.contains("front") ? next() : prev();
    }
    const r = face.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (pos === 0) return next();
    if (x < 0.3) prev();
    else if (x > 0.7) next();
  });

  // hover for glossary terms on devices with a mouse
  document.addEventListener("mouseover", (e) => {
    const termEl = e.target.closest && e.target.closest("[data-term]");
    if (!termEl || !window.matchMedia("(hover: hover)").matches) return;
    if (popPinned && popFor !== termEl) return;
    showPopover(termEl, termHTML(termEl.dataset.term), false);
  });
  document.addEventListener("mouseout", (e) => {
    const termEl = e.target.closest && e.target.closest("[data-term]");
    if (!termEl || popPinned || popFor !== termEl) return;
    hideTimer = setTimeout(hidePopover, 150);
  });
  document.addEventListener("focusin", (e) => {
    const termEl = e.target.closest && e.target.closest("[data-term]");
    if (termEl && !popPinned) showPopover(termEl, termHTML(termEl.dataset.term), false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hidePopover(); closeProfile(); return; }
    const pin = e.target.closest && e.target.closest(".pin");
    if (pin && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      showPopover(pin, placeHTML(pin.dataset.place), true);
      return;
    }
    if (!modal.hidden) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    if (e.key === "Home") turn(0, { force: true });
  });

  // swipe to turn
  let sx = null, sy = null, st = 0;
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    sx = e.clientX; sy = e.clientY; st = performance.now();
  });
  stage.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - st < 800) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 350);
      dx < 0 ? next() : prev();
    }
  });
  let suppressClick = false;
  stage.addEventListener("click", (e) => {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  // toolbar
  $("#prevBtn").addEventListener("click", prev);
  $("#nextBtn").addEventListener("click", next);
  $("#contentsBtn").addEventListener("click", () => goToPage(specialPage.contents));
  $("#castBtn").addEventListener("click", () => goToPage(specialPage.cast));
  $("#mapBtn").addEventListener("click", () => goToPage(specialPage.map));
  $("#soundBtn").addEventListener("click", (e) => {
    soundOn = !soundOn;
    const b = e.currentTarget;
    b.classList.toggle("on", soundOn);
    b.setAttribute("aria-pressed", soundOn);
    if (soundOn) ILIAD.audio.flip("fast");
  });
  $("#musicBtn").addEventListener("click", (e) => {
    const b = e.currentTarget;
    const on = ILIAD.audio.setMusic(!ILIAD.audio.musicOn);
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });

  // reflow on resize or rotation
  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      hidePopover();
      if (decideMode() !== mode) build(currentPage());
      else layout();
    }, 120);
  });
  window.addEventListener("scroll", () => { if (!popPinned) hidePopover(); }, { passive: true });

  /* ================================================================ *
   * Start
   * ================================================================ */
  const m = /#page-(\d+)/.exec(location.hash);
  build(m ? Math.min(+m[1], D.pages.length - 1) : 0);
  requestAnimationFrame(() => document.body.classList.add("ready"));
})();
