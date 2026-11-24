/**
 * Game page: "Iliad: Greeks vs Trojans".
 *
 * Renders the board, hands, racks and market from the engine's state, turns
 * clicks into engine actions, runs the computer opponent, the coin toss and
 * the end-of-game tally, and saves the game so a refresh can continue it.
 */
import '../core/site.js';
import { createGame, NAME, EFFECTS, LINES, key, parse, colorOf, inGrid, destinations, movableTiles, flipTargets, opp, tallyRows, describe, GODS, HEROES, HARDSHIPS } from '../game/engine.js';
import * as art from '../game/art.js';
import * as ai from '../game/ai.js';
import * as audio from '../game/audio.js';

const SAVE_KEY = 'iliad-game-save-v1';
const AI_DELAY = 750;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const el = {
  game: $('#game'),
  board: $('[data-board]'),
  market: $('[data-market]'),
  hint: $('[data-hint]'),
  acts: $('[data-acts]'),
  turnCoin: $('[data-turn-coin]'),
  turnNum: $('[data-turn-num]'),
  turnTeam: $('[data-turn-team]'),
  start: $('[data-start]'),
  toss: $('[data-toss]'),
  tossCoin: $('[data-toss-coin]'),
  tossMsg: $('[data-toss-msg]'),
  log: $('[data-log]'),
  logDialog: $('#dlg-log'),
  winDialog: $('#dlg-win'),
  tip: $('[data-tip]'),
  sides: { G: $('[data-side="G"]'), T: $('[data-side="T"]') }
};

/* ---------------------------------------------------------------------- */
/* State                                                                   */
/* ---------------------------------------------------------------------- */

let ui = {
  mode: 'two',     // 'two' | 'ai-G' (you are Greeks) | 'ai-T' (you are Trojans)
  log: [],
  fx: {}           // one-shot animation flags by cell key: 'new' | 'flip' | 'moved'
};
let aiTimer = null;
let tallyTimers = [];
let renderQueued = false;

const game = createGame(onEvent);

/** The faction played by the computer, if any. */
const aiFaction = () => (ui.mode === 'ai-G' ? 'T' : ui.mode === 'ai-T' ? 'G' : null);
const isHuman = (f) => f && f !== aiFaction();

/* ---------------------------------------------------------------------- */
/* Engine events                                                            */
/* ---------------------------------------------------------------------- */

function onEvent(type, p) {
  switch (type) {
    case 'log':
      ui.log.push({ turn: p.turn, text: p.text, err: p.err });
      if (ui.log.length > 400) ui.log.shift();
      renderLogEntry(ui.log[ui.log.length - 1]);
      break;
    case 'sfx':
      audio.sfx(p.name);
      break;
    case 'place':
      ui.fx[p.k] = 'new';
      break;
    case 'move':
      ui.fx[p.to] = 'moved';
      break;
    case 'flip':
      ui.fx[p.k] = 'flip';
      break;
    case 'score':
      flashLine(p.line);
      break;
    case 'turn':
      flipTurnCoin(p.cur);
      break;
    case 'over':
      audio.music(false);
      setTimeout(startTally, 600);
      break;
    default:
      break;
  }
  queueRender();
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
    save();
    scheduleAI();
  });
}

/* ---------------------------------------------------------------------- */
/* Board construction                                                       */
/* ---------------------------------------------------------------------- */

function buildBoard() {
  let html = '';
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const area = `grid-area:${r + 1}/${c + 1}`;
      if (inGrid(r, c)) {
        const f = colorOf(r, c);
        html += `<button type="button" class="g-cell g-cell--${f}" style="${area}" data-cell="${key(r, c)}" aria-label="Row ${r}, column ${c}, ${f === 'G' ? 'blue' : 'red'} space"></button>`;
      } else if (r % 7 === 0 && c % 7 === 0) {
        html += `<div class="g-corner" style="${area}" aria-hidden="true">${art.cornerKey()}</div>`;
      } else {
        html += `<button type="button" class="g-ring" style="${area}" data-ring="${key(r, c)}" tabindex="-1"></button>`;
      }
    }
  }
  el.board.innerHTML = html;
}

/* ---------------------------------------------------------------------- */
/* Rendering                                                                */
/* ---------------------------------------------------------------------- */

const teamWord = (f) => (f === 'G' ? 'blue' : 'red');

