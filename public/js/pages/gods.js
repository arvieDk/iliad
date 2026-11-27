/**
 * Gods & Alliances page: divine profile cards plus an interactive alliance
 * board showing who fought for whom (sides as listed in Iliad, Book 20).
 */
import { observeReveal } from '../core/site.js';
import { load, loadProfiles, esc, errorState } from '../core/api.js';
import { portraitHTML } from '../core/figures.js';
import { openProfile, renderProfileCards } from '../core/modal.js';

const grid = document.getElementById('god-grid');
const chips = document.querySelectorAll('[data-filter]');
const board = document.getElementById('alliance');
const focusButtons = document.querySelectorAll('[data-focus-side]');

/** A small clickable chip with a figure, used on the alliance board. */
const personChip = (p) =>
  `<button type="button" class="relation" data-open="${esc(p.id)}" aria-haspopup="dialog">` +
  `<span class="relation__avatar">${portraitHTML(p)}</span><span><strong>${esc(p.name)}</strong></span></button>`;

async function init() {
  let gods;
  let characters;
  let lookup;
  try {
    [gods, characters, lookup] = await Promise.all([load('gods'), load('characters'), loadProfiles()]);
  } catch {
    grid.innerHTML = errorState();
    return;
  }

  /* ---- Divine cards ----------------------------------------------------- */
  const cards = renderProfileCards(grid, gods);
  observeReveal(grid);

  const visibleGods = () => gods.filter((g) => !grid.querySelector(`[data-id="${g.id}"]`).hidden);

  const applyFilter = (filter) => {
    cards.forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.side !== filter;
    });
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter)));
  };
  chips.forEach((chip) => chip.addEventListener('click', () => applyFilter(chip.dataset.filter)));

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.profile-card');
    if (!card) return;
    openProfile(gods.find((g) => g.id === card.dataset.id), { list: visibleGods(), lookup });
  });

  /* ---- Alliance board ------------------------------------------------------ */
  const fill = (selector, people) => {
    const el = board.querySelector(selector);
    if (el) el.innerHTML = people.map(personChip).join('');
  };
  fill('[data-list="greek-gods"]', gods.filter((g) => g.side === 'greek'));
  fill('[data-list="trojan-gods"]', gods.filter((g) => g.side === 'trojan'));
  fill('[data-list="greek-heroes"]', characters.filter((c) => c.side === 'greek'));
  fill('[data-list="trojan-heroes"]', characters.filter((c) => c.side === 'trojan'));

  const zeusSlot = board.querySelector('[data-zeus]');
  if (zeusSlot) zeusSlot.innerHTML = portraitHTML(gods.find((g) => g.id === 'zeus') || { id: 'zeus' });

  board.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open]');
    if (!trigger) return;
    const profile = lookup.get(trigger.dataset.open);
    if (profile) openProfile(profile, { list: [], lookup });
  });

  focusButtons.forEach((button) =>
    button.addEventListener('click', () => {
      board.dataset.focus = button.dataset.focusSide;
      focusButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    })
  );

  const fromHash = decodeURIComponent(window.location.hash.slice(1));
  if (lookup.has(fromHash) && lookup.get(fromHash).kind === 'god') {
    openProfile(lookup.get(fromHash), { list: gods, lookup });
  }
}

init();
