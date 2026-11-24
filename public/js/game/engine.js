/**
 * engine.js — the rules of "Iliad: Greeks vs Trojans", with no DOM code.
 *
 * Ported from the original single-file game; the rules are unchanged:
 *  • 6×6 board in alternating team colors, inside a ring of 24 token slots.
 *  • Each turn: place a tile from your hand on an empty space of your color
 *    that touches another tile.
 *  • Tiles 1–4 have an optional effect: 1 moves an opponent tile, 2 moves one
 *    of yours, 3 swaps one of your tokens with a market token, 4 turns itself
 *    and a neighboring opponent tile face down. 5 and Dolos have no effect;
 *    Dolos counts as the sum of its line neighbors.
 *  • A full row or column is scored: the higher total wins it (ties go to the
 *    active player) and picks one end token; the loser gets the other.
 *  • End: support of all five gods wins (or four gods plus both marriages);
 *    otherwise most points, then lower god tokens, best Zeus, best Poseidon.
 *
 * The UI calls the action functions and reads `state.mode` to know what to
 * ask next. Events (for sounds, log and animations) go to `onEvent`.
 */

export const FACTIONS = ['G', 'T'];
export const NAME = { G: 'Greeks', T: 'Trojans' };
export const opp = (f) => (f === 'G' ? 'T' : 'G');

/** Token set. God values follow the original game (its author's estimate). */
export const GODS = {
  Zeus: [6, 6, 3, 1, 1],
  Apollo: [8, 8, 4, 1],
  Athena: [5, 5, 3, 1],
  Poseidon: [2, 2, 1, 1],
  Aphrodite: [7, 7, 4, 1]
};
export const GOD_ORDER = ['Zeus', 'Apollo', 'Athena', 'Poseidon', 'Aphrodite'];
export const HEROES = [['Achilles’ Shield', 10], ['Hector’s Spear', 10], ['Chariot', 10]];
export const HARDSHIPS = [['Weakened Morale', -3], ['Plague', -5], ['Firestorm', -10]];

export const EFFECTS = {
  1: ['Move an opponent tile', 'Move one opponent tile that has an empty neighboring space to another empty space of its color that touches a tile.'],
  2: ['Move your own tile', 'Move one of your tiles that has an empty neighboring space to another empty space of your color that touches a tile.'],
  3: ['Swap a token', 'Swap one of your success tokens with one of the five market tokens.'],
  4: ['Turn tiles face down', 'Turn this tile face down, then turn one neighboring face-up opponent tile face down. Face-down tiles score 0.'],
  5: ['No effect', 'The strongest numbered tile.'],
  D: ['Dolos: no effect', 'When a line is scored, Dolos counts as the sum of its neighbors in that line. Face-down tiles and other Dolos count as 0.']
};

/* ------------------------------------------------------------------------ */
/* Geometry                                                                   */
/* ------------------------------------------------------------------------ */

export const key = (r, c) => `${r},${c}`;
export const parse = (k) => k.split(',').map(Number);
export const colorOf = (r, c) => ((r + c) % 2 ? 'T' : 'G');
export const inGrid = (r, c) => r > 0 && r < 7 && c > 0 && c < 7;
export const neighbors = (r, c) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [r + a, c + b]).filter(([x, y]) => inGrid(x, y));

export const LINES = [1, 2, 3, 4, 5, 6].flatMap((i) => [
  { id: `Row ${i}`, cells: [1, 2, 3, 4, 5, 6].map((c) => key(i, c)), ends: [key(i, 0), key(i, 7)] },
  { id: `Column ${i}`, cells: [1, 2, 3, 4, 5, 6].map((r) => key(r, i)), ends: [key(0, i), key(7, i)] }
]);

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const tileName = (t) => (t.v === 'D' ? 'Dolos' : `tile ${t.v}`);

/* ------------------------------------------------------------------------ */
/* Pure helpers on a state                                                    */
/* ------------------------------------------------------------------------ */

const hasNeighborTile = (S, r, c, ignore) => neighbors(r, c).some(([x, y]) => S.b[key(x, y)] && key(x, y) !== ignore);

export const isLegal = (S, f, r, c, ignore) =>
  inGrid(r, c) && !S.b[key(r, c)] && colorOf(r, c) === f && hasNeighborTile(S, r, c, ignore);