function render() {
  const S = game.state;
  const actor = game.actor();
  const humanTurn = isHuman(actor);
  el.game.dataset.mode = S.mode;
  el.game.dataset.cur = S.cur;

  // Turn header
  el.turnNum.textContent = S.started ? `Turn ${S.turn}` : 'Ready';
  el.turnTeam.textContent = S.started ? (S.mode === 'over' ? 'The war is over' : `${NAME[S.cur]} to move`) : 'Start a new game';
  if (!el.turnCoin.dataset.face) setCoinFace(S.cur);

  renderBoard(S, humanTurn);
  renderMarket(S, humanTurn);
  ['G', 'T'].forEach((f) => renderSide(S, f, humanTurn));
  renderPrompt(S, actor, humanTurn);
  ui.fx = {};
}

function renderBoard(S, humanTurn) {
  const valid = new Set();
  const pickable = new Set();
  const targets = new Set();
  if (humanTurn) {
    if (S.mode === 'place' && S.sel !== null) destinations(S, S.cur).forEach(([r, c]) => valid.add(key(r, c)));
    if (S.mode === 'src') movableTiles(S, S.fxf).forEach((k) => pickable.add(k));
    if (S.mode === 'dst') destinations(S, S.fxf, S.src).forEach(([r, c]) => valid.add(key(r, c)));
    if (S.mode === 'f4') flipTargets(S, S.cur, S.last.r, S.last.c).forEach(([r, c]) => targets.add(key(r, c)));
  }

  // Ghost of the selected tile, shown on hover over legal spaces
  let ghost = '';
  if (S.mode === 'place' && S.sel !== null && S.hand[S.cur][S.sel]) {
    ghost = `url("${art.dataUri(art.tile(S.cur, S.hand[S.cur][S.sel].v))}")`;
  } else if (S.mode === 'dst' && S.src && S.b[S.src]) {
    const t = S.b[S.src];
    ghost = `url("${art.dataUri(t.down ? art.tileBack(t.f) : art.tile(t.f, t.v))}")`;
  }
  el.board.style.setProperty('--ghost', ghost || 'none');

  $$('[data-cell]', el.board).forEach((cell) => {
    const k = cell.dataset.cell;
    const [r, c] = parse(k);
    const t = S.b[k];
    const lifted = S.mode === 'dst' && S.src === k;
    cell.classList.toggle('is-valid', valid.has(k));
    cell.classList.toggle('is-pickable', pickable.has(k));
    cell.classList.toggle('is-target', targets.has(k));
    cell.classList.toggle('is-lifted', lifted);
    cell.classList.toggle('is-last', !!(S.last && S.last.k === k));
    const fx = ui.fx[k];
    const face = t ? (t.down ? art.tileBack(t.f) : art.tile(t.f, t.v)) : '';
    const sig = t ? `${t.f}${t.v}${t.down ? 'd' : ''}` : '';
    if (cell.dataset.sig !== sig || fx) {
      cell.innerHTML = t ? `<span class="g-tile${fx ? ` is-${fx}` : ''}">${face}</span>` : '';
      cell.dataset.sig = sig;
    }
    const what = t ? (t.down ? `${NAME[t.f]} tile, face down` : `${NAME[t.f]} ${t.v === 'D' ? 'Dolos' : `tile ${t.v}`}`) : 'empty';
    cell.setAttribute('aria-label', `Row ${r}, column ${c}, ${teamWord(colorOf(r, c))} space, ${what}${valid.has(k) ? ', legal move' : ''}`);
  });

  // Ring tokens
  const choosing = S.mode === 'tok' ? S.line.ends : [];
  const humanChooses = S.mode === 'tok' && isHuman(S.line.winner);
  $$('[data-ring]', el.board).forEach((slot) => {
    const k = slot.dataset.ring;
    const t = S.edge[k];
    const choice = choosing.includes(k);
    slot.classList.toggle('is-choice', choice);
    slot.classList.toggle('is-empty', !t);
    slot.tabIndex = choice && humanChooses ? 0 : -1;
    const sig = t ? art.tokenKey(t) : '';
    if (slot.dataset.sig !== sig) {
      slot.innerHTML = t ? `<span class="g-token">${art.token(t)}</span>` : '';
      slot.dataset.sig = sig;
    }
    slot.setAttribute('aria-label', t ? describe(t) : 'Empty token slot');
    if (t) slot.dataset.tipText = tokenTip(t);
    else delete slot.dataset.tipText;
  });

  // Line highlight while the reader hovers a line choice
  $$('[data-cell]', el.board).forEach((cell) => cell.classList.remove('is-line'));
}

