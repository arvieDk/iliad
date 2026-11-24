/**
 * art.js — every visual asset of "Iliad: Greeks vs Trojans", drawn as SVG.
 *
 * Minimalist and flat: rounded tiles in the two team colors, Roman numerals
 * built from shapes (no font needed), and tokens with simple icons in the
 * website's Iliad palette. Each function returns an SVG string, so the same
 * art is used in the game, in the pieces legend, and in the exported files
 * in /img/game/.
 */

/* ------------------------------------------------------------------------ */
/* Palette                                                                    */
/* ------------------------------------------------------------------------ */

export const TEAM = {
  G: { name: 'Greeks', main: '#2F5D8C', deep: '#1E3E60', soft: '#D9E3EE', line: '#9FB5CD' },
  T: { name: 'Trojans', main: '#A8432F', deep: '#6E2A1E', soft: '#F1D8D0', line: '#D7A193' }
};

export const C = {
  ink: '#1B1714',
  ivory: '#FAF6EF',
  bronze: '#A87B45',
  saffron: '#E2A84B',
  blood: '#8F2D24',
  olive: '#55613A',
  dawn: '#EBD5CE',
  clay: '#B85C38',
  wine: '#2E1A26'
};

const svg = (body, { w = 100, h = 100, label = '' } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true" focusable="false"'}>${body}</svg>`;

/* ------------------------------------------------------------------------ */
/* Emblems                                                                    */
/* ------------------------------------------------------------------------ */

/** Greek emblem: a crested Corinthian helmet (in a 100 box). */
const HELMET =
  '<path d="M45 22 C38 9 57 3 79 9 C72 11 67 15 62 21 Z"/>' +
  '<path d="M30 60 C28 33 40 21 50 21 C60 21 72 33 70 60 L70 78 C70 82 62 82 61 78 L60 60 C58 55 54 54 53 57 L53 70 L47 70 L47 57 C46 54 42 55 40 60 L39 78 C38 82 30 82 30 78 Z"/>';

/** Trojan emblem: a horse's head in profile (Troy, "tamer of horses"). */
const HORSE_HEAD =
  '<path d="M72 86 H36 C37 75 41 67 47 61 C39 61 29 63 23 59 C18 56 18 50 22 46 L39 31 C43 25 47 19 51 13 L55 20 C62 20 70 26 74 35 C79 46 79 64 72 86 Z"/>' +
  '<path d="M55 19 C61 14 68 16 72 23 C76 28 80 32 82 40 C78 37 75 36 73 35 C71 28 66 22 60 21 Z"/>';

/** Dolos: the wooden horse on its wheeled platform. */
const WOODEN_HORSE =
  '<path d="M30 44 H72 Q78 44 78 50 V60 H26 V50 Q26 44 30 44 Z"/>' +
  '<path d="M30 46 L22 22 L32 19 L38 44 Z"/>' +
  '<path d="M12 17 L31 13 L34 23 L18 26 Z"/>' +
  '<rect x="30" y="60" width="6" height="12"/><rect x="42" y="60" width="6" height="12"/>' +
  '<rect x="58" y="60" width="6" height="12"/><rect x="70" y="60" width="6" height="12"/>' +
  '<rect x="20" y="72" width="64" height="6" rx="2"/>' +
  '<circle cx="30" cy="84" r="6"/><circle cx="74" cy="84" r="6"/>' +
  '<path d="M78 48 L88 58" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>';

/* ------------------------------------------------------------------------ */
/* Roman numerals built from shapes                                           */
/* ------------------------------------------------------------------------ */

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

function numeral(n, cx, cy, h, fill) {
  const glyphs = ROMAN[n].split('');
  const s = h * 0.09;           // serif thickness
  const iw = h * 0.42;          // width of an I with serifs
  const vw = h * 0.66;          // width of a V
  const gap = h * 0.06;
  const widths = glyphs.map((g) => (g === 'I' ? iw : vw));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (glyphs.length - 1);
  let x = cx - total / 2;
  const y = cy - h / 2;
  let out = '';
  glyphs.forEach((g, i) => {
    if (g === 'I') {
      const stem = h * 0.17;
      out += `<rect x="${(x + (iw - stem) / 2).toFixed(2)}" y="${y.toFixed(2)}" width="${stem.toFixed(2)}" height="${h.toFixed(2)}"/>`;
      out += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${iw.toFixed(2)}" height="${s.toFixed(2)}"/>`;
      out += `<rect x="${x.toFixed(2)}" y="${(y + h - s).toFixed(2)}" width="${iw.toFixed(2)}" height="${s.toFixed(2)}"/>`;
    } else {
      const p = (px, py) => `${(x + px * h).toFixed(2)},${(y + py * h).toFixed(2)}`;
      out += `<polygon points="${p(0.06, 0)} ${p(0.27, 0)} ${p(0.37, 0.72)} ${p(0.5, 0)} ${p(0.6, 0)} ${p(0.38, 1)} ${p(0.29, 1)}"/>`;
      out += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(h * 0.33).toFixed(2)}" height="${s.toFixed(2)}"/>`;
      out += `<rect x="${(x + h * 0.44).toFixed(2)}" y="${y.toFixed(2)}" width="${(h * 0.22).toFixed(2)}" height="${s.toFixed(2)}"/>`;
    }
    x += widths[i] + gap;
  });
  return `<g fill="${fill}">${out}</g>`;
}

