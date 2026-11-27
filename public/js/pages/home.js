/**
 * Home page: a live three-question mini quiz,
 * and a small preview of the board game drawn with the game's own art.
 */
import '../core/site.js';
import { mountQuiz } from '../core/quiz-engine.js';
import { tile, tileBack, token } from '../game/art.js';

const mini = document.getElementById('mini-quiz');
if (mini) {
  mountQuiz(mini, { count: 3, mode: 'mini', storageKey: 'iliad:quiz:best-mini' });
}

/* A 4×4 corner of the battlefield: a ring token, a few tiles, empty spaces */
const preview = document.querySelector('[data-game-preview]');
if (preview) {
  const cells = [
    ['ring', token({ k: 'god', g: 'Zeus', v: 6 })], ['ring', token({ k: 'pos', n: 'Achilles’ Shield', v: 10 })], ['ring', token({ k: 'god', g: 'Athena', v: 5 })], ['ring', token({ k: 'wed', v: 0 })],
    ['G', tile('G', 3)], ['T', ''], ['G', tile('G', 'D')], ['T', tile('T', 5)],
    ['T', tile('T', 1)], ['G', tile('G', 5)], ['T', tileBack('T')], ['G', ''],
    ['G', ''], ['T', tile('T', 4)], ['G', tile('G', 2)], ['T', '']
  ];
  preview.innerHTML = `<div class="soon__board">${cells
    .map(([kind, svg]) => `<span class="soon__cell soon__cell--${kind}">${svg}</span>`)
    .join('')}</div>`;
}
