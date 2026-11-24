/**
 * ai.js — a simple computer opponent.
 *
 * It looks one move ahead: for every tile in hand and every legal space it
 * scores how the move changes the rows and columns it touches (and whether
 * it completes and wins a line), then plays the best one with a little
 * randomness. It uses effect 4 when it removes a stronger enemy tile, skips
 * the movement and swap effects, and picks the end token worth most to it.
 */
import { LINES, destinations, key, lineTotals, flipTargets, opp, effectPossible } from './engine.js';

/** How much a token is worth to faction f, given what it already holds. */
export function tokenWorth(S, f, t) {
  if (!t) return 0;
  const mine = S.won[f];
  if (t.k === 'god') {
    const best = Math.max(0, ...mine.filter((x) => x.k === 'god' && x.g === t.g).map((x) => x.v));
    if (!best) return t.v + 5; // a new god counts towards "all five gods"
    return Math.max(0, t.v - best) + 0.5;
  }
  if (t.k === 'wed') {
    const gods = new Set(mine.filter((x) => x.k === 'god').map((x) => x.g)).size;
    return gods >= 3 ? 7 : 2;
  }
  return t.v;
}

/** Best end token for f among a line's two ends. */
function bestEnd(S, f, ends) {
  return Math.max(...ends.map((k) => tokenWorth(S, f, S.edge[k])));
}

function scorePlacement(S, f, r, c, t) {
  const k = key(r, c);
  S.b[k] = t; // try it
  let score = 0;
  LINES.filter((l) => l.cells.includes(k) && !S.scored[l.id]).forEach((l) => {
    const totals = lineTotals(S, l);
    const diff = totals[f] - totals[opp(f)];
    const filled = l.cells.filter((x) => S.b[x]).length;
    if (filled === 6) {
      const win = diff > 0 || diff === 0; // a tie goes to the active player
      score += win ? 10 + bestEnd(S, f, l.ends) : -(6 + bestEnd(S, opp(f), l.ends));
    } else {
      // Favour lines we lead, more strongly the fuller they are; avoid leaving
      // a line one tile from completion for the opponent to steal.
      score += diff * 0.35 * (filled / 6);
      if (filled === 5 && diff <= 0) score -= 3;
    }
  });
  delete S.b[k];
  // Keep Dolos for lines with strong neighbours, and save 5s slightly.
  if (t.v === 5) score -= 0.2;
  return score + Math.random() * 0.6;
}

/** Choose { hand index, r, c } for faction f. */
export function choosePlacement(S, f) {
  let best = null;
  S.hand[f].forEach((t, i) => {
    destinations(S, f).forEach(([r, c]) => {
      const s = scorePlacement(S, f, r, c, t);
      if (!best || s > best.s) best = { s, i, r, c };
    });
  });
  return best;
}

/** Use the effect of the tile just placed? */
export function wantsEffect(S) {
  const v = S.last.t.v;
  if (v !== 4 || !effectPossible(S, 4)) return false;
  const targets = flipTargets(S, S.cur, S.last.r, S.last.c).map(([x, y]) => S.b[key(x, y)]);
  const strongest = Math.max(...targets.map((t) => (t.v === 'D' ? 6 : t.v)));
  return strongest >= 4; // trade our 4 for one of their strong tiles
}

/** Target for effect 4: the strongest neighbouring enemy tile. */
export function chooseFlip(S) {
  const targets = flipTargets(S, S.cur, S.last.r, S.last.c);
  targets.sort((a, b) => {
    const va = S.b[key(...a)].v;
    const vb = S.b[key(...b)].v;
    return (vb === 'D' ? 6 : vb) - (va === 'D' ? 6 : va);
  });
  return targets[0];
}

/** Which complete line to score first: the one we win by the most. */
export function chooseLine(S, f) {
  let best = null;
  S.pending.forEach((id) => {
    const line = LINES.find((l) => l.id === id);
    const t = lineTotals(S, line);
    const margin = t[f] - t[opp(f)];
    if (!best || margin > best.margin) best = { id, margin };
  });
  return best.id;
}

/** Which end token to take. */
export function chooseToken(S, f) {
  const [a, b] = S.line.ends;
  return tokenWorth(S, f, S.edge[a]) >= tokenWorth(S, f, S.edge[b]) ? a : b;
}
