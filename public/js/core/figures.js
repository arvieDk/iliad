/**
 * figures.js — animated character busts in black-figure vase style.
 *
 * Each figure is a small inline SVG (viewBox 120×120): an ink silhouette on a
 * terracotta disc, with details "incised" in clay-colored lines, exactly as
 * Athenian black-figure painters did. Women's and goddesses' skin is painted
 * in added white, another black-figure convention.
 *
 * Moving parts carry class names (fig-body, fig-eye, fig-crest, fig-rays …)
 * that components.css animates.
 */

/* ------------------------------------------------------------------------ */
/* Building blocks                                                           */
/* ------------------------------------------------------------------------ */

const DISC = '<circle class="fig-disc" cx="60" cy="60" r="58"/><circle class="fig-ring" cx="60" cy="60" r="53"/>';

/** Shoulders clipped to the disc's lower arc, with an incised neckline. */
const SHOULDERS =
  '<path class="fig-ink" d="M22 104 C24 89 40 82 60 82 C80 82 96 89 98 104 A58 58 0 0 1 22 104 Z"/>' +
  '<path class="fig-incise" d="M48 85 Q60 96 72 85"/>';

const AEGIS_SCALES =
  '<path class="fig-incise" d="M34 96 q3 3 6 0 q3 3 6 0 M74 96 q3 3 6 0 q3 3 6 0 M40 102 q3 3 6 0 q3 3 6 0 M68 102 q3 3 6 0 q3 3 6 0"/>';

function head(skin) {
  const cls = skin === 'white' ? 'fig-white' : 'fig-ink';
  return `<rect class="${cls}" x="53" y="66" width="14" height="18" rx="4"/>` +
    `<ellipse class="${cls}" cx="60" cy="56" rx="15" ry="18"/>`;
}

function eyes(skin) {
  const cls = skin === 'white' ? 'fig-eye fig-eye--ink' : 'fig-eye';
  return `<g><ellipse class="${cls}" cx="54" cy="55" rx="2" ry="2.2"/><ellipse class="${cls}" cx="66" cy="55" rx="2" ry="2.2"/></g>`;
}

/**
 * Parts. Each returns { back, front }:
 *   back  — drawn behind the bust (spears, rays, bows)
 *   front — drawn over the head (helmets, crowns, beards)
 */
