/**
 * Timeline page: events in order, grouped by phase.
 *  • 24-book rail: jump to the events of any Book
 *  • phase filter chips
 *  • accessible disclosure cards (aria-expanded / aria-controls)
 *  • scroll progress bar
 */
import { observeReveal } from '../core/site.js';
import { load, loadProfiles, esc, errorState } from '../core/api.js';
import { figureSVG } from '../core/figures.js';

const list = document.getElementById('timeline');
const rail = document.querySelector('[data-books]');
const chipBox = document.querySelector('[data-phases]');
const progress = document.querySelector('.timeline-progress');

const chevron =
  '<svg class="event__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function bookLabel(books) {
  if (!books.length) return '';
  return books.length === 1 ? `Book ${books[0]}` : `Books ${books[0]}–${books[books.length - 1]}`;
}

function eventMarkup(ev, profiles, i) {
  const cast = ev.figures
    .map((id) => profiles.get(id))
    .filter(Boolean)
    .map((p) => {
      const page = p.kind === 'god' ? '/gods' : '/characters';
      return `<a class="relation" href="${page}#${esc(p.id)}"><span class="relation__avatar">${figureSVG(p.id)}</span><span><strong>${esc(p.name)}</strong></span></a>`;
    })
    .join('');

  return `
  <li class="event reveal${ev.inPoem ? '' : ' event--outside'}" id="event-${esc(ev.id)}" data-phase="${esc(ev.phase)}" data-books="${ev.books.join(' ')}" style="--i:${i % 4}">
    <div class="event__card">
      <button type="button" class="event__toggle" aria-expanded="false" aria-controls="panel-${esc(ev.id)}">
        <span>
          <span class="event__meta">
            ${ev.books.length ? `<span class="badge badge--book">${bookLabel(ev.books)}</span>` : ''}
            ${ev.inPoem ? '' : '<span class="badge badge--outside">Not in the Iliad</span>'}
          </span>
          <span class="event__title">${esc(ev.title)}</span>
          <span class="event__summary">${esc(ev.summary)}</span>
        </span>
        ${chevron}
      </button>
      <div class="event__panel" id="panel-${esc(ev.id)}" role="region" aria-label="${esc(ev.title)}">
        <div><div class="event__body">
          <p>${esc(ev.details)}</p>
          ${cast ? `<div class="event__cast">${cast}</div>` : ''}
        </div></div>
      </div>
    </div>
  </li>`;
}

function setOpen(item, open) {
  item.classList.toggle('is-open', open);
  const toggle = item.querySelector('.event__toggle');
  toggle.setAttribute('aria-expanded', String(open));
  // Keep links in collapsed panels out of the tab order.
  item.querySelector('.event__panel').inert = !open;
}

async function init() {
  let data;
  let profiles;
  try {
    [data, profiles] = await Promise.all([load('timeline'), loadProfiles()]);
  } catch {
    list.innerHTML = errorState();
    return;
  }

  const { phases, events } = data;

  /* ---- Render events grouped by phase ------------------------------------ */
  let i = 0;
  list.innerHTML = phases
    .map((phase) => {
      const items = events.filter((e) => e.phase === phase.id);
      if (!items.length) return '';
      return `<li class="phase-label" data-phase-label="${esc(phase.id)}" role="presentation">${esc(phase.label)}</li>` +
        items.map((ev) => eventMarkup(ev, profiles, i++)).join('');
    })
    .join('');

  const items = Array.from(list.querySelectorAll('.event'));
  items.forEach((item) => setOpen(item, false));

  list.addEventListener('click', (event) => {
    const toggle = event.target.closest('.event__toggle');
    if (!toggle) return;
    const item = toggle.closest('.event');
    setOpen(item, !item.classList.contains('is-open'));
  });

  /* ---- Phase chips ---------------------------------------------------------- */
  chipBox.innerHTML =
    '<button type="button" class="chip" data-phase="all" aria-pressed="true">All</button>' +
    phases.map((p) => `<button type="button" class="chip" data-phase="${esc(p.id)}" aria-pressed="false">${esc(p.label)}</button>`).join('');

  const filterBy = (phase) => {
    items.forEach((item) => {
      item.hidden = phase !== 'all' && item.dataset.phase !== phase;
    });
    list.querySelectorAll('[data-phase-label]').forEach((label) => {
      label.hidden = phase !== 'all' && label.dataset.phaseLabel !== phase;
    });
    chipBox.querySelectorAll('.chip').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.phase === phase)));
    // Revealed-on-scroll items that were hidden need to show immediately.
    items.forEach((item) => item.classList.add('is-visible'));
  };
  chipBox.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (chip) filterBy(chip.dataset.phase);
  });

  /* ---- Book rail ---------------------------------------------------------------- */
  const covered = new Set(events.flatMap((e) => e.books));
  rail.innerHTML = Array.from({ length: 24 }, (_, n) => {
    const book = n + 1;
    const has = covered.has(book);
    return `<button type="button" class="book" data-book="${book}" ${has ? '' : 'disabled'} aria-label="Book ${book}${has ? '' : ' (no featured event)'}">${book}</button>`;
  }).join('');

  rail.addEventListener('click', (event) => {
    const button = event.target.closest('.book');
    if (!button || button.disabled) return;
    const book = button.dataset.book;
    filterBy('all');
    rail.querySelectorAll('.book').forEach((b) => b.classList.toggle('is-active', b === button));

    const matches = items.filter((item) => item.dataset.books.split(' ').includes(book));
    matches.forEach((item) => {
      setOpen(item, true);
      item.classList.remove('is-flash');
      void item.offsetWidth;
      item.classList.add('is-flash');
      setTimeout(() => item.classList.remove('is-flash'), 1600);
    });
    if (matches[0]) {
      matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      matches[0].querySelector('.event__toggle').focus({ preventScroll: true });
    }
  });

  observeReveal(list);
}

/* ---- Scroll progress through the timeline -------------------------------------- */
function updateProgress() {
  if (!progress || !list) return;
  const rect = list.getBoundingClientRect();
  const total = rect.height - window.innerHeight * 0.5;
  const ratio = Math.min(Math.max((window.innerHeight * 0.5 - rect.top) / Math.max(total, 1), 0), 1);
  progress.style.transform = `scaleX(${ratio})`;
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);

init().then(updateProgress);