function renderMarket(S, humanTurn) {
  const picking = humanTurn && S.mode === 'mkt';
  el.market.innerHTML = S.market
    .map(
      (t, i) =>
        `<button type="button" class="g-mtoken${picking ? ' is-pickable' : ''}" data-market-i="${i}" aria-label="Market token: ${esc(describe(t))}" data-tip-text="${esc(tokenTip(t))}"${picking ? '' : ' aria-disabled="true"'}>${art.token(t)}</button>`
    )
    .join('');
}

function renderSide(S, f, humanTurn) {
  const side = el.sides[f];
  const active = S.started && S.cur === f && S.mode !== 'over';
  side.classList.toggle('is-active', active);
  side.classList.toggle('is-ai', aiFaction() === f);

  $('[data-side-coin]', side).innerHTML = art.coin(f);
  const badge = $('[data-side-badge]', side);
  badge.textContent = aiFaction() === f ? (active ? 'Thinking…' : 'Computer') : active ? 'Your move' : '';
  badge.hidden = !badge.textContent;

  // Hand
  const canPick = active && humanTurn && S.mode === 'place';
  $('[data-hand]', side).innerHTML = [0, 1]
    .map((i) => {
      const t = S.hand[f][i];
      if (!t) return '<span class="g-slot is-empty" aria-hidden="true"></span>';
      const selected = active && S.sel === i && S.mode === 'place';
      return `<button type="button" class="g-slot${selected ? ' is-selected' : ''}" data-hand-i="${i}" data-faction="${f}" aria-pressed="${selected}" aria-label="${NAME[f]} ${t.v === 'D' ? 'Dolos' : `tile ${t.v}`}: ${esc(EFFECTS[t.v][0])}"${canPick ? '' : ' aria-disabled="true"'} data-tip-text="${esc(tileTip(t))}">${art.tile(f, t.v)}</button>`;
    })
    .join('');

  // Deck
  const deck = $('[data-deck]', side);
  deck.innerHTML = `${art.deck(f)}<span>${S.deck[f].length}</span>`;
  deck.classList.toggle('is-empty', !S.deck[f].length);
  deck.setAttribute('aria-label', `${S.deck[f].length} tiles left in the deck`);

  // Selected tile info
  const info = $('[data-tile-info]', side);
  const sel = active && S.sel !== null && S.mode === 'place' ? S.hand[f][S.sel] : null;
  info.innerHTML = sel ? `<strong>${sel.v === 'D' ? 'Dolos' : `Tile ${sel.v}`}:</strong> ${esc(EFFECTS[sel.v][1])}` : '';

  // Rack of won tokens
  const giving = active && humanTurn && (S.mode === 'own' || S.mode === 'mkt');
  $('[data-rack-count]', side).textContent = S.won[f].length;
  $('[data-rack]', side).innerHTML = S.won[f].length
    ? S.won[f]
        .map(
          (t, i) =>
            `<button type="button" class="g-rtoken${giving ? ' is-pickable' : ''}${S.mode === 'mkt' && active && S.sw === i ? ' is-picked' : ''}" data-rack-i="${i}" data-faction="${f}" aria-label="${esc(describe(t))}" data-tip-text="${esc(tokenTip(t))}"${giving ? '' : ' aria-disabled="true"'}>${art.token(t)}</button>`
        )
        .join('')
    : '<p class="g-rack__empty">No tokens yet</p>';
}

function tileTip(t) {
  const [title, text] = EFFECTS[t.v];
  return `${t.v === 'D' ? 'Dolos' : `Tile ${t.v}`}: ${title}. ${text}`;
}

function tokenTip(t) {
  if (t.k === 'god') return `${t.g} ${t.v}: support of ${t.g}. Your best ${t.g} token scores; lower ones break ties.`;
  if (t.k === 'wed') return 'Marriage: two marriages count as a fifth god for the "all five gods" victory.';
  return `${t.n}: ${t.v > 0 ? '+' : '−'}${Math.abs(t.v)} points.`;
}

/* ---------------------------------------------------------------------- */
/* Prompt: hint text and action buttons                                     */
/* ---------------------------------------------------------------------- */