const PARTS = {
  hairline: { front: '<path class="fig-incise" d="M47 48 C51 41 69 41 73 48"/>' },

  beard: {
    front:
      '<path class="fig-ink" d="M45 60 C45 76 53 86 60 88 C67 86 75 76 75 60 C70 70 50 70 45 60 Z"/>' +
      '<path class="fig-incise" d="M52 72 q2 6 0 11 M60 74 q2 6 0 11 M68 72 q-2 6 0 11"/>' +
      '<path class="fig-incise" d="M55 65 h10"/>'
  },

  whiteBeard: {
    front:
      '<path class="fig-white" d="M45 60 C45 77 53 88 60 90 C67 88 75 77 75 60 C70 70 50 70 45 60 Z"/>' +
      '<path class="fig-incise-ink" d="M52 72 q2 6 0 11 M60 74 q2 7 0 12 M68 72 q-2 6 0 11"/>' +
      '<path class="fig-white" d="M44 52 C42 44 46 40 49 42 L48 56 Z M76 52 C78 44 74 40 71 42 L72 56 Z"/>'
  },

  helmet: {
    front:
      '<path class="fig-ink" d="M43 62 C41 40 50 31 60 31 C70 31 79 40 77 62 L77 73 C77 75 72 75 71 73 L70 61 C68 58 64 57 62 59 L62 67 L58 67 L58 59 C56 57 52 58 50 61 L49 73 C48 75 43 75 43 73 Z"/>' +
      '<path class="fig-incise" d="M44 49 C50 45 70 45 76 49 M50 61 C52 58 56 57 58 59 L58 67 M62 67 L62 59 C64 57 68 58 70 61 L71 72 M49 72 L50 61"/>'
  },

  atticHelmet: {
    front:
      '<path class="fig-ink" d="M43 50 C42 36 50 29 60 29 C70 29 78 36 77 50 C72 46 48 46 43 50 Z"/>' +
      '<path class="fig-incise" d="M45 47 C52 43 68 43 75 47"/>'
  },

  crestShort: {
    front:
      '<g class="fig-crest"><path class="fig-ink" d="M53 33 C49 20 62 12 80 16 C74 19 70 24 67 33 Z"/>' +
      '<path class="fig-incise" d="M57 28 C59 22 65 19 72 18 M61 31 C63 26 67 23 74 21"/></g>'
  },

  crestTall: {
    front:
      '<g class="fig-crest"><path class="fig-ink" d="M53 33 C45 14 64 2 92 9 C85 12 79 16 74 22 C70 27 68 30 67 33 Z"/>' +
      '<path class="fig-incise" d="M56 27 C57 16 68 10 82 10 M60 30 C62 21 70 15 84 13 M64 32 C66 25 72 19 80 16"/></g>'
  },

  crestHigh: {
    front:
      '<g class="fig-crest"><path class="fig-ink" d="M51 32 C48 18 54 9 60 6 C66 9 72 18 69 32 Z"/>' +
      '<path class="fig-incise" d="M56 28 C56 20 58 14 60 10 M64 28 C64 20 62 14 60 10"/></g>'
  },

  crown: {
    front: '<path class="fig-white" d="M44 45 L46 33 L53 40 L60 30 L67 40 L74 33 L76 45 C68 42 52 42 44 45 Z"/>'
  },

  goldCrown: {
    front: '<path style="fill:var(--saffron)" d="M45 44 L47 35 L53 40 L60 32 L67 40 L73 35 L75 44 C68 41 52 41 45 44 Z"/>'
  },

  fillet: {
    front:
      '<path class="fig-incise" d="M46 47 C52 42 68 42 74 47"/>' +
      '<path style="fill:none;stroke:#F4EBDD;stroke-width:2.6;stroke-linecap:round" d="M45 50 C52 44 68 44 75 50"/>'
  },

  laurel: {
    front:
      '<path style="fill:none;stroke:#F4EBDD;stroke-width:1.6" d="M44 52 C48 42 72 42 76 52"/>' +
      '<g class="fig-white"><ellipse cx="46" cy="47" rx="3.4" ry="1.6" transform="rotate(-50 46 47)"/>' +
      '<ellipse cx="51" cy="42.5" rx="3.4" ry="1.6" transform="rotate(-25 51 42.5)"/>' +
      '<ellipse cx="57" cy="40.5" rx="3.4" ry="1.6" transform="rotate(-8 57 40.5)"/>' +
      '<ellipse cx="63" cy="40.5" rx="3.4" ry="1.6" transform="rotate(8 63 40.5)"/>' +
      '<ellipse cx="69" cy="42.5" rx="3.4" ry="1.6" transform="rotate(25 69 42.5)"/>' +
      '<ellipse cx="74" cy="47" rx="3.4" ry="1.6" transform="rotate(50 74 47)"/></g>'
  },

  pilos: {
    front:
      '<path class="fig-ink" d="M43 47 C45 31 53 21 60 19 C67 21 75 31 77 47 Z"/>' +
      '<path class="fig-incise" d="M44 45 L76 45"/>'
  },

  phrygian: {
    front:
      '<path class="fig-ink" d="M43 54 C40 36 50 27 61 27 C68 27 71 23 68 15 C80 19 82 36 77 54 C72 48 48 48 43 54 Z"/>' +
      '<path class="fig-incise" d="M45 51 C52 46 68 46 75 51 M64 28 C70 26 72 21 70 17"/>'
  },

  petasos: {
    front:
      '<path class="fig-ink" d="M48 41 C48 30 72 30 72 41 Z"/>' +
      '<ellipse class="fig-ink" cx="60" cy="42" rx="23" ry="4.5"/>' +
      '<path class="fig-incise" d="M40 42.5 C52 45 68 45 80 42.5"/>' +
      '<path class="fig-white fig-wing" d="M71 35 C78 26 88 24 94 26 C89 28 86 30 84 32 C88 32 90 34 90 36 C84 37 77 37 71 37 Z"/>' +
      '<path class="fig-white fig-wing fig-wing--l" d="M49 35 C42 26 32 24 26 26 C31 28 34 30 36 32 C32 32 30 34 30 36 C36 37 43 37 49 37 Z"/>'
  },

  longHair: {
    front:
      '<path class="fig-ink" d="M44 58 C41 40 50 34 60 34 C70 34 79 40 76 58 C77 70 80 80 83 88 L74 85 C74 72 73 60 71 51 C67 46 53 46 49 51 C47 60 46 72 46 85 L37 88 C40 80 43 70 44 58 Z"/>' +
      '<path class="fig-incise" d="M48 40 C54 37 66 37 72 40 M44 64 q-1 10 -4 20 M76 64 q1 10 4 20"/>'
  },

  bun: {
    front:
      '<circle class="fig-ink" cx="60" cy="31" r="7"/>' +
      '<path class="fig-ink" d="M45 54 C43 40 50 36 60 36 C70 36 77 40 75 54 C71 46 49 46 45 54 Z"/>' +
      '<path class="fig-incise" d="M48 44 C54 40 66 40 72 44"/>'
  },

  veil: {
    front:
      '<path class="fig-ink" d="M39 88 C36 60 41 33 60 31 C79 33 84 60 81 88 L72 85 C74 68 73 54 71 49 C67 44 53 44 49 49 C47 54 46 68 48 85 Z"/>' +
      '<path class="fig-incise" d="M42 84 C40 60 45 37 60 35 C75 37 80 60 78 84"/>'
  },

  polos: {
    front:
      '<path class="fig-ink" d="M47 43 L49 27 L71 27 L73 43 Z"/>' +
      '<path class="fig-incise" d="M49 31 H71 M48 39 H72 M53 35 h3 M59 35 h3 M65 35 h3"/>'
  },

  diadem: {
    front:
      '<path style="fill:none;stroke:#F4EBDD;stroke-width:2.4;stroke-linecap:round" d="M47 44 C53 39 67 39 73 44"/>' +
      '<circle class="fig-white" cx="60" cy="38.6" r="2.2"/>'
  },

  earrings: {
    front: '<circle style="fill:var(--saffron)" cx="44.5" cy="64" r="2"/><circle style="fill:var(--saffron)" cx="75.5" cy="64" r="2"/>'
  },

  flowers: {
    front:
      '<g class="fig-white"><circle cx="47" cy="45" r="2.4"/><circle cx="53" cy="40" r="2.4"/><circle cx="60" cy="38.5" r="2.4"/>' +
      '<circle cx="67" cy="40" r="2.4"/><circle cx="73" cy="45" r="2.4"/></g>'
  },

  aegis: { front: AEGIS_SCALES },

  /* ---- Attributes drawn behind or beside the bust ----------------------- */
  spear: {
    back:
      '<path class="fig-ink" d="M98.6 104 L99.6 32 L101.4 32 L101.4 104 Z"/>' +
      '<path class="fig-ink" d="M100.5 15 L105 32 L96 32 Z"/>'
  },

  roundShield: {
    back:
      '<circle class="fig-ink" cx="24" cy="84" r="15"/>' +
      '<circle class="fig-incise" cx="24" cy="84" r="11"/><circle class="fig-clay" cx="24" cy="84" r="3"/>'
  },

  towerShield: {
    front:
      '<rect class="fig-ink" x="77" y="62" width="21" height="38" rx="9"/>' +
      '<path class="fig-incise" d="M87.5 66 V96 M81 70 C85 68 90 68 94 70"/>'
  },

  bow: {
    back:
      '<path style="fill:none;stroke:var(--ink);stroke-width:3;stroke-linecap:round" d="M31 102 Q12 74 33 44"/>' +
      '<path style="fill:none;stroke:var(--ink);stroke-width:0.9" d="M31 102 L33 44"/>'
  },

  bolt: {
    back:
      '<path class="fig-bolt" style="fill:var(--saffron)" d="M96 22 L84 50 L92 50 L81 80 L101 44 L93 44 L102 22 Z"/>'
  },

  rays: {
    back:
      '<g class="fig-rays" style="stroke:var(--saffron);stroke-width:2.2;stroke-linecap:round">' +
      Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        const x1 = (60 + Math.cos(a) * 26).toFixed(1);
        const y1 = (54 + Math.sin(a) * 26).toFixed(1);
        const x2 = (60 + Math.cos(a) * 33).toFixed(1);
        const y2 = (54 + Math.sin(a) * 33).toFixed(1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      }).join('') +
      '</g>'
  },

  trident: {
    back:
      '<path style="fill:none;stroke:var(--ink);stroke-width:2.6;stroke-linecap:round" d="M94 106 V26 M86 20 V30 Q94 37 102 30 V20"/>' +
      '<path class="fig-ink" d="M94 14 L97.5 24 L90.5 24 Z M86 14 L89 22 L83 22 Z M102 14 L105 22 L99 22 Z"/>'
  },

  waves: {
    back:
      '<path class="fig-wave" style="fill:none;stroke:#F4EBDD;stroke-width:2;stroke-linecap:round" d="M14 80 q5 -5 10 0 t10 0 M18 90 q5 -5 10 0 t10 0"/>'
  },

  hammer: {
    back:
      '<path class="fig-ink" d="M97 104 L99 46 L102 46 L101 104 Z"/>' +
      '<rect class="fig-ink" x="89" y="38" width="22" height="10" rx="2"/>' +
      '<g style="fill:var(--saffron)"><circle class="fig-spark" cx="86" cy="30" r="2"/><circle class="fig-spark" cx="108" cy="30" r="1.6"/><circle class="fig-spark" cx="96" cy="24" r="1.8"/></g>'
  },

  owl: {
    back:
      '<g class="fig-tilt"><ellipse class="fig-white" cx="23" cy="80" rx="7.5" ry="9.5"/>' +
      '<path class="fig-white" d="M16.5 73 L18 67 L21 72 Z M29.5 73 L28 67 L25 72 Z"/>' +
      '<circle class="fig-ink" cx="20.2" cy="77" r="1.6"/><circle class="fig-ink" cx="25.8" cy="77" r="1.6"/>' +
      '<path class="fig-incise-ink" d="M20 84 q3 2 6 0 M20 87.5 q3 2 6 0"/></g>'
  },

  dove: {
    back:
      '<g class="fig-tilt"><path class="fig-white" d="M14 72 C20 64 30 64 36 70 C32 74 26 76 21 75 L12 80 L16 74 Z"/>' +
      '<path class="fig-white" d="M24 68 C26 60 32 58 36 58 C33 62 31 66 30 69 Z"/>' +
      '<circle class="fig-ink" cx="32.6" cy="68.4" r="0.9"/></g>'
  },

  crescent: {
    back:
      '<path class="fig-white fig-tilt" d="M93 15 A13 13 0 1 0 101 37 A10 10 0 1 1 93 15 Z"/>'
  },

  pearls: {
    front:
      '<g class="fig-white"><circle cx="47" cy="47" r="1.6"/><circle cx="51.5" cy="43" r="1.6"/><circle cx="56.5" cy="41" r="1.6"/>' +
      '<circle cx="63.5" cy="41" r="1.6"/><circle cx="68.5" cy="43" r="1.6"/><circle cx="73" cy="47" r="1.6"/></g>'
  }
};

