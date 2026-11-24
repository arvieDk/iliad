/**
 * Quiz page: two modes in accessible tabs.
 *   • Classic quiz   — ten questions with instant feedback (quiz-engine.js)
 *   • Battle of Troy — a visual-novel duel quiz (battle-engine.js),
 *                      loaded the first time its tab opens. /quiz#battle opens it directly.
 */
import '../core/site.js';
import { mountQuiz, getBest } from '../core/quiz-engine.js';
import { mountBattle } from '../core/battle-engine.js';

const KEY = 'iliad:quiz:best';
const quizRoot = document.getElementById('quiz');
const battleRoot = document.getElementById('battle');
const bestEl = document.querySelector('[data-best]');
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

/* ---- Classic quiz --------------------------------------------------------- */
const showBest = (value) => {
  if (bestEl) bestEl.textContent = `${value} / 10`;
};
showBest(getBest(KEY));

if (quizRoot) {
  mountQuiz(quizRoot, { count: 10, mode: 'full', storageKey: KEY, onFinish: ({ best }) => showBest(best) });
}

/* ---- Tabs ---------------------------------------------------------------------- */
let battleMounted = false;

function select(tab, { focus = false, updateHash = true } = {}) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();

  if (tab.dataset.mode === 'battle' && !battleMounted && battleRoot) {
    battleMounted = true;
    mountBattle(battleRoot);
  }
  if (updateHash) {
    const hash = tab.dataset.mode === 'battle' ? '#battle' : '';
    history.replaceState(null, '', `${location.pathname}${hash}`);
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', (event) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const step = keys[event.key];
    const next = step === 'first' ? 0 : step === 'last' ? tabs.length - 1 : (index + step + tabs.length) % tabs.length;
    select(tabs[next], { focus: true });
  });
});

if (location.hash === '#battle') {
  select(tabs.find((t) => t.dataset.mode === 'battle'), { updateHash: false });
}