export function destinations(S, f, ignore) {
  const out = [];
  for (let r = 1; r < 7; r += 1) for (let c = 1; c < 7; c += 1) if (isLegal(S, f, r, c, ignore) && key(r, c) !== ignore) out.push([r, c]);
  return out;
}

const hasEmptyNeighbor = (S, r, c) => neighbors(r, c).some(([x, y]) => !S.b[key(x, y)]);

/** Board tiles of faction g that an effect 1 / 2 could move. */
export function movableTiles(S, g) {
  return Object.keys(S.b).filter((k) => {
    const [r, c] = parse(k);
    return S.b[k].f === g && hasEmptyNeighbor(S, r, c) && destinations(S, g, k).length > 0;
  });
}

/** Face-up opponent tiles next to (r, c). */
export function flipTargets(S, f, r, c) {
  return neighbors(r, c).filter(([x, y]) => {
    const t = S.b[key(x, y)];
    return t && t.f !== f && !t.down;
  });
}

export function effectPossible(S, v) {
  const f = S.cur;
  if (v === 1 || v === 2) return movableTiles(S, v === 1 ? opp(f) : f).length > 0;
  if (v === 3) return S.won[f].length > 0;
  if (v === 4) return flipTargets(S, f, S.last.r, S.last.c).length > 0;
  return false;
}

/** Line totals for both teams (face-down = 0; Dolos = sum of its line neighbors). */
export function lineTotals(S, line) {
  const raw = line.cells.map((k) => {
    const t = S.b[k];
    if (!t || t.down) return 0;
    return t.v === 'D' ? null : t.v;
  });
  const tot = { G: 0, T: 0 };
  line.cells.forEach((k, i) => {
    const t = S.b[k];
    if (!t || t.down) return;
    let v = t.v;
    if (v === 'D') {
      v = 0;
      [i - 1, i + 1].forEach((j) => {
        if (raw[j]) v += raw[j];
      });
    }
    tot[t.f] += v;
  });
  return tot;
}

export const completeLines = (S) => LINES.filter((l) => !S.scored[l.id] && l.cells.every((k) => S.b[k]));

/** End-of-game evaluation for one team. */
export function evaluate(S, f) {
  const gods = {};
  S.won[f].filter((t) => t.k === 'god').forEach((t) => (gods[t.g] = gods[t.g] || []).push(t.v));
  let pts = 0;
  let low = 0;
  const godCount = Object.keys(gods).length;
  const weddings = S.won[f].filter((t) => t.k === 'wed').length;
  Object.values(gods).forEach((a) => {
    a.sort((x, y) => y - x);
    pts += a[0];
    low += a.slice(1).reduce((s, x) => s + x, 0);
  });
  S.won[f].forEach((t) => {
    if (t.k === 'pos' || t.k === 'neg') pts += t.v;
  });
  return {
    all: godCount === 5 || (godCount === 4 && weddings === 2),
    gods: godCount,
    weddings,
    pts,
    low,
    z: Math.max(0, ...(gods.Zeus || [0])),
    p: Math.max(0, ...(gods.Poseidon || [0]))
  };
}

/** Tokens in counting order for the tally (best of each god counts, lower ones are tie-breakers). */
export function tallyRows(S, f) {
  const idx = S.won[f].map((t, i) => ({ t, i }));
  const gods = {};
  const rows = [];
  idx.filter((x) => x.t.k === 'god').forEach((x) => (gods[x.t.g] = gods[x.t.g] || []).push(x));
  GOD_ORDER.forEach((g) =>
    (gods[g] || []).sort((a, b) => b.t.v - a.t.v).forEach((x, j) => rows.push({ i: x.i, t: x.t, pts: j === 0 ? x.t.v : 0, low: j > 0 }))
  );
  idx.filter((x) => x.t.k === 'pos' || x.t.k === 'neg').forEach((x) => rows.push({ i: x.i, t: x.t, pts: x.t.v, low: false }));
  idx.filter((x) => x.t.k === 'wed').forEach((x) => rows.push({ i: x.i, t: x.t, pts: 0, low: false }));
  return rows;
}

/* ------------------------------------------------------------------------ */
/* The game                                                                   */
/* ------------------------------------------------------------------------ */

