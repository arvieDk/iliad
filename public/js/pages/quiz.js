/**
 * Quiz page: full ten-question round with best-score tracking.
 */
import '../core/site.js';
import { mountQuiz, getBest } from '../core/quiz-engine.js';

const KEY = 'iliad:quiz:best';
const root = document.getElementById('quiz');
const bestEl = document.querySelector('[data-best]');

const showBest = (value) => {
  if (bestEl) bestEl.textContent = `${value} / 10`;
};

showBest(getBest(KEY));

if (root) {
  mountQuiz(root, {
    count: 10,
    mode: 'full',
    storageKey: KEY,
    onFinish: ({ best }) => showBest(best)
  });
}