/* ------------------------------------------------------------------------ */
/* Effect badges (tiles 1–4)                                                  */
/* ------------------------------------------------------------------------ */

const EFFECT_ICON = {
  // 1: move an opponent tile (two-way arrow)
  1: '<path d="M-6 0 H6 M-3 -3 L-6 0 L-3 3 M3 -3 L6 0 L3 3"/>',
  // 2: move your own tile (arrow up-right)
  2: '<path d="M-5 5 L5 -5 M-1 -5 H5 V1"/>',
  // 3: swap a token (two arrows)
  3: '<path d="M-6 -2 H5 L2 -5 M6 2 H-5 L-2 5"/>',
  // 4: turn face down (half-filled diamond)
  4: '<path d="M0 -6 L6 0 L0 6 L-6 0 Z"/><path d="M0 -6 L0 6 L-6 0 Z" fill="currentColor"/>'
};

/* ------------------------------------------------------------------------ */
/* Tiles                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * A tile. v is 1–5 or 'D' (Dolos).
 * @param {'G'|'T'} f faction
 */
export function tile(f, v, { label = '' } = {}) {
  const t = TEAM[f];
  const emblem = f === 'G' ? HELMET : HORSE_HEAD;
  let face;
  if (v === 'D') {
    face = `<g fill="${C.ivory}" color="${C.ivory}" transform="translate(16 14) scale(.68)">${WOODEN_HORSE}</g>`;
  } else {
    face = numeral(v, 50, 52, 34, C.ivory);
    if (EFFECT_ICON[v]) {
      face +=
        `<g transform="translate(20 20)"><circle r="10" fill="${C.ivory}" fill-opacity=".16"/>` +
        `<g fill="none" stroke="${C.ivory}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="${C.ivory}">${EFFECT_ICON[v]}</g></g>`;
    }
  }
  return svg(
    `<rect x="2" y="2" width="96" height="96" rx="16" fill="${t.main}"/>` +
      `<rect x="7.5" y="7.5" width="85" height="85" rx="11" fill="none" stroke="${C.ivory}" stroke-opacity=".22" stroke-width="1.5"/>` +
      `<g fill="${C.ivory}" fill-opacity=".1" transform="translate(57 55) scale(.4)">${emblem}</g>` +
      face,
    { label }
  );
}

/** A face-down tile (also the tile back on decks). */
export function tileBack(f, { label = '' } = {}) {
  const t = TEAM[f];
  const emblem = f === 'G' ? HELMET : HORSE_HEAD;
  return svg(
    `<rect x="2" y="2" width="96" height="96" rx="16" fill="${t.deep}"/>` +
      `<rect x="9" y="9" width="82" height="82" rx="10" fill="none" stroke="${t.line}" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 4"/>` +
      `<g fill="${t.line}" fill-opacity=".55" color="${t.line}" transform="translate(25 25) scale(.5)">${emblem}</g>`,
    { label }
  );
}

/** A stack of three tile backs: the deck. */
export function deck(f) {
  const t = TEAM[f];
  const card = (x, y, o) =>
    `<rect x="${x}" y="${y}" width="80" height="80" rx="13" fill="${t.deep}" fill-opacity="${o}" stroke="${t.line}" stroke-opacity=".5" stroke-width="1.5"/>`;
  const emblem = f === 'G' ? HELMET : HORSE_HEAD;
  return svg(
    card(20, 4, 0.45) + card(12, 12, 0.7) + card(4, 20, 1) +
      `<g fill="${t.line}" fill-opacity=".6" color="${t.line}" transform="translate(24 40) scale(.4)">${emblem}</g>`,
    { w: 104, h: 104 }
  );
}