function renderPrompt(S, actor, humanTurn) {
  let hint = '';
  let acts = [];
  const who = actor ? NAME[actor] : '';

  if (!S.started) {
    hint = 'Choose a mode and start a new game.';
  } else if (S.mode === 'over') {
    const R = S.result;
    hint = R && R.w ? `${NAME[R.w]} win the Trojan War, decided by ${R.why}.` : 'The war ends in a draw.';
    acts = [['Show result', showWin, 'primary'], ['New game', openStart]];
  } else if (!humanTurn) {
    hint = `${who} (computer) ${S.mode === 'tok' ? 'is choosing a token' : 'is thinking'}…`;
  } else {
    switch (S.mode) {
      case 'place':
        hint = S.sel === null
          ? `${who}: choose a tile from your hand.`
          : `${who}: place it on a glowing ${teamWord(S.cur)} space that touches a tile.`;
        break;
      case 'fx': {
        const v = S.last.t.v;
        hint = `${who}: use the effect of tile ${v}? ${EFFECTS[v][0]}.`;
        acts = [['Use effect', () => game.useEffect(), 'primary'], ['Skip', () => game.skipEffect()]];
        break;
      }
      case 'src':
        hint = `${who}: pick ${S.fxf === S.cur ? 'one of your tiles' : 'an opponent tile'} to move.`;
        acts = [['Skip effect', () => game.skipEffect()]];
        break;
      case 'dst':
        hint = `${who}: pick a glowing space for it, or click it again to put it back.`;
        acts = [['Put back', () => game.putBack()], ['Skip effect', () => game.skipEffect()]];
        break;
      case 'f4':
        hint = `${who}: pick a neighboring face-up enemy tile to turn face down.`;
        break;
      case 'own':
        hint = `${who}: pick one of your tokens to give up.`;
        acts = [['Skip effect', () => game.skipEffect()]];
        break;
      case 'mkt':
        hint = `${who}: now pick a market token to take.`;
        acts = [['Skip effect', () => game.skipEffect()]];
        break;
      case 'line':
        hint = `${who}: several lines are complete. Score which first?`;
        acts = S.pending.map((id) => [id, () => game.resolveLine(id), '', id]);
        break;
      case 'tok': {
        const L = S.line;
        hint = `${NAME[L.winner]} win ${L.id} (Greeks ${L.totals.G}, Trojans ${L.totals.T}). Take one end token; the other goes to the ${NAME[opp(L.winner)]}.`;
        acts = L.ends.map((k) => [S.edge[k] ? describe(S.edge[k]) : 'Empty', () => game.chooseToken(k), '', null, k]);
        break;
      }
      default:
        break;
    }
  }

  el.hint.textContent = hint;
  el.acts.innerHTML = '';
  acts.forEach(([label, fn, kind, lineId, edgeKey]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn btn--sm${kind === 'primary' ? '' : ' btn--ghost'}`;
    b.textContent = label;
    b.addEventListener('click', () => {
      audio.unlock();
      fn();
    });
    if (lineId) {
      const line = LINES.find((l) => l.id === lineId);
      const on = (v) => line.cells.forEach((k) => $(`[data-cell="${k}"]`, el.board)?.classList.toggle('is-line', v));
      b.addEventListener('mouseenter', () => on(true));
      b.addEventListener('mouseleave', () => on(false));
      b.addEventListener('focus', () => on(true));
      b.addEventListener('blur', () => on(false));
    }
    if (edgeKey) {
      const ring = () => $(`[data-ring="${edgeKey}"]`, el.board);
      b.addEventListener('mouseenter', () => ring()?.classList.add('is-hover'));
      b.addEventListener('mouseleave', () => ring()?.classList.remove('is-hover'));
    }
    el.acts.appendChild(b);
  });
}

/* ---------------------------------------------------------------------- */
/* Animations                                                               */
/* ---------------------------------------------------------------------- */

function setCoinFace(f) {
  el.turnCoin.dataset.face = f;
  el.turnCoin.innerHTML = art.coin(f, { label: `${NAME[f]} to move` });
}

function flipTurnCoin(f) {
  const coinEl = el.turnCoin;
  coinEl.classList.remove('is-flipping');
  void coinEl.offsetWidth;
  coinEl.classList.add('is-flipping');
  setTimeout(() => setCoinFace(f), 280);
  setTimeout(() => coinEl.classList.remove('is-flipping'), 620);
}

function flashLine(line) {
  setTimeout(() => {
    line.cells.forEach((k) => {
      const cell = $(`[data-cell="${k}"]`, el.board);
      if (!cell) return;
      cell.classList.remove('is-scored', 'is-scored-G', 'is-scored-T');
      void cell.offsetWidth;
      cell.classList.add('is-scored', `is-scored-${line.winner}`);
      setTimeout(() => cell.classList.remove('is-scored', 'is-scored-G', 'is-scored-T'), 1400);
    });
  }, 30);
}

/* ---------------------------------------------------------------------- */
/* Input                                                                    */
/* ---------------------------------------------------------------------- */

el.game.addEventListener('click', (event) => {
  audio.unlock();
  const S = game.state;
  const actor = game.actor();
  if (!S.started || S.mode === 'over' || !isHuman(actor)) return;

  const cell = event.target.closest('[data-cell]');
  const ring = event.target.closest('[data-ring]');
  const hand = event.target.closest('[data-hand-i]');
  const rack = event.target.closest('[data-rack-i]');
  const mkt = event.target.closest('[data-market-i]');

  let result = null;
  if (hand) {
    if (hand.dataset.faction !== S.cur || S.mode !== 'place') return shake(hand);
    result = game.selectHand(Number(hand.dataset.handI));
  } else if (cell) {
    const [r, c] = parse(cell.dataset.cell);
    if (S.mode === 'place') result = game.place(r, c);
    else if (S.mode === 'src') result = game.pickSource(r, c);
    else if (S.mode === 'dst') result = game.pickDestination(r, c);
    else if (S.mode === 'f4') result = game.flipTarget(r, c);
    else return;
    if (result && !result.ok) shake(cell.querySelector('.g-tile') || cell);
  } else if (ring && S.mode === 'tok') {
    result = game.chooseToken(ring.dataset.ring);
    if (!result.ok) shake(ring);
  } else if (rack && (S.mode === 'own' || S.mode === 'mkt')) {
    if (rack.dataset.faction !== S.cur) {
      shake(rack);
      return;
    }
    result = game.pickOwnToken(Number(rack.dataset.rackI));
  } else if (mkt && S.mode === 'mkt') {
    result = game.pickMarket(Number(mkt.dataset.marketI));
  }
  if (result && !result.ok) flashHint(result.error);
});

function shake(node) {
  if (!node) return;
  node.classList.remove('is-shaking');
  void node.offsetWidth;
  node.classList.add('is-shaking');
  setTimeout(() => node.classList.remove('is-shaking'), 400);
  audio.sfx('error');
}

function flashHint(text) {
  if (!text) return;
  el.hint.textContent = text;
  el.hint.classList.remove('is-error');
  void el.hint.offsetWidth;
  el.hint.classList.add('is-error');
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
  const S = game.state;
  if (!isHuman(game.actor())) return;
  if (S.mode === 'place' && S.sel !== null) game.selectHand(S.sel);
  else if (S.mode === 'dst') game.putBack();
  else if (S.mode === 'mkt') game.pickOwnToken(S.sw);
});

/* Tooltips for tiles and tokens (hover / keyboard focus) */
function showTip(target) {
  const text = target?.dataset.tipText;
  if (!text) return hideTip();
  el.tip.textContent = text;
  el.tip.hidden = false;
  const r = target.getBoundingClientRect();
  const w = el.tip.offsetWidth;
  const h = el.tip.offsetHeight;
  el.tip.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8))}px`;
  el.tip.style.top = `${r.top - h - 10 < 8 ? r.bottom + 10 : r.top - h - 10}px`;
}
function hideTip() {
  el.tip.hidden = true;
}
el.game.addEventListener('pointerover', (event) => {
  if (event.pointerType !== 'mouse') return;
  const target = event.target.closest('[data-tip-text]');
  if (target) showTip(target);
});
el.game.addEventListener('pointerout', (event) => {
  if (event.target.closest('[data-tip-text]')) hideTip();
});
el.game.addEventListener('focusin', (event) => showTip(event.target.closest('[data-tip-text]')));
el.game.addEventListener('focusout', hideTip);
window.addEventListener('scroll', hideTip, { passive: true });

/* ---------------------------------------------------------------------- */
/* Computer opponent                                                        */
/* ---------------------------------------------------------------------- */

function scheduleAI() {
  clearTimeout(aiTimer);
  const S = game.state;
  const f = aiFaction();
  if (!f || !S.started || S.mode === 'over' || !el.toss.hidden || !el.start.hidden) return;
  if (game.actor() !== f) return;
  aiTimer = setTimeout(aiStep, AI_DELAY);
}

function aiStep() {
  const S = game.state;
  const f = aiFaction();
  if (!f || game.actor() !== f) return;
  switch (S.mode) {
    case 'place': {
      const plan = ai.choosePlacement(S, f);
      if (!plan) return;
      if (S.sel !== plan.i) game.selectHand(plan.i);
      setTimeout(() => {
        if (game.state.mode === 'place' && game.actor() === f) game.place(plan.r, plan.c);
      }, 450);
      break;
    }
    case 'fx':
      if (ai.wantsEffect(S)) game.useEffect();
      else game.skipEffect();
      break;
    case 'f4': {
      const [r, c] = ai.chooseFlip(S);
      game.flipTarget(r, c);
      break;
    }
    case 'line':
      game.resolveLine(ai.chooseLine(S, f));
      break;
    case 'tok':
      game.chooseToken(ai.chooseToken(S, f));
      break;
    default:
      game.skipEffect();
  }
}

/* ---------------------------------------------------------------------- */
/* Start screen and coin toss                                               */
/* ---------------------------------------------------------------------- */

function openStart() {
  clearTimeout(aiTimer);
  const S = game.state;
  const canContinue = S.started && S.mode !== 'over';
  $('[data-continue]').hidden = !canContinue;
  $$('[name="g-mode"]').forEach((input) => { input.checked = input.value === ui.mode; });
  el.start.hidden = false;
  el.winDialog.open && el.winDialog.close();
  (canContinue ? $('[data-continue]') : $('[data-new-game]')).focus({ preventScroll: true });
}

function closeStart() {
  el.start.hidden = true;
  scheduleAI();
}

function newGame() {
  audio.unlock();
  ui.mode = $('[name="g-mode"]:checked')?.value || 'two';
  ui.log = [];
  el.log.innerHTML = '';
  stopTally();
  el.start.hidden = true;
  runToss();
}

function runToss() {
  const first = Math.random() < 0.5 ? 'G' : 'T';
  el.toss.hidden = false;
  el.tossMsg.textContent = 'Tossing the coin…';
  el.tossCoin.innerHTML = `<div class="g-tosscoin__face g-tosscoin__face--G">${art.coin('G')}</div><div class="g-tosscoin__face g-tosscoin__face--T">${art.coin('T')}</div>`;
  el.tossCoin.style.setProperty('--end', first === 'G' ? '1800deg' : '1980deg');
  el.tossCoin.classList.remove('is-tossing');
  void el.tossCoin.offsetWidth;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    el.tossCoin.classList.add('is-tossing');
    audio.sfx('coin');
  }, reduce ? 0 : 300);
  setTimeout(() => {
    audio.sfx('land');
    el.tossMsg.textContent = `${NAME[first]} go first`;
  }, reduce ? 100 : 2100);
  setTimeout(() => {
    el.toss.hidden = true;
    setCoinFace(first);
    game.newGame(first);
    audio.music(true);
  }, reduce ? 600 : 3100);
}

