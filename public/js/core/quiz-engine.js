/**
 * quiz-engine.js — the shared quiz used on the home page (mini) and /quiz (full).
 *
 * A character walks onto the stage and asks each question in a speech bubble.
 * The reader picks an answer; the character reacts (jump + sparks, or a
 * head-shake), and the fact-checked explanation appears with its Book source.
 * Score, streak and best score are tracked; best score persists in localStorage.
 */
import { load, loadProfiles, shuffle, esc, store } from './api.js';
import { createActor, react } from './figures.js';

const KEYS = ['A', 'B', 'C', 'D'];

const TIERS = [
  { min: 1, title: 'Worthy of Homer himself', note: 'A perfect score. The Muse would be proud.' },
  { min: 0.8, title: 'Hero of the Achaeans', note: 'You know this war like a veteran of all ten years.' },
  { min: 0.6, title: 'Captain of the Myrmidons', note: 'Solid command of the story — a few more battles to win.' },
  { min: 0.4, title: 'Spear-bearer', note: 'You are on the field. Try the story or timeline and charge again.' },
  { min: 0, title: 'Lost on the wine-dark sea', note: 'Every hero starts somewhere. The story page is a good place to begin.' }
];

/**
 * Mount a quiz.
 * @param {HTMLElement} root
 * @param {object} options
 * @param {number}  [options.count=10]     questions per round
 * @param {'full'|'mini'} [options.mode]   mini adds a link to the full quiz
 * @param {string}  [options.storageKey]   localStorage key for the best score
 * @param {function} [options.onFinish]    called with { score, total, best }
 */