/** The team coin used for the coin toss and the turn marker. */
export function coin(f, { label = '' } = {}) {
  const t = TEAM[f];
  const emblem = f === 'G' ? HELMET : HORSE_HEAD;
  return svg(
    `<circle cx="50" cy="50" r="48" fill="${t.main}"/>` +
      `<circle cx="50" cy="50" r="41" fill="none" stroke="${C.ivory}" stroke-opacity=".45" stroke-width="2"/>` +
      `<circle cx="50" cy="50" r="36" fill="none" stroke="${C.ivory}" stroke-opacity=".25" stroke-width="1" stroke-dasharray="2 3"/>` +
      `<g fill="${C.ivory}" color="${C.ivory}" transform="translate(24 22) scale(.52)">${emblem}</g>`,
    { label }
  );
}

/* ------------------------------------------------------------------------ */
/* Tokens                                                                     */
/* ------------------------------------------------------------------------ */

/** God symbols (drawn in a 48 box). */
const GOD_ICON = {
  Zeus: '<polygon points="29,2 10,27 22,27 16,46 39,17 26,17 34,2"/>',
  Apollo:
    '<circle cx="24" cy="24" r="9"/>' +
    '<g stroke="currentColor" stroke-width="3.5" stroke-linecap="round">' +
    Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<line x1="${(24 + Math.cos(a) * 14).toFixed(1)}" y1="${(24 + Math.sin(a) * 14).toFixed(1)}" x2="${(24 + Math.cos(a) * 21).toFixed(1)}" y2="${(24 + Math.sin(a) * 21).toFixed(1)}"/>`;
    }).join('') +
    '</g>',
  Athena:
    '<ellipse cx="24" cy="28" rx="13" ry="16"/>' +
    '<polygon points="12,15 14,4 20,13"/><polygon points="36,15 34,4 28,13"/>' +
    '<circle cx="19" cy="23" r="5" fill="var(--bg)"/><circle cx="29" cy="23" r="5" fill="var(--bg)"/>' +
    '<circle cx="19" cy="23" r="2.2"/><circle cx="29" cy="23" r="2.2"/>' +
    '<polygon points="24,27 21.5,31 26.5,31" fill="var(--bg)"/>',
  Poseidon:
    '<rect x="22.3" y="14" width="3.4" height="33" rx="1.5"/>' +
    '<path d="M11 7 V17 Q24 25 37 17 V7 M24 4 V20" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>' +
    '<polygon points="11,1 15,9 7,9"/><polygon points="24,-2 28,6 20,6"/><polygon points="37,1 41,9 33,9"/>',
  Aphrodite:
    '<path d="M5 31 C11 19 25 17 33 23 C37 19 43 19 46 23 C42 23 40 25 38 29 C34 37 22 41 12 37 L3 41 Z"/>' +
    '<path d="M17 26 C21 14 30 9 37 9 C33 15 30 21 28 26 Z"/>' +
    '<circle cx="40" cy="23.5" r="1.4" fill="var(--bg)"/>'
};

const SPECIAL_ICON = {
  'achilles-shield':
    '<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="3.5"/>' +
    '<circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>' +
    '<circle cx="24" cy="24" r="5"/>',
  'hectors-spear':
    '<line x1="7" y1="43" x2="35" y2="13" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>' +
    '<polygon points="44,4 40,19 29,8"/>',
  chariot:
    '<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="3.5"/>' +
    '<g stroke="currentColor" stroke-width="2.6">' +
    [0, 60, 120].map((d) => `<line x1="24" y1="5" x2="24" y2="43" transform="rotate(${d} 24 24)"/>`).join('') +
    '</g><circle cx="24" cy="24" r="5"/>',
  'weakened-morale':
    '<line x1="6" y1="42" x2="20" y2="28" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>' +
    '<line x1="26" y1="22" x2="36" y2="12" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>' +
    '<polygon points="45,3 41,17 31,7"/>' +
    '<path d="M18 22 L24 30 M28 34 L22 26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  plague:
    '<line x1="10" y1="6" x2="34" y2="38" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>' +
    '<polygon points="39,45 26,39 36,31"/>' +
    '<path d="M6 10 L13 4 M10 14 L17 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="38" cy="10" r="3"/><circle cx="12" cy="36" r="3"/>',
  firestorm:
    '<path d="M24 2 C27 12 37 17 37 30 C37 39 31 46 24 46 C17 46 11 39 11 31 C11 24 15 20 18 16 C19 22 21 25 24 26 C22 19 21 10 24 2 Z"/>' +
    '<path d="M24 30 C27 33 29 36 29 39 C29 42 27 44 24 44 C21 44 19 42 19 39 C19 36 21 33 24 30 Z" fill="var(--bg)"/>',
  marriage:
    '<circle cx="18" cy="26" r="11" fill="none" stroke="currentColor" stroke-width="3.6"/>' +
    '<circle cx="30" cy="26" r="11" fill="none" stroke="currentColor" stroke-width="3.6"/>' +
    '<polygon points="24,4 27,9 24,13 21,9"/>'
};

/** Short key for a token (also the exported file name). */
export function tokenKey(t) {
  if (t.k === 'god') return `token-${t.g.toLowerCase()}-${t.v}`;
  if (t.k === 'wed') return 'token-marriage';
  return `token-${t.n.toLowerCase().replace(/[’']/g, '').replace(/[^a-z]+/g, '-')}`;
}

/** Human-readable name of a token. */
export function tokenName(t) {
  if (t.k === 'god') return `${t.g} ${t.v}`;
  if (t.k === 'wed') return 'Marriage';
  return `${t.n} ${t.v > 0 ? '+' : '−'}${Math.abs(t.v)}`;
}

/** A token: god support, a +10 hero token, a negative token, or a marriage. */
export function token(t, { label = '' } = {}) {
  let bg;
  let fg;
  let border = 'none';
  let icon;
  let value = '';
  if (t.k === 'god') {
    bg = C.ivory; fg = C.ink; border = C.bronze;
    icon = GOD_ICON[t.g];
    value = String(t.v);
  } else if (t.k === 'wed') {
    bg = C.dawn; fg = C.clay;
    icon = SPECIAL_ICON.marriage;
  } else {
    const key = tokenKey(t).replace('token-', '');
    icon = SPECIAL_ICON[key];
    if (t.v > 0) { bg = C.saffron; fg = C.ink; } else { bg = C.blood; fg = C.ivory; }
    value = `${t.v > 0 ? '+' : '−'}${Math.abs(t.v)}`;
  }
  const hasValue = value !== '';
  const iconScale = hasValue ? 0.92 : 1.1;
  const iconY = hasValue ? 12 : 23;
  const iconX = 50 - 24 * iconScale;
  icon = icon.replace(/var\(--bg\)/g, bg); // cut-outs take the token's own background color
  return svg(
    '<g>' +
      `<rect x="3" y="3" width="94" height="94" rx="18" fill="${bg}"${border !== 'none' ? ` stroke="${border}" stroke-width="2.5"` : ''}/>` +
      `<g fill="${fg}" color="${fg}" transform="translate(${iconX.toFixed(1)} ${iconY}) scale(${iconScale})">${icon}</g>` +
      (hasValue
        ? `<text x="50" y="${t.k === 'god' ? 88 : 87}" text-anchor="middle" style="font-variant-numeric:lining-nums" font-family="'Cormorant Garamond', Georgia, serif" font-weight="700" font-size="${t.k === 'god' ? 26 : 23}" fill="${fg}">${value}</text>`
        : '') +
      '</g>',
    { label }
  );
}

/* ------------------------------------------------------------------------ */
/* Board ornaments                                                            */
/* ------------------------------------------------------------------------ */

/** Greek-key square for the four corners of the token ring. */
export function cornerKey() {
  return svg(
    `<rect x="6" y="6" width="88" height="88" rx="14" fill="none" stroke="${C.bronze}" stroke-opacity=".5" stroke-width="2"/>` +
      `<path d="M28 72 V28 H72 V64 H40 V40 H60 V52 H50" fill="none" stroke="${C.bronze}" stroke-width="4" stroke-linecap="square"/>`
  );
}

/** Small UI icons (24 box, stroke-based). */
export const ICON = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  log: '<path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2z"/><path d="M9 9h6M9 13h4"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sound: '<path d="M5 10v4h4l5 4V6L9 10z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
  mute: '<path d="M5 10v4h4l5 4V6L9 10z"/><path d="M17 10l4 4M21 10l-4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[name]}</svg>`;
}

/** Encode SVG markup for use in CSS url(). */
export function dataUri(markup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
