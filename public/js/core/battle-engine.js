/**
 * battle-engine.js — "Battle of Troy", the visual-novel quiz.
 *
 * Flow:  title screen → choose a side → the Muse's prologue → three duels
 *        → victory or defeat ending → results.
 *
 * Each duel is a scene (plain, river, ships, gate) with the player's hero on
 * the left and a champion on the right. The champion asks quiz questions in
 * the dialogue box. A right answer makes your hero lunge and strike; a wrong
 * one lets the enemy strike you. Three right answers in a row trigger an
 * "aristeia" (a hero's moment of glory) for extra damage.
 *
 * The script lives in /data/battle.json; questions come from /data/quiz.json.
 */
import { load, loadProfiles, shuffle, esc, store } from './api.js';
import { figureSVG } from './figures.js';

const BEST_KEY = 'iliad:battle:best';
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const KEYS = ['A', 'B', 'C', 'D'];
const ABORT = 'battle-aborted';
const TYPE_SPEED = 18; // ms per character

/* ------------------------------------------------------------------------ */
/* Static markup                                                             */
/* ------------------------------------------------------------------------ */

/** Painted backdrop. Layers are shown or hidden per scene by vn.css. */
const BACKDROP = `
<svg class="vn__bg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="vn-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color:var(--vn-sky-top)"/>
      <stop offset="1" style="stop-color:var(--vn-sky-bottom)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#vn-sky)"/>
  <g transform="translate(0 -80)">
  <circle class="vn-sun" cx="610" cy="150" r="44"/>
  <path class="vn-hills" d="M0 300 C120 250 220 270 320 285 C430 300 520 250 640 262 C720 270 770 285 800 280 V600 H0 Z"/>
  <g class="vn-sea"><rect x="0" y="292" width="800" height="40"/></g>
  <g class="vn-ships">
    <path d="M40 300 h70 l-10 14 h-50 Z M72 300 V262 l22 30 Z"/>
    <path d="M150 304 h58 l-8 12 h-42 Z M176 304 V272 l18 26 Z"/>
    <path d="M250 300 h64 l-9 13 h-46 Z M280 300 V266 l20 28 Z"/>
  </g>
  <g class="vn-walls">
    <path d="M420 330 V248 h12 v-10 h10 v10 h14 v-10 h10 v10 h14 v-10 h10 v10 h14 v-10 h10 v10 h14 V330 Z"/>
    <path d="M538 330 V222 h14 v-14 h12 v14 h14 v-14 h12 v14 h14 V330 Z"/>
    <path d="M618 330 V250 h12 v-10 h10 v10 h14 v-10 h10 v10 h14 v-10 h10 v10 h14 v-10 h10 v10 h14 v-10 h10 v10 h12 V330 Z"/>
    <path class="vn-gate" d="M554 330 V286 a16 16 0 0 1 32 0 V330 Z"/>
  </g>
  <path class="vn-ground" d="M0 322 C200 310 400 318 800 312 V600 H0 Z"/>
  <path class="vn-river" d="M0 372 C140 352 260 392 420 370 C560 352 680 386 800 366 V396 C680 414 560 382 420 400 C260 420 140 382 0 402 Z"/>
  <path class="vn-ground-line" d="M0 322 C200 310 400 318 800 312"/>
  </g>
</svg>`;

const SPEAR =
  '<svg class="vn__spear" viewBox="0 0 140 16" aria-hidden="true" focusable="false">' +
  '<rect x="0" y="6.8" width="112" height="2.4" rx="1.2" fill="#1B1714"/>' +
  '<path d="M108 8 L124 2 L140 8 L124 14 Z" fill="#1B1714"/></svg>';

const SHIELD =
  '<svg class="vn__shield" viewBox="0 0 60 60" aria-hidden="true" focusable="false">' +
  '<circle cx="30" cy="30" r="28" fill="#1B1714"/>' +
  '<circle cx="30" cy="30" r="22" fill="none" stroke="#B85C38" stroke-width="1.6"/>' +
  '<circle cx="30" cy="30" r="14" fill="none" stroke="#B85C38" stroke-width="1" stroke-dasharray="2 3"/>' +
  '<circle cx="30" cy="30" r="5" fill="#A87B45"/></svg>';

