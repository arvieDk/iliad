/**
 * Timeline page: the events in order as a carousel.
 *  • scroll-snap track: swipe, drag the scrollbar, use the arrows or ←/→
 *  • phase chips jump to the first event of a phase and follow the carousel
 */
import { observeReveal } from '../core/site.js';
import { load, loadProfiles, esc, errorState } from '../core/api.js';
import { portraitHTML } from '../core/figures.js';

const track = document.querySelector('[data-track]');
const chipBox = document.querySelector('[data-phases]');
const countNow = document.querySelector('[data-current]');
const countAll = document.querySelector('[data-total]');
const progress = document.querySelector('[data-progress]');
const prevBtn = document.querySelector('[data-prev]');
const nextBtn = document.querySelector('[data-next]');

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function bookLabel(books) {
  if (!books.length) return '';
  return books.length === 1 ? `Book ${books[0]}` : `Books ${books[0]}–${books[books.length - 1]}`;
}

function slideMarkup(ev, i, total, phaseName, profiles) {
  const cast = ev.figures
    .map((id) => profiles.get(id))
    .filter(Boolean)
    .map((p) => {
      const page = p.kind === 'god' ? '/gods' : '/characters';
      return `<a class="relation" href="${page}#${esc(p.id)}"><span class="relation__avatar">${portraitHTML(p)}</span><span><strong>${esc(p.name)}</strong></span></a>`;
    })
    .join('');
  const num = String(i + 1).padStart(2, '0');
  return `
  <article class="tl-slide${ev.inPoem ? '' : ' tl-slide--outside'}" id="event-${esc(ev.id)}" data-index="${i}"
    role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}: ${esc(ev.title)}">
    <header class="tl-slide__head">
      <span class="tl-slide__num" aria-hidden="true">${num}</span>
      <span class="tl-slide__phase">${esc(phaseName)}</span>
    </header>
    <div class="tl-slide__meta">
      ${ev.books.length ? `<span class="badge badge--book">${bookLabel(ev.books)}</span>` : ''}
      ${ev.inPoem ? '' : '<span class="badge badge--outside">Not in the Iliad</span>'}
    </div>
    <h3 class="tl-slide__title">${esc(ev.title)}</h3>
    <p class="tl-slide__summary">${esc(ev.summary)}</p>
    <p class="tl-slide__details">${esc(ev.details)}</p>
    ${cast ? `<div class="tl-slide__cast">${cast}</div>` : ''}
  </article>`;
}

async function init() {
  let data;
  let profiles;
  try {
    [data, profiles] = await Promise.all([load('timeline'), loadProfiles()]);
  } catch {
    track.innerHTML = errorState();
    return;
  }

  const { phases, events } = data;
  const phaseName = new Map(phases.map((p) => [p.id, p.label]));
  // Events in phase order (the data is already in story order within a phase)
  const ordered = phases.flatMap((p) => events.filter((e) => e.phase === p.id));
  const total = ordered.length;

  track.innerHTML = ordered.map((ev, i) => slideMarkup(ev, i, total, phaseName.get(ev.phase), profiles)).join('');
  const slides = Array.from(track.querySelectorAll('.tl-slide'));
  countAll.textContent = total;

  /* ---- Moving the carousel ------------------------------------------------- */
  let active = -1;

  const goTo = (index, { smooth = true } = {}) => {
    const i = Math.min(Math.max(index, 0), total - 1);
    const slide = slides[i];
    const left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    // Glide to nearby events; jump straight to far ones
    const near = active < 0 || Math.abs(i - active) <= 3;
    track.scrollTo({ left, behavior: smooth && near && !reduceMotion() ? 'smooth' : 'auto' });
    setActive(i);
  };

  /* ---- Phase chips ---------------------------------------------------------- */
  chipBox.innerHTML = phases
    .filter((p) => ordered.some((e) => e.phase === p.id))
    .map((p) => `<button type="button" class="chip" data-phase="${esc(p.id)}" aria-pressed="false">${esc(p.label)}</button>`)
    .join('');
  chipBox.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    goTo(ordered.findIndex((e) => e.phase === chip.dataset.phase));
  });

  /* ---- Keeping everything in step with the carousel ------------------------------- */
  function setActive(i) {
    if (i === active) return;
    active = i;
    const ev = ordered[i];
    slides.forEach((slide, n) => slide.classList.toggle('is-active', n === i));
    countNow.textContent = i + 1;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
    chipBox.querySelectorAll('.chip').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.phase === ev.phase)));
    // Keep the active chip visible when the chips scroll sideways on phones
    const chip = chipBox.querySelector('[aria-pressed="true"]');
    if (chip && chipBox.scrollWidth > chipBox.clientWidth) {
      chipBox.scrollTo({ left: chip.offsetLeft - chipBox.clientWidth / 2 + chip.offsetWidth / 2, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, n) => {
        const dist = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = n; }
      });
      setActive(best);
      const max = track.scrollWidth - track.clientWidth;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(track.scrollLeft / max, 1) : 1})`;
    });
  };
  track.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    // Re-centre the active slide at the new width
    const i = active;
    active = -1;
    goTo(i, { smooth: false });
  });

  prevBtn.addEventListener('click', () => goTo(active - 1));
  nextBtn.addEventListener('click', () => goTo(active + 1));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(active - 1); }
    if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    if (event.key === 'End') { event.preventDefault(); goTo(total - 1); }
  });
  // Clicking a side slide brings it to the centre
  track.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    const slide = event.target.closest('.tl-slide');
    if (slide && !slide.classList.contains('is-active')) goTo(Number(slide.dataset.index));
  });

  // Start on the first event inside the poem, or the one named in the URL
  const fromHash = decodeURIComponent(window.location.hash.slice(1)).replace(/^event-/, '');
  const hashed = ordered.findIndex((e) => e.id === fromHash);
  const firstInPoem = ordered.findIndex((e) => e.inPoem);
  goTo(hashed > -1 ? hashed : Math.max(firstInPoem, 0), { smooth: false });
  onScroll();
  observeReveal(track);
}

init();