$('[data-new-game]').addEventListener('click', newGame);
$('[data-continue]').addEventListener('click', () => {
  ui.mode = $('[name="g-mode"]:checked')?.value || ui.mode;
  audio.unlock();
  audio.music(true);
  closeStart();
  queueRender();
});
$$('[data-open-start]').forEach((b) => b.addEventListener('click', openStart));

/* Restart asks for a second press within 3 seconds */
let restartTimer = null;
$('[data-restart]').addEventListener('click', (event) => {
  const b = event.currentTarget;
  const label = $('span', b);
  if (b.dataset.armed) {
    clearTimeout(restartTimer);
    delete b.dataset.armed;
    label.textContent = 'Restart';
    newGame();
  } else {
    b.dataset.armed = 'true';
    label.textContent = 'Sure?';
    restartTimer = setTimeout(() => {
      delete b.dataset.armed;
      label.textContent = 'Restart';
    }, 3000);
  }
});

/* ---------------------------------------------------------------------- */
/* Chronicle (log)                                                          */
/* ---------------------------------------------------------------------- */

function renderLogEntry(entry) {
  if (!entry) return;
  const li = document.createElement('li');
  li.className = entry.err ? 'is-error' : '';
  li.innerHTML = `<span>T${entry.turn}</span>${esc(entry.text)}`;
  el.log.appendChild(li);
  el.log.scrollTop = el.log.scrollHeight;
}