/* ------------------------------------------------------------------------ */
/* Presets — one per character or god                                         */
/* ------------------------------------------------------------------------ */

const PRESETS = {
  achilles:   { skin: 'ink',   parts: ['spear', 'helmet', 'crestShort'] },
  agamemnon:  { skin: 'ink',   parts: ['hairline', 'beard', 'crown'] },
  menelaus:   { skin: 'ink',   parts: ['helmet', 'beard'] },
  odysseus:   { skin: 'ink',   parts: ['pilos', 'beard'] },
  ajax:       { skin: 'ink',   parts: ['helmet', 'crestShort', 'beard', 'towerShield'] },
  patroclus:  { skin: 'ink',   parts: ['hairline', 'fillet'] },
  hector:     { skin: 'ink',   parts: ['helmet', 'crestTall', 'beard'] },
  priam:      { skin: 'ink',   parts: ['whiteBeard', 'goldCrown'] },
  paris:      { skin: 'ink',   parts: ['bow', 'phrygian'] },
  helen:      { skin: 'white', parts: ['longHair', 'diadem', 'earrings'] },
  andromache: { skin: 'white', parts: ['veil', 'earrings'] },
  zeus:       { skin: 'ink',   parts: ['bolt', 'hairline', 'beard', 'laurel'] },
  hera:       { skin: 'white', parts: ['veil', 'polos', 'earrings'] },
  athena:     { skin: 'white', parts: ['owl', 'aegis', 'atticHelmet', 'crestHigh'] },
  apollo:     { skin: 'ink',   parts: ['rays', 'laurel'] },
  poseidon:   { skin: 'ink',   parts: ['trident', 'waves', 'hairline', 'beard'] },
  aphrodite:  { skin: 'white', parts: ['dove', 'longHair', 'flowers', 'earrings'] },
  ares:       { skin: 'ink',   parts: ['spear', 'roundShield', 'helmet', 'crestHigh', 'beard'] },
  hephaestus: { skin: 'ink',   parts: ['hammer', 'hairline', 'beard'] },
  hermes:     { skin: 'ink',   parts: ['beard', 'petasos'] },
  artemis:    { skin: 'white', parts: ['bow', 'crescent', 'bun'] },
  thetis:     { skin: 'white', parts: ['waves', 'longHair', 'pearls'] }
};