const SLASH =
  '<svg class="vn__slash" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
  '<path d="M18 80 L82 20" /><path d="M24 30 L76 72" /></svg>';

/* ------------------------------------------------------------------------ */
/* Mount                                                                      */
/* ------------------------------------------------------------------------ */

export async function mountBattle(root) {
  root.innerHTML = '<p class="state">Arming the heroes…</p>';

  let script;
  let pool;
  let profiles;
  try {
    [script, pool, profiles] = await Promise.all([load('battle'), load('quiz'), loadProfiles()]);
  } catch {
    root.innerHTML = '<p class="state state--error" role="alert">The battle could not be loaded. Please refresh the page.</p>';
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rules = script.rules;

  root.innerHTML = `
    <div class="vn" data-scene="plain">
      <div class="vn__stage">
        ${BACKDROP}
        <div class="vn__hud" data-hud hidden>
          <div class="vn__hp vn__hp--player">
            <span class="vn__hp-name" data-player-name></span>
            <div class="vn__hp-bar" role="meter" aria-label="Your strength" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" data-player-meter><span data-player-hp></span></div>
          </div>
          <span class="vn__round" data-round></span>
          <div class="vn__hp vn__hp--enemy">
            <span class="vn__hp-name" data-enemy-name></span>
            <div class="vn__hp-bar" role="meter" aria-label="Enemy strength" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" data-enemy-meter><span data-enemy-hp></span></div>
          </div>
        </div>

        <div class="vn__arena">
          <div class="vn__fighter vn__fighter--player" data-player></div>
          <div class="vn__fighter vn__fighter--enemy" data-enemy></div>
          <p class="vn__banner" data-banner aria-hidden="true"></p>
        </div>

        <div class="vn__box" data-box hidden>
          <p class="vn__name" data-name></p>
          <p class="vn__text" data-text aria-hidden="true"></p>
          <p class="visually-hidden" data-live aria-live="polite"></p>
          <p class="vn__source" data-source hidden></p>
          <div class="vn__choices" data-choices role="group" hidden></div>
          <button type="button" class="vn__next" data-next hidden>Continue <span aria-hidden="true">▼</span></button>
        </div>

        <div class="vn__overlay" data-overlay></div>
      </div>
    </div>`;

  const $ = (sel) => root.querySelector(sel);
  const el = {
    vn: $('.vn'),
    hud: $('[data-hud]'),
    playerName: $('[data-player-name]'),
    enemyName: $('[data-enemy-name]'),
    playerHp: $('[data-player-hp]'),
    enemyHp: $('[data-enemy-hp]'),
    playerMeter: $('[data-player-meter]'),
    enemyMeter: $('[data-enemy-meter]'),
    round: $('[data-round]'),
    player: $('[data-player]'),
    enemy: $('[data-enemy]'),
    banner: $('[data-banner]'),
    box: $('[data-box]'),
    name: $('[data-name]'),
    text: $('[data-text]'),
    live: $('[data-live]'),
    source: $('[data-source]'),
    choices: $('[data-choices]'),
    next: $('[data-next]'),
    overlay: $('[data-overlay]')
  };

  /* ---- Run state ------------------------------------------------------- */
  let runId = 0;          // bumped on every new run; stale awaits abort
  let pending = null;     // { reject } of the line or choice being shown
  let advance = null;     // what a click / Enter does right now
  let typing = null;      // { finish } while the typewriter runs
  let deck = [];          // shuffled questions for this run
  let state = null;

  const nameOf = (id) => (id === 'muse' ? 'The Muse' : profiles.get(id)?.name || '');
  const fill = (text) => text.replace(/\{hero\}/g, nameOf(state?.hero || ''));

  /* ---- Helpers ------------------------------------------------------------ */
  function guard(id) {
    if (id !== runId) throw ABORT;
  }

  function wait(ms, id = runId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => (id === runId ? resolve() : reject(ABORT)), reduceMotion ? Math.min(ms, 60) : ms);
    });
  }

  function restartAnimation(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  function setSpeaker(speaker) {
    el.box.classList.toggle('is-narration', !speaker);
    el.name.hidden = !speaker;
    el.name.classList.toggle('vn__name--muse', speaker === 'muse');
    if (!speaker) return;
    const avatar = speaker === 'muse'
      ? '<span class="vn__name-icon" aria-hidden="true">✦</span>'
      : `<span class="vn__name-avatar">${figureSVG(speaker)}</span>`;
    el.name.innerHTML = `${avatar}<span>${esc(nameOf(speaker))}</span>`;
  }

  function typeText(text, done) {
    if (typing) typing.finish(false);
    el.text.textContent = '';
    if (reduceMotion) {
      el.text.textContent = text;
      done();
      return;
    }
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      el.text.textContent = text.slice(0, i);
      if (i >= text.length) finish(true);
    }, TYPE_SPEED);
    function finish(runDone = true) {
      clearInterval(timer);
      el.text.textContent = text;
      typing = null;
      if (runDone) done();
    }
    typing = { finish };
  }

  /** Show a line of dialogue; resolves when the reader continues. */
  function say(speaker, text, { source = '' } = {}) {
    const id = runId;
    return new Promise((resolve, reject) => {
      pending = { reject };
      el.box.hidden = false;
      el.choices.hidden = true;
      el.choices.innerHTML = '';
      el.next.hidden = true;
      el.source.textContent = source ? `Source: ${source}` : '';
      el.source.hidden = !source;
      setSpeaker(speaker);
      el.live.textContent = `${speaker ? `${nameOf(speaker)}: ` : ''}${text}`;

      typeText(text, () => {
        el.next.hidden = false;
        // Keep keyboard users on the Continue button, without scrolling.
        if (root.contains(document.activeElement) || document.activeElement === document.body) {
          el.next.focus({ preventScroll: true });
        }
      });

      advance = () => {
        if (id !== runId) return;
        if (typing) {
          typing.finish();
          return;
        }
        advance = null;
        pending = null;
        resolve();
      };
    });
  }

  /** Ask a question with choices; resolves with the picked index. */
  function ask(speaker, text, options) {
    const id = runId;
    return new Promise((resolve, reject) => {
      pending = { reject };
      el.box.hidden = false;
      el.next.hidden = true;
      el.source.hidden = true;
      el.choices.hidden = true;
      el.choices.innerHTML = '';
      setSpeaker(speaker);
      el.live.textContent = `${nameOf(speaker)} asks: ${text}`;
      el.choices.setAttribute('aria-label', text);

      const showChoices = () => {
        if (id !== runId) return;
        el.choices.innerHTML = options
          .map(
            (option, i) => `
            <button type="button" class="vn__choice" style="--i:${i}" data-choice="${i}">
              <span class="vn__choice-key" aria-hidden="true">${KEYS[i]}</span><span>${esc(option)}</span>
            </button>`
          )
          .join('');
        el.choices.hidden = false;
        el.choices.querySelectorAll('[data-choice]').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            if (id !== runId) return;
            advance = null;
            pending = null;
            el.choices.querySelectorAll('button').forEach((b) => { b.disabled = true; });
            resolve(Number(button.dataset.choice));
          });
        });
        el.choices.querySelector('button')?.focus({ preventScroll: true });
      };

      typeText(text, showChoices);
      advance = () => {
        if (typing) typing.finish();
      };
    });
  }

  function setHp(side, value) {
    const hp = Math.max(0, Math.min(100, value));
    const bar = side === 'player' ? el.playerHp : el.enemyHp;
    const meter = side === 'player' ? el.playerMeter : el.enemyMeter;
    bar.style.width = `${hp}%`;
    meter.setAttribute('aria-valuenow', String(Math.round(hp)));
    meter.classList.toggle('is-low', hp <= 30);
    if (side === 'player') state.playerHp = hp;
    else state.enemyHp = hp;
  }

  function fighterMarkup(id) {
    return (
      '<div class="vn__body"><div class="vn__flip">' +
      `<div class="vn__figure">${figureSVG(id, { omit: ['spear', 'roundShield', 'bow'] })}</div>` +
      SPEAR + SHIELD +
      '</div></div><div class="vn__shadow"></div>'
    );
  }

  async function enter(side, id) {
    const node = side === 'player' ? el.player : el.enemy;
    node.className = `vn__fighter vn__fighter--${side}`;
    node.innerHTML = fighterMarkup(id);
    node.dataset.id = id;
    restartAnimation(node, 'is-entering');
    await wait(850);
    node.classList.remove('is-entering');
  }

  function floatText(node, text, kind) {
    const tag = document.createElement('span');
    tag.className = `vn__dmg vn__dmg--${kind}`;
    tag.textContent = text;
    node.appendChild(tag);
    setTimeout(() => tag.remove(), 1200);
  }

  function showBanner(text) {
    el.banner.textContent = text;
    restartAnimation(el.banner, 'is-showing');
  }

  /** Attacker lunges and thrusts; defender is struck. */
  async function strike(attacker, damage, { aristeia = false } = {}) {
    const atk = attacker === 'player' ? el.player : el.enemy;
    const def = attacker === 'player' ? el.enemy : el.player;

    atk.classList.toggle('is-aristeia', aristeia);
    restartAnimation(atk, 'is-attacking');
    if (aristeia) showBanner('Aristeia!');
    await wait(380);

    const slash = document.createElement('div');
    slash.className = 'vn__fx';
    slash.innerHTML = SLASH;
    def.appendChild(slash);
    setTimeout(() => slash.remove(), 700);

    restartAnimation(def, 'is-hit');
    floatText(def, `−${damage}`, aristeia ? 'crit' : attacker === 'player' ? 'hit' : 'hurt');
    setHp(attacker === 'player' ? 'enemy' : 'player', (attacker === 'player' ? state.enemyHp : state.playerHp) - damage);

    await wait(620);
    atk.classList.remove('is-attacking', 'is-aristeia');
    def.classList.remove('is-hit');
  }

  async function fall(side) {
    const node = side === 'player' ? el.player : el.enemy;
    node.classList.add('is-fallen');
    await wait(900);
  }

  function setScene(scene, roundIndex, place) {
    el.vn.dataset.scene = scene;
    el.round.textContent = `Round ${ROMAN[roundIndex]} · ${place}`;
  }

  function nextQuestion() {
    if (!deck.length) deck = shuffle(pool);
    return deck.pop();
  }

  /* ---- Screens ------------------------------------------------------------- */
  function bestText() {
    const best = store.get(BEST_KEY, null);
    if (!best) return 'No battles fought yet on this device.';
    return `Best run: ${best.defeated} of 3 champions defeated · ${best.correct} correct answers.`;
  }

  function showTitle() {
    runId += 1;
    if (pending) pending.reject(ABORT);
    pending = null;
    advance = null;
    el.vn.dataset.scene = 'plain';
    el.hud.hidden = true;
    el.box.hidden = true;
    el.player.className = 'vn__fighter vn__fighter--player';
    el.enemy.className = 'vn__fighter vn__fighter--enemy';
    el.player.innerHTML = fighterMarkup('achilles');
    el.enemy.innerHTML = fighterMarkup('hector');

    const sides = Object.entries(script.sides)
      .map(
        ([key, side]) => `
        <button type="button" class="vn__side" data-side="${esc(key)}">
          <span class="vn__side-figure">${figureSVG(side.hero)}</span>
          <span class="vn__side-label">${esc(side.label)}</span>
          <span class="vn__side-blurb">${esc(side.blurb)}</span>
        </button>`
      )
      .join('');

    el.overlay.innerHTML = `
      <div class="vn__panel">
        <p class="vn__kicker">A visual-novel battle</p>
        <h3 class="vn__title">Duel at Troy</h3>
        <p class="vn__lead">Three champions. Every question comes from Homer. Answer truly and your spear lands; answer wrongly and your enemy strikes.</p>
        <div class="vn__sides">${sides}</div>
        <p class="vn__best">${esc(bestText())}</p>
      </div>`;
    el.overlay.hidden = false;
    el.overlay.querySelectorAll('[data-side]').forEach((button) => {
      button.addEventListener('click', () => play(button.dataset.side));
    });
  }

  function showResults(won) {
    const { defeated, correct, answered, review, side } = state;
    const previous = store.get(BEST_KEY, null);
    const better = !previous || defeated > previous.defeated || (defeated === previous.defeated && correct > previous.correct);
    if (better) store.set(BEST_KEY, { defeated, correct });

    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
    const title = won
      ? accuracy === 100 ? 'Flawless: a true aristeia' : 'Victor at Troy'
      : defeated === 2 ? 'Fallen at the last gate' : defeated === 1 ? 'A brave beginning' : 'Fallen on the plain';
    const otherSide = side === 'greek' ? 'trojan' : 'greek';

    el.box.hidden = true;
    el.overlay.innerHTML = `
      <div class="vn__panel">
        <p class="vn__kicker">${won ? 'Victory' : 'Defeat'}</p>
        <h3 class="vn__title" tabindex="-1" data-result-title>${esc(title)}</h3>
        <dl class="vn__stats">
          <div><dt>Champions defeated</dt><dd>${defeated} / 3</dd></div>
          <div><dt>Correct answers</dt><dd>${correct} / ${answered}</dd></div>
          <div><dt>Accuracy</dt><dd>${accuracy}%</dd></div>
        </dl>
        <p class="vn__best">${better && previous ? 'New best run!' : esc(bestText())}</p>
        <div class="vn__actions">
          <button type="button" class="btn btn--saffron" data-again>Fight again</button>
          <button type="button" class="btn btn--light" data-switch>Fight as ${esc(nameOf(script.sides[otherSide].hero))}</button>
          <button type="button" class="btn btn--ghost-light" data-menu>Title screen</button>
        </div>
        <details class="vn__review">
          <summary>Review your answers</summary>
          <ol>
            ${review
              .map(
                (r) => `<li><strong>${esc(r.question)}</strong><span class="${r.ok ? 'ok' : 'no'}">${r.ok ? '✓' : '✕'} ${esc(r.picked)}</span>${r.ok ? '' : ` · Answer: ${esc(r.answer)}`} · <em>${esc(r.source)}</em></li>`
              )
              .join('')}
          </ol>
        </details>
      </div>`;
    el.overlay.hidden = false;
    el.overlay.querySelector('[data-again]').addEventListener('click', () => play(side));
    el.overlay.querySelector('[data-switch]').addEventListener('click', () => play(otherSide));
    el.overlay.querySelector('[data-menu]').addEventListener('click', showTitle);
    el.overlay.querySelector('[data-result-title]').focus({ preventScroll: true });
  }

  /* ---- The story --------------------------------------------------------------- */
  async function play(sideKey) {
    runId += 1;
    if (pending) pending.reject(ABORT);
    const id = runId;
    const side = script.sides[sideKey];

    state = { side: sideKey, hero: side.hero, playerHp: 100, enemyHp: 100, streak: 0, correct: 0, answered: 0, defeated: 0, review: [] };
    deck = shuffle(pool);

    try {
      el.overlay.hidden = true;
      el.overlay.innerHTML = '';
      el.hud.hidden = true;
      el.enemy.className = 'vn__fighter vn__fighter--enemy';
      el.enemy.innerHTML = '';
      el.playerName.textContent = nameOf(side.hero);
      setHp('player', 100);

      const first = script.opponents[side.opponents[0]];
      el.vn.dataset.scene = first.scene;

      // Prologue
      await enter('player', side.hero);
      for (const line of script.prologue) await say(line.speaker, fill(line.text));
      for (const line of side.intro) await say(line.speaker, fill(line.text));
      guard(id);

      // Three duels
      for (let r = 0; r < side.opponents.length; r += 1) {
        const foeId = side.opponents[r];
        const foe = script.opponents[foeId];

        setScene(foe.scene, r, foe.place);
        el.hud.hidden = false;
        el.enemyName.textContent = nameOf(foeId);
        setHp('enemy', 100);
        showBanner(`Round ${ROMAN[r]}`);
        await enter('enemy', foeId);
        await say(null, `Round ${ROMAN[r]}. ${foe.place}.`);
        for (const line of foe.intro) await say(line.speaker, fill(line.text));

        // Question loop
        while (state.enemyHp > 0 && state.playerHp > 0) {
          const q = nextQuestion();
          const options = shuffle(q.choices.map((text, i) => ({ text, correct: i === q.answer })));
          const pick = await ask(foeId, q.prompt || q.question, options.map((o) => o.text));
          guard(id);

          const chosen = options[pick];
          const answer = options.find((o) => o.correct).text;
          state.answered += 1;
          state.review.push({ question: q.prompt || q.question, picked: chosen.text, answer, ok: chosen.correct, source: q.source });

          if (chosen.correct) {
            state.correct += 1;
            state.streak += 1;
            const aristeia = state.streak % 3 === 0;
            await strike('player', aristeia ? rules.aristeia : rules.hit, { aristeia });
            await say('muse', `${aristeia ? 'Aristeia! ' : ''}True. ${q.explanation}`, { source: q.source });
          } else {
            state.streak = 0;
            await strike('enemy', rules.enemyHit);
            await say('muse', `Not quite. The answer is “${answer}”. ${q.explanation}`, { source: q.source });
          }
        }

        // Player falls
        if (state.playerHp <= 0) {
          await say(foeId, foe.win);
          await fall('player');
          for (const line of script.defeat) await say(line.speaker, fill(line.text));
          showResults(false);
          return;
        }

        // Enemy falls
        await say(foeId, foe.defeat);
        await fall('enemy');
        state.defeated += 1;

        if (r < side.opponents.length - 1) {
          setHp('player', state.playerHp + rules.heal);
          floatText(el.player, `+${rules.heal}`, 'heal');
          await say('muse', fill(script.interlude));
        }
      }

      // Victory
      el.player.classList.add('is-victory');
      showBanner('Victory');
      for (const line of side.victory) await say(line.speaker, fill(line.text));
      showResults(true);
    } catch (error) {
      if (error !== ABORT) throw error;
    }
  }

  /* ---- Input ---------------------------------------------------------------------- */
  el.box.addEventListener('click', (event) => {
    if (event.target.closest('.vn__choice')) return;
    if (advance) advance();
  });

  document.addEventListener('keydown', (event) => {
    if (root.closest('[hidden]') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (el.box.hidden) return;

    const choiceButtons = el.choices.hidden ? [] : Array.from(el.choices.querySelectorAll('button:not(:disabled)'));
    if (choiceButtons.length) {
      const key = event.key.toUpperCase();
      const index = ['1', '2', '3', '4'].includes(key) ? Number(key) - 1 : KEYS.indexOf(key);
      if (index > -1 && choiceButtons[index]) {
        event.preventDefault();
        choiceButtons[index].click();
      }
      return;
    }

    // A focused button (like Continue) handles Enter/Space itself via click.
    const onControl = event.target.closest?.('button, a, summary, input');
    if ((event.key === 'Enter' || event.key === ' ') && !onControl && advance) {
      event.preventDefault();
      advance();
    }
  });

  showTitle();

  /** Let the page stop a run (e.g. when switching tabs). */
  return { reset: showTitle };
}