$('[data-open-log]').addEventListener('click', () => {
  el.logDialog.showModal();
  el.log.scrollTop = el.log.scrollHeight;
});
$$('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
$$('dialog').forEach((d) => d.addEventListener('click', (event) => { if (event.target === d) d.close(); }));

/* ---------------------------------------------------------------------- */
/* End of game: tally, then the result                                      */
/* ---------------------------------------------------------------------- */

const ptsText = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

function stopTally() {
  tallyTimers.forEach(clearTimeout);
  tallyTimers = [];
  el.game.classList.remove('is-tallying');
  $$('.g-float').forEach((n) => n.remove());
  $$('.g-rtoken').forEach((n) => n.classList.remove('is-counting', 'is-counted', 'is-dim'));
  $$('[data-side-total]').forEach((n) => { n.hidden = true; });
}

function startTally() {
  const S = game.state;
  if (!S.result) return;
  stopTally();
  render();
  el.game.classList.add('is-tallying');
  const rows = { G: tallyRows(S, 'G'), T: tallyRows(S, 'T') };
  const totals = { G: 0, T: 0 };
  const n = Math.max(rows.G.length, rows.T.length);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = reduce ? 40 : 420;
  ['G', 'T'].forEach((f) => {
    const badge = $('[data-side-total]', el.sides[f]);
    badge.hidden = false;
    badge.textContent = '0';
  });
  el.hint.textContent = 'Counting the spoils of war…';
  el.acts.innerHTML = '';
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'btn btn--sm btn--ghost';
  skip.textContent = 'Skip';
  skip.addEventListener('click', endTally);
  el.acts.appendChild(skip);

  for (let s = 0; s < n; s += 1) {
    tallyTimers.push(setTimeout(() => {
      ['G', 'T'].forEach((f) => {
        const row = rows[f][s];
        if (!row) return;
        const chip = $$(`[data-rack-i]`, el.sides[f])[row.i];
        if (!chip) return;
        $$('.is-counting', el.sides[f]).forEach((x) => x.classList.remove('is-counting'));
        chip.classList.add('is-counting', row.low ? 'is-dim' : 'is-counted');
        const r = chip.getBoundingClientRect();
        const fl = document.createElement('span');
        fl.className = `g-float ${row.low ? 'is-dim' : row.pts > 0 ? 'is-pos' : row.pts < 0 ? 'is-neg' : 'is-dim'}`;
        fl.textContent = row.low ? '—' : ptsText(row.pts);
        fl.style.left = `${r.left + r.width / 2}px`;
        fl.style.top = `${r.top - 4}px`;
        document.body.appendChild(fl);
        setTimeout(() => fl.remove(), 950);
        totals[f] += row.pts;
        $('[data-side-total]', el.sides[f]).textContent = String(totals[f]);
      });
      audio.sfx('tally');
    }, 500 + s * step));
  }
  tallyTimers.push(setTimeout(() => {
    ['G', 'T'].forEach((f) => {
      const e = f === 'G' ? S.result.a : S.result.b;
      $('[data-side-total]', el.sides[f]).textContent = e.all ? `${e.pts} · all gods` : String(e.pts);
    });
    audio.sfx('total');
  }, 500 + n * step + 400));
  tallyTimers.push(setTimeout(endTally, 500 + n * step + 1500));
}

function endTally() {
  const S = game.state;
  stopTally();
  audio.sfx(S.result && S.result.w ? 'win' : 'draw');
  render();
  showWin();
}

function showWin() {
  const S = game.state;
  const R = S.result;
  if (!R) return;
  const you = aiFaction() ? opp(aiFaction()) : null;
  let title = R.w ? `${NAME[R.w]} win` : 'A draw';
  if (you && R.w) title = R.w === you ? 'Victory' : 'Defeat';
  $('[data-win-emblem]').innerHTML = R.w ? art.coin(R.w) : `${art.coin('G')}${art.coin('T')}`;
  $('[data-win-title]').textContent = title;
  $('[data-win-why]').textContent = R.w ? `${NAME[R.w]} win the Trojan War, decided by ${R.why}.` : 'Every tie-break is level.';

  const column = (f, e) => {
    const rows = tallyRows(S, f);
    return `<div class="g-result g-result--${f}">
      <h3>${NAME[f]} <span>${e.pts} pts</span></h3>
      <ul role="list">${rows.length ? rows.map((r) => `<li class="${r.low ? 'is-dim' : ''}"><span class="g-result__tok">${art.token(r.t)}</span><span>${esc(describe(r.t))}${r.low ? ' <small>(tie-break only)</small>' : ''}</span><b>${ptsText(r.pts)}</b></li>`).join('') : '<li class="is-dim"><span>No tokens won</span></li>'}</ul>
      <p>Gods: <b>${e.gods} of 5</b> · Marriages: <b>${e.weddings} of 2</b>${e.all ? ' · <b>all five gods</b>' : ''}<br>Tie-breaks: lower gods <b>${e.low}</b> · best Zeus <b>${e.z}</b> · best Poseidon <b>${e.p}</b></p>
    </div>`;
  };
  $('[data-win-detail]').innerHTML = column('G', R.a) + column('T', R.b);
  if (!el.winDialog.open) el.winDialog.showModal();
}

$('[data-play-again]').addEventListener('click', () => {
  el.winDialog.close();
  openStart();
});
$('[data-view-board]').addEventListener('click', () => el.winDialog.close());

/* ---------------------------------------------------------------------- */
/* Sound settings                                                           */
/* ---------------------------------------------------------------------- */

function syncSound() {
  const cfg = audio.settings.get();
  $('[data-vol-music]').value = Math.round(cfg.music * 100);
  $('[data-vol-sfx]').value = Math.round(cfg.sfx * 100);
  const mute = $('[data-mute]');
  mute.setAttribute('aria-pressed', String(cfg.muted));
  mute.innerHTML = `${art.icon(cfg.muted ? 'mute' : 'sound')}<span>${cfg.muted ? 'Muted' : 'Sound'}</span>`;
}
$('[data-vol-music]').addEventListener('input', (e) => audio.settings.set({ music: e.target.value / 100 }));
$('[data-vol-sfx]').addEventListener('input', (e) => audio.settings.set({ sfx: e.target.value / 100 }));
$('[data-vol-sfx]').addEventListener('change', () => audio.sfx('place'));
$('[data-mute]').addEventListener('click', () => {
  audio.unlock();
  audio.settings.set({ muted: !audio.settings.get().muted });
  syncSound();
});

/* ---------------------------------------------------------------------- */
/* Save and restore                                                         */
/* ---------------------------------------------------------------------- */

function save() {
  const S = game.state;
  if (!S.started) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ S, mode: ui.mode, log: ui.log.slice(-200) }));
  } catch {
    /* storage full or unavailable */
  }
}

