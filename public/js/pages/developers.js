/**
 * Developers page: cards built from /content/developers/developers.json and
 * set inside a temple front. Each card stands between two pillars; the pillars,
 * entablature and steps are plain elements, so the temple fits any number of
 * people and any screen width. The content and photos live in
 * public/content/developers/ (see the README in that folder).
 */
import { observeReveal } from '../core/site.js';

const FOLDER = '/content/developers/';
const temple = document.getElementById('dev-temple');
const colonnade = temple.querySelector('[data-colonnade]');

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** A plain file name points into the content folder; full URLs and paths are used as given. */
const photoUrl = (photo) =>
  (/^(https?:)?\/\//.test(photo) || photo.startsWith('/') ? photo : FOLDER + photo.split('/').map(encodeURIComponent).join('/'));

const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function cardHtml(member, index) {
  const name = escape(member.name || 'Developer');
  const photo = member.photo
    ? `<img src="${escape(photoUrl(member.photo))}" alt="Photo of ${name}" loading="lazy" decoding="async">`
    : '';
  return `
    <li class="dev-card reveal" style="--i:${index % 5}">
      <span class="dev-card__num" aria-hidden="true">${index + 1}</span>
      <figure class="dev-card__photo${member.photo ? '' : ' is-empty'}" data-initials="${escape(initials(member.name))}">
        ${photo}
      </figure>
      <h2 class="dev-card__name">${name}</h2>
    </li>`;
}

const pillar = '<li class="dev-pillar" aria-hidden="true"></li>';

/** Resolve a length custom property (it may use clamp() or vw) to pixels */
const probe = document.createElement('span');
probe.style.cssText = 'position:absolute;visibility:hidden;height:0;pointer-events:none';
temple.appendChild(probe);
function cssLength(name) {
  probe.style.width = `var(${name})`;
  return probe.getBoundingClientRect().width;
}

/**
 * How many cards fit in one row between pillars, and how wide each card is,
 * from the room the page gives. Every row uses the same card width.
 */
function measure(count) {
  const box = temple.parentElement;
  const boxStyles = getComputedStyle(box);
  const width = box.clientWidth - parseFloat(boxStyles.paddingLeft) - parseFloat(boxStyles.paddingRight);
  const pillarW = cssLength('--pillar');
  const cardMin = cssLength('--card-min');
  const cardMax = cssLength('--card-max');
  const gap = cssLength('--gap');
  const fit = Math.floor((width - pillarW) / (cardMin + pillarW + 2 * gap));
  const n = Math.max(1, Math.min(count, 5, fit));
  const cardW = Math.min(cardMax, (width - (n + 1) * pillarW - 2 * n * gap) / n);
  return { n, cardW: Math.max(0, Math.floor(cardW)) };
}

let cards = [];
let laidOut = 0;

/** Arrange the cards into rows: pillar, card, pillar, card, ..., pillar */
function layout(force = false) {
  if (!cards.length) return;
  const { n, cardW } = measure(cards.length);
  temple.style.setProperty('--card-w', `${cardW}px`);
  if (n === laidOut && !force) return;
  laidOut = n;
  temple.style.setProperty('--per-row', n);
  const rows = [];
  for (let i = 0; i < cards.length; i += n) rows.push(cards.slice(i, i + n));
  colonnade.replaceChildren();
  rows.forEach((row, r) => {
    if (r > 0) colonnade.insertAdjacentHTML('beforeend', '<div class="dev-beam" aria-hidden="true"></div>');
    const ol = document.createElement('ul');
    ol.className = 'dev-row';
    ol.setAttribute('role', 'list');
    ol.insertAdjacentHTML('beforeend', pillar);
    row.forEach((card) => {
      ol.appendChild(card);
      ol.insertAdjacentHTML('beforeend', pillar);
    });
    colonnade.appendChild(ol);
  });
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value) node.textContent = value;
}

function showState(message) {
  colonnade.innerHTML = `<p class="state">${message}</p>`;
}

async function init() {
  let data;
  try {
    const response = await fetch(FOLDER + 'developers.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(response.statusText);
    data = await response.json();
  } catch {
    showState('The team could not be loaded. Check that developers.json is valid JSON.');
    return;
  }

  setText('[data-dev-eyebrow]', data.eyebrow);
  setText('[data-dev-title]', data.title);
  setText('[data-dev-intro]', data.intro);

  const members = Array.isArray(data.members) ? data.members : [];
  if (!members.length) {
    showState('No developers listed yet.');
    return;
  }

  const holder = document.createElement('div');
  holder.innerHTML = members.map(cardHtml).join('');
  cards = [...holder.children];

  // A missing or misspelled photo falls back to the person's initials
  cards.forEach((card) => {
    const img = card.querySelector('img');
    img?.addEventListener('error', () => {
      img.parentElement.classList.add('is-empty');
      img.remove();
    }, { once: true });
  });

  layout(true);
  observeReveal(colonnade);
  new ResizeObserver(() => layout()).observe(temple.parentElement);
}

init();