export async function mountQuiz(root, { count = 10, mode = 'full', storageKey = 'iliad:quiz:best', onFinish } = {}) {
  root.innerHTML = '<p class="state" style="color:var(--on-dark-muted)">Summoning the heroes…</p>';

  let pool;
  let profiles;
  try {
    [pool, profiles] = await Promise.all([load('quiz'), loadProfiles()]);
  } catch {
    root.innerHTML = '<p class="state" role="alert" style="color:var(--dawn)">The quiz could not be loaded. Please refresh the page.</p>';
    return;
  }

  const nameOf = (id) => profiles.get(id)?.name || 'A voice from Troy';
  const ids = { question: `quiz-q-${Math.random().toString(36).slice(2, 7)}` };

  let round = [];
  let index = 0;
  let score = 0;
  let streak = 0;
  let answered = false;
  let actor = null;
  const answers = [];

  /* ---- Round setup ------------------------------------------------------ */
  function start({ focus = false } = {}) {
    round = shuffle(pool)
      .slice(0, Math.min(count, pool.length))
      .map((q) => ({
        ...q,
        options: shuffle(q.choices.map((text, i) => ({ text, correct: i === q.answer })))
      }));
    index = 0;
    score = 0;
    streak = 0;
    answers.length = 0;
    renderQuestion({ focus });
  }

  /* ---- Question view ---------------------------------------------------- */
  function renderQuestion({ focus = true } = {}) {
    const q = round[index];
    answered = false;

    root.innerHTML = `
      <div class="quiz">
        <div class="quiz__bar">
          <span>Question <strong style="color:var(--on-dark)">${index + 1}</strong> of ${round.length}</span>
          <span class="quiz__stats">
            <span>Score <strong data-score>${score}</strong></span>
            <span>Streak <strong data-streak>${streak}</strong></span>
          </span>
        </div>
        <div class="quiz__progress" aria-hidden="true"><span style="width:${(index / round.length) * 100}%"></span></div>

        <div class="quiz__stage">
          <div class="quiz__actor" data-actor></div>
          <div class="quiz__bubble">
            <p class="quiz__category">${esc(q.category)}</p>
            <h3 class="quiz__question" id="${ids.question}" tabindex="-1">${esc(q.question)}</h3>
          </div>
        </div>

        <div class="quiz__choices" role="group" aria-labelledby="${ids.question}">
          ${q.options
            .map(
              (o, i) => `
            <button type="button" class="quiz__choice" style="--i:${i}" data-choice="${i}">
              <span class="quiz__key" aria-hidden="true">${KEYS[i]}</span>
              <span>${esc(o.text)}</span>
              <span class="quiz__mark" aria-hidden="true"></span>
            </button>`
            )
            .join('')}
        </div>

        <div class="quiz__feedback" data-feedback role="status" aria-live="polite" hidden></div>

        <div class="quiz__actions">
          <span class="quiz__hint">Tip: press 1–4 to answer</span>
          <button type="button" class="btn btn--saffron" data-next hidden>
            ${index + 1 < round.length ? 'Next question' : 'See my score'} →
          </button>
        </div>
      </div>`;

    actor = createActor(q.speaker, nameOf(q.speaker));
    root.querySelector('[data-actor]').appendChild(actor);

    // Grow the progress bar to the current position after paint.
    requestAnimationFrame(() => {
      const bar = root.querySelector('.quiz__progress span');
      if (bar) bar.style.width = `${((index + 0.5) / round.length) * 100}%`;
    });

    root.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => answer(Number(button.dataset.choice)));
    });
    root.querySelector('[data-next]').addEventListener('click', next);

    if (focus) root.querySelector(`#${ids.question}`).focus({ preventScroll: false });
  }

  /* ---- Answering --------------------------------------------------------- */
  function answer(choiceIndex) {
    if (answered) return;
    answered = true;

    const q = round[index];
    const picked = q.options[choiceIndex];
    const correctIndex = q.options.findIndex((o) => o.correct);
    const isCorrect = picked.correct;

    if (isCorrect) {
      score += 1;
      streak += 1;
    } else {
      streak = 0;
    }
    answers.push({ question: q.question, picked: picked.text, correct: q.options[correctIndex].text, isCorrect, source: q.source });

    root.querySelectorAll('[data-choice]').forEach((button, i) => {
      button.disabled = true;
      const mark = button.querySelector('.quiz__mark');
      if (i === correctIndex) {
        button.classList.add('is-correct');
        mark.textContent = '✓';
      } else if (i === choiceIndex) {
        button.classList.add('is-wrong');
        mark.textContent = '✕';
      } else {
        button.classList.add('is-dim');
      }
    });

    root.querySelector('[data-score]').textContent = score;
    root.querySelector('[data-streak]').textContent = streak;
    react(actor, isCorrect ? 'correct' : 'wrong');

    const feedback = root.querySelector('[data-feedback]');
    feedback.innerHTML = `
      <p class="quiz__feedback-title">${isCorrect ? (streak > 2 ? `Correct — ${streak} in a row!` : 'Correct!') : `Not quite — it's “${esc(q.options[correctIndex].text)}”.`}</p>
      <p>${esc(q.explanation)}</p>
      <span class="quiz__source">Source: ${esc(q.source)}</span>`;
    feedback.hidden = false;

    const nextButton = root.querySelector('[data-next]');
    nextButton.hidden = false;
    nextButton.focus({ preventScroll: true });
  }

  function next() {
    index += 1;
    if (index < round.length) renderQuestion();
    else renderResults();
  }

  /* ---- Results ------------------------------------------------------------ */
  function renderResults() {
    const total = round.length;
    const ratio = score / total;
    const tier = TIERS.find((t) => ratio >= t.min);
    const previousBest = store.get(storageKey, 0);
    const best = Math.max(previousBest, score);
    const isNewBest = score > previousBest;
    store.set(storageKey, best);

    root.innerHTML = `
      <div class="quiz">
        <div class="quiz__progress" aria-hidden="true"><span style="width:100%"></span></div>
        <div class="quiz__result">
          <div data-actor></div>
          <div>
            <p class="quiz__score" tabindex="-1" data-score-title>${score}<small> / ${total}</small></p>
            <h3 class="quiz__tier">${esc(tier.title)}</h3>
          </div>
          <p>${esc(tier.note)} ${isNewBest && previousBest > 0 ? '<strong style="color:var(--saffron)">New best score!</strong>' : `Best: ${best} / ${total}.`}</p>
          <div class="quiz__result-actions">
            <button type="button" class="btn btn--saffron" data-restart>Play again</button>
            ${mode === 'mini'
              ? '<a class="btn btn--light" href="/quiz">Take the full quiz →</a>'
              : '<a class="btn btn--light" href="/story">Revisit the story</a>'}
          </div>
          <details class="quiz__review">
            <summary>Review your answers</summary>
            <ol class="quiz__review-list">
              ${answers
                .map(
                  (a) => `
                <li class="quiz__review-item">
                  <strong>${esc(a.question)}</strong>
                  <p><span class="${a.isCorrect ? 'ok' : 'no'}">${a.isCorrect ? '✓' : '✕'} ${esc(a.picked)}</span>
                  ${a.isCorrect ? '' : ` · Answer: ${esc(a.correct)}`} · <em>${esc(a.source)}</em></p>
                </li>`
                )
                .join('')}
            </ol>
          </details>
        </div>
      </div>`;

    const good = ratio >= 0.6;
    const host = createActor(good ? 'achilles' : 'odysseus', good ? 'Achilles salutes you' : 'Odysseus says: try again');
    root.querySelector('[data-actor]').appendChild(host);
    setTimeout(() => react(host, good ? 'correct' : 'wrong'), 900);

    root.querySelector('[data-restart]').addEventListener('click', () => start({ focus: true }));
    root.querySelector('[data-score-title]').focus({ preventScroll: false });

    if (typeof onFinish === 'function') onFinish({ score, total, best });
  }

  /* ---- Keyboard shortcuts: 1–4 (or A–D) to answer --------------------------- */
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (root.closest('[hidden]')) return; // another quiz mode is showing
    const scoped = mode === 'full' || root.contains(document.activeElement);
    if (!scoped || answered || !round.length || index >= round.length) return;

    const key = event.key.toUpperCase();
    const choice = ['1', '2', '3', '4'].indexOf(key) > -1 ? Number(key) - 1 : KEYS.indexOf(key);
    if (choice > -1 && choice < round[index].options.length && root.querySelector('[data-choice]')) {
      event.preventDefault();
      answer(choice);
    }
  });

  start({ focus: false });
}

/** Read the stored best score (used by the quiz page header). */
export function getBest(storageKey = 'iliad:quiz:best') {
  return store.get(storageKey, 0);
}
