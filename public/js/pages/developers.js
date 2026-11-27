/**
 * Developers page: framed portraits built from
 * /content/developers/developers.json, hung in front of a temple drawn as a
 * background. The content and photos live in public/content/developers/
 * (see the README in that folder).
 */
import { observeReveal } from '../core/site.js';

const FOLDER = '/content/developers/';
const gallery = document.getElementById('dev-gallery');

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** A plain file name points into the content folder; full URLs and paths are used as given. */
const photoUrl = (photo) =>
  (/^(https?:)?\/\//.test(photo) || photo.startsWith('/') ? photo : FOLDER + photo.split('/').map(encodeURIComponent).join('/'));

/** First-name and surname initials, skipping middle initials: "Arvie G. Rivera" → "AR" */
const initials = (name) => {
  const words = String(name || '?').trim().split(/\s+/).filter((w) => !/^[A-Z]\.$/i.test(w));
  const first = words[0] || '?';
  const last = words.length > 1 ? words[words.length - 1] : '';
  return (first[0] + (last ? last[0] : '')).toUpperCase();
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function frameHtml(member, index) {
  const name = escape(member.name || 'Developer');
  const photo = member.photo
    ? `<img src="${escape(photoUrl(member.photo))}" alt="Photo of ${name}" loading="lazy" decoding="async">`
    : '';
  return `
    <li class="dev-frame reveal" style="--i:${index % 5}">
      <figure class="dev-frame__art">
        <div class="dev-frame__mat">
          <div class="dev-frame__photo${member.photo ? '' : ' is-empty'}" data-initials="${escape(initials(member.name))}">${photo}</div>
        </div>
      </figure>
      <div class="dev-frame__plaque">
        <span class="dev-frame__num" aria-hidden="true">${ROMAN[index] || index + 1}</span>
        <h2 class="dev-frame__name">${name}</h2>
      </div>
    </li>`;
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value) node.textContent = value;
}

async function init() {
  let data;
  try {
    const response = await fetch(FOLDER + 'developers.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(response.statusText);
    data = await response.json();
  } catch {
    gallery.innerHTML = '<li class="state">The team could not be loaded. Check that developers.json is valid JSON.</li>';
    return;
  }

  setText('[data-dev-eyebrow]', data.eyebrow);
  setText('[data-dev-title]', data.title);
  setText('[data-dev-intro]', data.intro);

  const members = Array.isArray(data.members) ? data.members : [];
  if (!members.length) {
    gallery.innerHTML = '<li class="state">No developers listed yet.</li>';
    return;
  }

  gallery.innerHTML = members.map(frameHtml).join('');

  // A missing or misspelled photo falls back to the person's initials
  gallery.querySelectorAll('.dev-frame__photo img').forEach((img) => {
    img.addEventListener('error', () => {
      img.parentElement.classList.add('is-empty');
      img.remove();
    }, { once: true });
  });

  observeReveal(gallery);
}

init();
