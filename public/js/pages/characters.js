/**
 * Characters page: filterable profile cards that open detailed modals.
 */
import { observeReveal } from '../core/site.js';
import { load, loadProfiles, errorState } from '../core/api.js';
import { openProfile, renderProfileCards } from '../core/modal.js';

const grid = document.getElementById('character-grid');
const chips = document.querySelectorAll('[data-filter]');
const countEl = document.querySelector('[data-count]');

async function init() {
  let characters;
  let lookup;
  try {
    [characters, lookup] = await Promise.all([load('characters'), loadProfiles()]);
  } catch {
    grid.innerHTML = errorState();
    return;
  }

  const cards = renderProfileCards(grid, characters);
  observeReveal(grid);

  const visible = () => characters.filter((c) => !grid.querySelector(`[data-id="${c.id}"]`).hidden);

  const applyFilter = (filter) => {
    cards.forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.side !== filter;
    });
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter)));
    if (countEl) countEl.textContent = `${visible().length} of ${characters.length} heroes`;
  };

  chips.forEach((chip) => chip.addEventListener('click', () => applyFilter(chip.dataset.filter)));
  applyFilter('all');

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.profile-card');
    if (!card) return;
    const profile = characters.find((c) => c.id === card.dataset.id);
    openProfile(profile, { list: visible(), lookup });
  });

  // Deep link: /characters#hector opens Hector's profile.
  const fromHash = decodeURIComponent(window.location.hash.slice(1));
  const linked = characters.find((c) => c.id === fromHash);
  if (linked) openProfile(linked, { list: characters, lookup });
}

init();