/* ------------------------------------------------------------------------ */
/* Public API                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Return the SVG markup for a figure.
 * @param {string} id        character or god id (falls back to a plain bust)
 * @param {object} [opts]
 * @param {boolean} [opts.still]  pause animation until the card is hovered
 * @param {string}  [opts.label]  accessible label; omit for decorative use
 * @param {string[]} [opts.omit]  part names to leave out (e.g. ['spear'])
 */
export function figureSVG(id, { still = false, label = '', omit = [] } = {}) {
  const preset = PRESETS[id] || { skin: 'ink', parts: ['hairline'] };
  const parts = preset.parts
    .filter((name) => !omit.includes(name))
    .map((name) => PARTS[name])
    .filter(Boolean);
  const back = parts.map((p) => p.back || '').join('');
  const front = parts.map((p) => p.front || '').join('');
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';

  return (
    `<svg class="figure${still ? ' is-still' : ''}" viewBox="0 0 120 120" ${a11y}>` +
    DISC +
    back +
    `<g class="fig-body">${SHOULDERS}${head(preset.skin)}${eyes(preset.skin)}${front}</g>` +
    '</svg>'
  );
}

/**
 * Build an "actor": a figure that can walk in and react to answers.
 * Returns the element; call react(el, 'correct' | 'wrong') to animate it.
 */
