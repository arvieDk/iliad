/**
 * Story page: the Iliad in eight interactive chapters.
 * Each chapter shows short beats, then asks the reader to choose as one of the
 * characters. Every choice reveals what Homer actually wrote, with its Book.
 * Choices are remembered in localStorage so progress survives a reload.
 */
import { observeReveal } from '../core/site.js';
import { load, loadProfiles, esc, store, errorState } from '../core/api.js';
import { createActor, react } from '../core/figures.js';

const KEY = 'iliad:story:choices';
const list = document.getElementById('chapters');
const dots = document.querySelector('[data-dots]');
const countEl = document.querySelector('[data-progress-count]');
const resetButton = document.querySelector('[data-reset]');

let chapters = [];
let choices = store.get(KEY, {});

function chapterMarkup(ch, i) {
  return `
  <article class="chapter" id="chapter-${esc(ch.id)}" aria-labelledby="title-${esc(ch.id)}" data-chapter="${esc(ch.id)}">
    <div class="container chapter__grid">
      <div class="chapter__aside">
        <div class="chapter__meta">
          <span class="badge badge--book">Book ${esc(ch.book)}</span>
          <span class="chapter__place">${esc(ch.place)}</span>
        </div>
        <div class="chapter__cast" data-cast style="margin-top:var(--space-5)"></div>
      </div>
      <div>
        <p class="eyebrow">Chapter ${i + 1}</p>
        <h2 id="title-${esc(ch.id)}">${esc(ch.title)}</h2>
        <ol class="beats">
          ${ch.beats.map((b, j) => `<li class="reveal" style="--i:${j}">${esc(b)}</li>`).join('')}
        </ol>
        <div class="decision reveal">
          <p class="decision__prompt">${esc(ch.choice.prompt)}</p>
          <div class="decision__options" role="group" aria-label="${esc(ch.choice.prompt)}">
            ${ch.choice.options
              .map((o, j) => `<button type="button" class="decision__option" data-option="${j}">${esc(o.text)}</button>`)
              .join('')}
          </div>
          <div class="decision__result" data-result role="status" aria-live="polite" hidden></div>
        </div>
      </div>
    </div>
  </article>`;
}

/** Show the outcome of a choice inside a chapter. */
function resolve(article, ch, optionIndex, { animate = true } = {}) {
  const option = ch.choice.options[optionIndex];
  const buttons = article.querySelectorAll('[data-option]');
  buttons.forEach((button, j) => {
    button.disabled = true;
    button.classList.toggle('is-picked', j === optionIndex);
    button.classList.toggle('is-homer', ch.choice.options[j].homer);
    button.classList.toggle('is-dim', j !== optionIndex && !ch.choice.options[j].homer);
  });

  const index = chapters.indexOf(ch);
  const nextChapter = chapters[index + 1];
  const result = article.querySelector('[data-result]');
  result.innerHTML = `
    <p class="decision__reply ${option.homer ? 'is-match' : 'is-miss'}">${option.homer ? '✓ ' : ''}${esc(option.reply)}</p>
    <div class="callout callout--olive"><strong>What Homer wrote · Iliad, Book ${esc(ch.book)}</strong>${esc(ch.homer)}</div>
    ${nextChapter
      ? `<a class="btn btn--sm decision__next" href="#chapter-${esc(nextChapter.id)}">Next: ${esc(nextChapter.title)} ↓</a>`
      : '<a class="btn btn--sm decision__next" href="#story-end">Finish the story ↓</a>'}`;
  result.hidden = false;

  if (animate) {
    const actor = article.querySelector('.actor');
    react(actor, option.homer ? 'correct' : 'wrong');
  }
}

function updateProgress() {
  const done = chapters.filter((ch) => choices[ch.id] !== undefined).length;
  if (countEl) countEl.textContent = `${done} / ${chapters.length} decided`;
  dots.querySelectorAll('a').forEach((dot) => {
    dot.classList.toggle('is-done', choices[dot.dataset.id] !== undefined);
  });
  if (resetButton) resetButton.hidden = done === 0;
}

async function init() {
  let profiles;
  try {
    [chapters, profiles] = await Promise.all([load('story'), loadProfiles()]);
  } catch {
    list.innerHTML = errorState();
    return;
  }

  list.innerHTML = chapters.map(chapterMarkup).join('');
  dots.innerHTML = chapters
    .map((ch, i) => `<a class="story-progress__dot" href="#chapter-${esc(ch.id)}" data-id="${esc(ch.id)}" aria-label="Chapter ${i + 1}: ${esc(ch.title)}">${i + 1}</a>`)
    .join('');

  chapters.forEach((ch) => {
    const article = list.querySelector(`[data-chapter="${ch.id}"]`);

    // Cast: the characters of this chapter, the chooser first.
    const cast = article.querySelector('[data-cast]');
    ch.figures.forEach((id) => cast.appendChild(createActor(id, profiles.get(id)?.name || '', { enter: false, profile: profiles.get(id) })));

    article.querySelectorAll('[data-option]').forEach((button) => {
      button.addEventListener('click', () => {
        const optionIndex = Number(button.dataset.option);
        choices = { ...choices, [ch.id]: optionIndex };
        store.set(KEY, choices);
        resolve(article, ch, optionIndex);
        updateProgress();
      });
    });

    if (choices[ch.id] !== undefined && ch.choice.options[choices[ch.id]]) {
      resolve(article, ch, choices[ch.id], { animate: false });
    }
  });

  // Highlight the chapter currently in view.
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.dataset.chapter;
          dots.querySelectorAll('a').forEach((dot) => {
            const current = dot.dataset.id === id;
            dot.classList.toggle('is-current', current);
            if (current) dot.setAttribute('aria-current', 'step');
            else dot.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    list.querySelectorAll('[data-chapter]').forEach((el) => spy.observe(el));
  }

  updateProgress();
  observeReveal(list);
}

// Reset: forget all choices and re-render (listener bound once, outside init).
resetButton?.addEventListener('click', () => {
  choices = {};
  store.remove(KEY);
  init().then(() => list.scrollIntoView({ behavior: 'smooth' }));
});

init();
