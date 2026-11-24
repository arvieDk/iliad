/**
 * modal.js — profile modal for characters and gods.
 *
 * Built on the native <dialog> element, which gives us a focus trap, Esc to
 * close and an inert page behind it. We add: backdrop-click close, a closing
 * animation, body scroll lock, prev/next browsing and linked relationships.
 */
import { figureSVG } from './figures.js';
import { esc } from './api.js';

const SIDE_LABEL = { greek: 'Greek side', trojan: 'Trojan side', neutral: 'Above the sides' };

let dialog = null;
let state = { list: [], index: 0, lookup: new Map() };

function ensureDialog() {
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'modal-title');
  document.body.appendChild(dialog);

  // Close when the backdrop (the dialog element itself) is clicked.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeModal();
  });

  // Esc: run our animated close instead of the instant default.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeModal();
  });

  dialog.addEventListener('close', () => document.body.classList.remove('is-locked'));

  // Delegated actions inside the modal.
  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'close') closeModal();
    if (action === 'prev') step(-1);
    if (action === 'next') step(1);
    if (action === 'open' && id) {
      const profile = state.lookup.get(id);
      if (profile) {
        const index = state.list.findIndex((item) => item.id === id);
        render(profile, index);
      }
    }
  });

  return dialog;
}

function relationMarkup(relation) {
  const target = relation.id ? state.lookup.get(relation.id) : null;
  const name = target ? target.name : relation.name;
  if (!target) {
    return `<li><span class="relation"><span class="relation__avatar relation__avatar--none"></span>` +
      `<span><strong>${esc(name)}</strong> · <span>${esc(relation.label)}</span></span></span></li>`;
  }
  return `<li><button type="button" class="relation" data-action="open" data-id="${esc(target.id)}">` +
    `<span class="relation__avatar">${figureSVG(target.id)}</span>` +
    `<span><strong>${esc(name)}</strong> · <span>${esc(relation.label)}</span></span></button></li>`;
}

function render(profile, index) {
  state.index = index;
  const hasNav = state.list.length > 1 && index > -1;
  const prev = hasNav ? state.list[(index - 1 + state.list.length) % state.list.length] : null;
  const next = hasNav ? state.list[(index + 1) % state.list.length] : null;

  dialog.innerHTML = `
    <header class="modal__header">
      <div class="modal__figure">${figureSVG(profile.id)}</div>
      <div>
        <p class="modal__epithet">${esc(profile.epithet)}</p>
        <h2 id="modal-title">${esc(profile.name)}</h2>
        <span class="badge badge--${esc(profile.side)}">${esc(SIDE_LABEL[profile.side] || profile.side)}</span>
      </div>
      <button type="button" class="modal__close" data-action="close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </header>
    <div class="modal__body">
      <section>
        <h3>${esc(profile.role)}</h3>
        <p>${esc(profile.summary)}</p>
      </section>
      <section aria-label="Traits">
        <ul class="modal__traits" role="list">${profile.traits.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </section>
      <section>
        <h3>In the Iliad</h3>
        <ul class="moments" role="list">
          ${profile.moments.map((m) => `<li><span class="badge badge--book">Bk ${esc(m.book)}</span><span>${esc(m.text)}</span></li>`).join('')}
        </ul>
      </section>
      <section>
        <h3>Connections</h3>
        <ul class="relations" role="list">${profile.relations.map(relationMarkup).join('')}</ul>
      </section>
      <div class="callout"><strong>Fate</strong>${esc(profile.fate)}</div>
      <div class="callout callout--olive"><strong>Did you know?</strong>${esc(profile.fact)}</div>
    </div>
    ${hasNav ? `
    <footer class="modal__footer">
      <button type="button" class="btn btn--ghost btn--sm" data-action="prev">← ${esc(prev.name)}</button>
      <button type="button" class="btn btn--ghost btn--sm" data-action="next">${esc(next.name)} →</button>
    </footer>` : ''}
  `;

  dialog.querySelector('.modal__body').scrollTop = 0;
  dialog.querySelector('.modal__close').focus();
}

function step(delta) {
  if (!state.list.length) return;
  const index = (state.index + delta + state.list.length) % state.list.length;
  render(state.list[index], index);
}

/**
 * Open the modal for a profile.
 * @param {object} profile  a character or god
 * @param {object} options
 * @param {object[]} [options.list]   profiles to browse with prev/next
 * @param {Map}      [options.lookup] all profiles by id (for connections)
 */
export function openProfile(profile, { list = [], lookup = new Map() } = {}) {
  ensureDialog();
  state = { list, index: 0, lookup };
  render(profile, list.findIndex((item) => item.id === profile.id));

  dialog.classList.remove('is-closing');
  if (!dialog.open) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  document.body.classList.add('is-locked');
  dialog.querySelector('.modal__close').focus();
}

export function closeModal() {
  if (!dialog || !dialog.open) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    dialog.close();
    return;
  }
  dialog.classList.add('is-closing');
  dialog.addEventListener(
    'animationend',
    () => {
      dialog.classList.remove('is-closing');
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      document.body.classList.remove('is-locked');
    },
    { once: true }
  );
}

/**
 * Render clickable profile cards into a grid.
 * @returns {HTMLButtonElement[]} the card buttons
 */
export function renderProfileCards(grid, profiles) {
  grid.innerHTML = profiles
    .map(
      (p, i) => `
      <button type="button" class="profile-card reveal" style="--i:${i % 6}" data-id="${esc(p.id)}" data-side="${esc(p.side)}" aria-haspopup="dialog">
        <span class="figure-slot">${figureSVG(p.id, { still: true })}</span>
        <span>
          <span class="profile-card__name">${esc(p.name)}</span>
          <span class="profile-card__role" style="display:block">${esc(p.role)}</span>
          <span class="badge badge--${esc(p.side)}">${esc(SIDE_LABEL[p.side] || p.side)}</span>
        </span>
      </button>`
    )
    .join('');
  return Array.from(grid.querySelectorAll('.profile-card'));
}