export function createActor(id, name = '', { enter = true, mirror = false } = {}) {
  const el = document.createElement('div');
  el.className = `actor${mirror ? ' actor--mirror' : ''}`;
  el.innerHTML =
    `<div class="actor__inner">${figureSVG(id)}</div>` +
    (name ? `<p class="actor__name">${name}</p>` : '');

  if (enter) {
    el.classList.add('is-entering');
    el.addEventListener('animationend', (event) => {
      if (event.animationName === 'actor-walk-in') el.classList.remove('is-entering');
    });
  }
  return el;
}

/** Play a reaction on an actor; a correct answer also bursts saffron sparks. */
export function react(actor, kind) {
  if (!actor) return;
  actor.classList.remove('is-entering', 'is-correct', 'is-wrong');
  void actor.offsetWidth; // restart the animation
  actor.classList.add(kind === 'correct' ? 'is-correct' : 'is-wrong');

  if (kind === 'correct' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const burst = document.createElement('div');
    burst.className = 'burst';
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 46 + Math.random() * 22;
      const dot = document.createElement('span');
      dot.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
      dot.style.setProperty('--y', `${Math.sin(angle) * dist}px`);
      burst.appendChild(dot);
    }
    actor.appendChild(burst);
    setTimeout(() => burst.remove(), 900);
  }
}

/** Fill every [data-figure] placeholder on the page with its SVG. */
export function hydrateFigures(root = document) {
  root.querySelectorAll('[data-figure]').forEach((slot) => {
    if (slot.dataset.hydrated) return;
    slot.innerHTML = figureSVG(slot.dataset.figure, { still: slot.hasAttribute('data-still') });
    slot.dataset.hydrated = 'true';
  });
}
