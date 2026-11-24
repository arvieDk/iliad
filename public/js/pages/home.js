/**
 * Home page: hero duel figures (via site.js) + a live three-question mini quiz.
 */
import '../core/site.js';
import { mountQuiz } from '../core/quiz-engine.js';

const mini = document.getElementById('mini-quiz');
if (mini) {
  mountQuiz(mini, { count: 3, mode: 'mini', storageKey: 'iliad:quiz:best-mini' });
}