function restore() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.S || !data.S.started) return false;
    // The last-placed tile must be the same object as the board tile.
    if (data.S.last && data.S.b[data.S.last.k]) data.S.last.t = data.S.b[data.S.last.k];
    game.state = data.S;
    ui.mode = data.mode || 'two';
    ui.log = data.log || [];
    el.log.innerHTML = '';
    ui.log.forEach(renderLogEntry);
    setCoinFace(data.S.cur);
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------------- */
/* Pieces legend (all assets)                                               */
/* ---------------------------------------------------------------------- */

function renderLegend() {
  const tiles = $('[data-legend-tiles]');
  if (tiles) {
    tiles.innerHTML = [1, 2, 3, 4, 5, 'D']
      .map((v) => `<li><span class="g-legend__pair">${art.tile('G', v)}${art.tile('T', v)}</span><strong>${v === 'D' ? 'Dolos' : `Tile ${v}`}</strong><span>${esc(EFFECTS[v][1])}</span></li>`)
      .join('') +
      `<li><span class="g-legend__pair">${art.tileBack('G')}${art.tileBack('T')}</span><strong>Face down</strong><span>Scores 0 in a line.</span></li>`;
  }
  const tokens = $('[data-legend-tokens]');
  if (tokens) {
    const list = [];
    Object.entries(GODS).forEach(([g, values]) => list.push([{ k: 'god', g, v: values[0] }, `${g}: ${values.join(', ')}`]));
    HEROES.forEach(([n, v]) => list.push([{ k: 'pos', n, v }, `${n}: +${v}`]));
    HARDSHIPS.forEach(([n, v]) => list.push([{ k: 'neg', n, v }, `${n}: −${Math.abs(v)}`]));
    list.push([{ k: 'wed', v: 0 }, 'Marriage (two in the game)']);
    tokens.innerHTML = list.map(([t, text]) => `<li>${art.token(t)}<span>${esc(text)}</span></li>`).join('');
  }
  const coins = $('[data-legend-coins]');
  if (coins) coins.innerHTML = `${art.coin('G')}${art.coin('T')}${art.deck('G')}${art.deck('T')}`;
}

/* ---------------------------------------------------------------------- */
/* Boot                                                                     */
/* ---------------------------------------------------------------------- */

buildBoard();
renderLegend();
syncSound();
$('[data-open-log]').innerHTML = `${art.icon('log')}<span>Chronicle</span>`;
$$('[data-open-start]').forEach((b) => { if (b.classList.contains('tool')) b.innerHTML = `${art.icon('menu')}<span>Menu</span>`; });
$('[data-restart]').innerHTML = `${art.icon('restart')}<span>Restart</span>`;

const restored = restore();
render();
if (restored && game.state.mode === 'over') {
  el.start.hidden = true;
} else {
  openStart();
}