export function freshState() {
  return {
    turn: 1,
    cur: 'G',
    first: 'G',
    deck: { G: [], T: [] },
    hand: { G: [], T: [] },
    won: { G: [], T: [] },
    b: {},          // board tiles by "r,c": { f, v, down? }
    edge: {},       // ring tokens by "r,c"
    market: [],     // five market tokens
    scored: {},     // line id -> true
    sel: null,      // selected hand index
    mode: 'idle',   // what the game waits for (see header)
    last: null,     // last placed tile { k, r, c, t }
    src: null,      // tile being moved (effects 1 / 2)
    fxf: null,      // faction whose tile is moved
    sw: null,       // own token picked for a swap (effect 3)
    pending: [],    // complete lines waiting to be scored
    line: null,     // line being resolved { id, winner, totals }
    pass: 0,
    result: null,
    started: false
  };
}

/**
 * Create a game controller.
 * @param {function} onEvent  (type, payload) — 'log', 'sfx', 'place', 'move', 'flip', 'score', 'token', 'turn', 'over'
 */
export function createGame(onEvent = () => {}) {
  let S = freshState();
  const emit = (type, payload = {}) => onEvent(type, payload);
  const log = (text, err = false) => emit('log', { text, err, turn: S.turn });
  const fail = (text) => {
    log(text, true);
    emit('sfx', { name: 'error' });
    return { ok: false, error: text };
  };

  function setup(first) {
    S = freshState();
    S.first = first;
    S.cur = first;
    const tokens = [];
    for (const g in GODS) GODS[g].forEach((v) => tokens.push({ k: 'god', g, v }));
    HEROES.forEach(([n, v]) => tokens.push({ k: 'pos', n, v }));
    HARDSHIPS.forEach(([n, v]) => tokens.push({ k: 'neg', n, v }));
    tokens.push({ k: 'wed', v: 0 }, { k: 'wed', v: 0 });

    // Five non-negative tokens start in the market; the other 24 fill the ring.
    const rest = [];
    shuffle(tokens).forEach((t) => {
      if (t.v >= 0 && S.market.length < 5) S.market.push(t);
      else rest.push(t);
    });
    shuffle(rest);
    LINES.forEach((l) => l.ends.forEach((k) => { S.edge[k] = rest.pop(); }));

    // Each team: 18 tiles (1–5 and Dolos, three of each); two different ones start in the center.
    FACTIONS.forEach((f) => {
      let d;
      let start;
      do {
        d = shuffle([1, 2, 3, 4, 5, 'D'].flatMap((v) => [1, 2, 3].map(() => ({ f, v }))));
        start = d.slice(-2);
      } while (start[0].v === start[1].v);
      d.length -= 2;
      shuffle(f === 'G' ? [[3, 3], [4, 4]] : [[3, 4], [4, 3]]).forEach((p, i) => { S.b[key(...p)] = start[i]; });
      S.deck[f] = d;
      draw(f);
    });
    S.started = true;
  }

  function draw(f) {
    while (S.hand[f].length < 2 && S.deck[f].length) S.hand[f].push(S.deck[f].pop());
  }

  function startTurn() {
    S.mode = 'place';
    S.sel = null;
    if (!S.hand[S.cur].length || !destinations(S, S.cur).length) {
      log(`${NAME[S.cur]} have no legal placement and pass`, true);
      S.pass += 1;
      if (S.pass >= 2) return finish();
      S.cur = opp(S.cur);
      S.turn += 1;
      emit('turn', { cur: S.cur });
      return startTurn();
    }
    S.pass = 0;
    emit('changed');
    return { ok: true };
  }

  function nextTurn() {
    draw(S.cur);
    if (LINES.every((l) => S.scored[l.id])) return finish();
    S.cur = opp(S.cur);
    S.turn += 1;
    emit('turn', { cur: S.cur });
    emit('sfx', { name: 'turn' });
    return startTurn();
  }

  /* ---- Placement --------------------------------------------------------- */
  function selectHand(i) {
    if (S.mode !== 'place') return fail('You cannot pick a tile right now');
    if (!S.hand[S.cur][i]) return fail('There is no tile there');
    S.sel = S.sel === i ? null : i;
    emit('sfx', { name: 'select' });
    emit('changed');
    return { ok: true };
  }

  function place(r, c) {
    const f = S.cur;
    if (S.mode !== 'place') return fail('You cannot place a tile right now');
    if (S.sel === null) return fail('Select a tile from your hand first');
    if (!isLegal(S, f, r, c)) return fail(`Use an empty ${f === 'G' ? 'blue' : 'red'} space that touches a tile`);
    const k = key(r, c);
    const t = S.hand[f].splice(S.sel, 1)[0];
    S.b[k] = t;
    S.sel = null;
    S.last = { k, r, c, t };
    emit('place', { k, t });
    emit('sfx', { name: 'place' });
    log(`${NAME[f]} placed ${tileName(t)} at row ${r}, column ${c}`);
    if (typeof t.v === 'number' && t.v < 5) {
      if (effectPossible(S, t.v)) {
        S.mode = 'fx';
        emit('changed');
        return { ok: true };
      }
      log(`Effect of tile ${t.v} skipped: no valid target`);
    }
    scoreLines();
    return { ok: true };
  }

  /* ---- Effects ------------------------------------------------------------- */
  function useEffect() {
    if (S.mode !== 'fx') return fail('There is no effect to use');
    const v = S.last.t.v;
    const f = S.cur;
    if (v === 1 || v === 2) {
      S.fxf = v === 1 ? opp(f) : f;
      S.mode = 'src';
    } else if (v === 3) {
      S.mode = 'own';
    } else {
      S.last.t.down = true;
      emit('flip', { k: S.last.k });
      emit('sfx', { name: 'flip' });
      log(`The 4 turned face down`);
      S.mode = 'f4';
    }
    emit('changed');
    return { ok: true };
  }

  function endEffect() {
    S.mode = 'idle';
    S.src = null;
    S.sw = null;
    S.fxf = null;
    scoreLines();
    return { ok: true };
  }

  const skipEffect = () => endEffect();

  function pickSource(r, c) {
    const k = key(r, c);
    if (S.mode !== 'src') return fail('Not now');
    if (!movableTiles(S, S.fxf).includes(k)) return fail('Pick a tile of the right team that has an empty neighboring space and somewhere to go');
    S.src = k;
    S.mode = 'dst';
    emit('sfx', { name: 'select' });
    emit('changed');
    return { ok: true };
  }

  function putBack() {
    if (S.mode !== 'dst') return { ok: false };
    S.src = null;
    S.mode = 'src';
    emit('sfx', { name: 'select' });
    emit('changed');
    return { ok: true };
  }

  function pickDestination(r, c) {
    const k = key(r, c);
    if (S.mode !== 'dst') return fail('Not now');
    if (k === S.src) return putBack();
    if (!isLegal(S, S.fxf, r, c, S.src)) return fail('That tile cannot go there');
    S.b[k] = S.b[S.src];
    delete S.b[S.src];
    emit('move', { from: S.src, to: k });
    emit('sfx', { name: 'move' });
    log(`${NAME[S.fxf]} tile moved to row ${r}, column ${c}`);
    return endEffect();
  }

  function flipTarget(r, c) {
    if (S.mode !== 'f4') return fail('Not now');
    const ok = flipTargets(S, S.cur, S.last.r, S.last.c).some(([x, y]) => x === r && y === c);
    if (!ok) return fail('Pick a face-up opponent tile next to your 4');
    S.b[key(r, c)].down = true;
    emit('flip', { k: key(r, c) });
    emit('sfx', { name: 'flip' });
    log(`Opponent tile at row ${r}, column ${c} turned face down`);
    return endEffect();
  }

  function pickOwnToken(i) {
    if (S.mode === 'mkt' && S.sw === i) {
      S.sw = null;
      S.mode = 'own';
      emit('changed');
      return { ok: true };
    }
    if (S.mode !== 'own' && S.mode !== 'mkt') return fail('Not now');
    if (!S.won[S.cur][i]) return fail('Pick one of your tokens');
    S.sw = i;
    S.mode = 'mkt';
    emit('sfx', { name: 'select' });
    emit('changed');
    return { ok: true };
  }

  function pickMarket(i) {
    if (S.mode !== 'mkt') return fail('Pick one of your tokens first');
    const f = S.cur;
    const given = S.won[f].splice(S.sw, 1)[0];
    const taken = S.market[i];
    S.market[i] = given;
    S.won[f].push(taken);
    emit('sfx', { name: 'swap' });
    log(`${NAME[f]} swapped ${describe(given)} for ${describe(taken)}`);
    return endEffect();
  }

  /* ---- Scoring lines ------------------------------------------------------------- */
  function scoreLines() {
    const lines = completeLines(S);
    if (!lines.length) return nextTurn();
    if (lines.length === 1) return resolveLine(lines[0].id);
    S.pending = lines.map((l) => l.id);
    S.mode = 'line';
    emit('changed');
    return { ok: true };
  }

  function resolveLine(id) {
    const line = LINES.find((l) => l.id === id);
    if (!line || S.scored[id] || !line.cells.every((k) => S.b[k])) return fail('That line cannot be scored');
    const totals = lineTotals(S, line);
    const winner = totals.G !== totals.T ? (totals.G > totals.T ? 'G' : 'T') : S.cur;
    S.scored[id] = true;
    S.pending = [];
    S.line = { id, winner, totals, ends: line.ends.slice(), cells: line.cells.slice() };
    S.mode = 'tok';
    emit('score', { line: S.line });
    emit('sfx', { name: 'score' });
    log(`${id} scored: Greeks ${totals.G}, Trojans ${totals.T}. ${NAME[winner]} win the line${totals.G === totals.T ? ' (a tie goes to the active player)' : ''}`);
    emit('changed');
    return { ok: true };
  }

  function chooseToken(edgeKey) {
    if (S.mode !== 'tok' || !S.line.ends.includes(edgeKey)) return fail('Pick one of the two highlighted end tokens');
    const w = S.line.winner;
    const other = S.line.ends.find((x) => x !== edgeKey);
    const mine = S.edge[edgeKey];
    const theirs = S.edge[other];
    if (mine) S.won[w].push(mine);
    if (theirs) S.won[opp(w)].push(theirs);
    delete S.edge[edgeKey];
    delete S.edge[other];
    emit('token', { winner: w, taken: edgeKey, given: other });
    emit('sfx', { name: 'token' });
    log(`${NAME[w]} took ${mine ? describe(mine) : 'nothing'}; ${NAME[opp(w)]} got ${theirs ? describe(theirs) : 'nothing'}`);
    S.line = null;
    S.mode = 'idle';
    return scoreLines();
  }

  /* ---- End of game ----------------------------------------------------------------- */
  function finish() {
    S.mode = 'over';
    const a = evaluate(S, 'G');
    const b = evaluate(S, 'T');
    let w = null;
    let why = '';
    if (a.all !== b.all) {
      w = a.all ? 'G' : 'T';
      why = 'support of all five gods';
    } else {
      for (const [k, n] of [['pts', 'points'], ['low', 'lower god tokens'], ['z', 'the best Zeus token'], ['p', 'the best Poseidon token']]) {
        if (a[k] !== b[k]) {
          w = a[k] > b[k] ? 'G' : 'T';
          why = n;
          break;
        }
      }
    }
    S.result = { w, why, a, b };
    log(w ? `Game over. ${NAME[w]} win (${why})` : 'Game over. A draw');
    emit('over', { result: S.result });
    emit('changed');
    return { ok: true };
  }

  return {
    get state() { return S; },
    set state(value) { S = value; },
    newGame(first) {
      setup(first);
      log(`Battle begins: ${NAME[first]} move first`);
      emit('sfx', { name: 'start' });
      return startTurn();
    },
    selectHand,
    place,
    useEffect,
    skipEffect,
    pickSource,
    pickDestination,
    putBack,
    flipTarget,
    pickOwnToken,
    pickMarket,
    resolveLine,
    chooseToken,
    /** Whose decision the game is waiting for (the line winner picks tokens). */
    actor() {
      if (S.mode === 'tok') return S.line.winner;
      if (S.mode === 'over' || S.mode === 'idle') return null;
      return S.cur;
    }
  };
}

export function describe(t) {
  if (t.k === 'god') return `${t.g} ${t.v}`;
  if (t.k === 'wed') return 'Marriage';
  return `${t.n} ${t.v > 0 ? '+' : '−'}${Math.abs(t.v)}`;
}
