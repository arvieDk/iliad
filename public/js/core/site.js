/**
 * site.js — behaviour shared by every page:
 *   • mobile navigation (hamburger) and condensed sticky header
 *   • scroll-reveal animations
 *   • figure placeholders ([data-figure])
 *   • footer year
 * Imported first by each page module.
 */
import { hydrateFigures } from './figures.js';

document.documentElement.classList.remove('no-js');

/* ---- Navigation ---------------------------------------------------------- */
function initNav() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!header || !toggle || !nav) return;

  const desktop = window.matchMedia('(min-width: 960px)');

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---- Scroll reveal --------------------------------------------------------- */
let observer = null;

/** Observe .reveal elements inside root (call again after rendering content). */
export function observeReveal(root = document) {
  const items = root.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
  }
  items.forEach((el) => observer.observe(el));
}

/* ---- Scrollbars ------------------------------------------------------------- */
/* Scrollbars stay hidden until something scrolls and fade out half a second
   after it stops. The page gets a slim overlay bar (draggable with a mouse);
   inner scroll areas get an .is-scrolling class while they move. */
const HIDE_AFTER = 500;

function initScrollbars() {
  const root = document.documentElement;
  const bar = document.createElement('div');
  bar.className = 'page-scrollbar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<div class="page-scrollbar__thumb"></div>';
  document.body.appendChild(bar);
  const thumb = bar.firstElementChild;

  let hideTimer = 0;
  let dragging = false;
  let hovering = false;

  const metrics = () => {
    const view = window.innerHeight;
    const full = root.scrollHeight;
    const size = Math.max(36, (view / full) * view);
    return { view, full, size, travel: view - size, range: full - view };
  };

  const place = () => {
    const { size, travel, range } = metrics();
    bar.hidden = range <= 1 || document.body.classList.contains('is-locked');
    if (bar.hidden) return;
    thumb.style.height = `${size}px`;
    thumb.style.transform = `translateY(${range > 0 ? (window.scrollY / range) * travel : 0}px)`;
  };

  const show = () => {
    place();
    bar.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!dragging && !hovering) bar.classList.remove('is-visible');
    }, HIDE_AFTER);
  };

  bar.addEventListener('pointerenter', () => { hovering = true; show(); });
  bar.addEventListener('pointerleave', () => { hovering = false; show(); });

  // Drag the thumb, or click the track to jump there
  bar.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const { travel, range, size } = metrics();
    const onThumb = event.target === thumb;
    const startY = event.clientY;
    const startScroll = window.scrollY;
    if (!onThumb) {
      window.scrollTo({ top: ((event.clientY - size / 2) / travel) * range, behavior: 'auto' });
    }
    dragging = true;
    bar.classList.add('is-dragging');
    bar.setPointerCapture(event.pointerId);
    const move = (e) => {
      if (!onThumb) return;
      window.scrollTo({ top: startScroll + ((e.clientY - startY) / travel) * range, behavior: 'auto' });
    };
    const up = () => {
      dragging = false;
      bar.classList.remove('is-dragging');
      bar.removeEventListener('pointermove', move);
      show();
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up, { once: true });
    bar.addEventListener('pointercancel', up, { once: true });
  });

  // Inner scroll areas: mark them while they move
  const timers = new WeakMap();
  document.addEventListener('scroll', (event) => {
    const target = event.target;
    if (target === document || target === root || target === document.body) {
      show();
      return;
    }
    if (!(target instanceof Element)) return;
    target.classList.add('is-scrolling');
    clearTimeout(timers.get(target));
    timers.set(target, setTimeout(() => target.classList.remove('is-scrolling'), HIDE_AFTER));
  }, { capture: true, passive: true });

  window.addEventListener('resize', place, { passive: true });
  new ResizeObserver(place).observe(document.body);
  place();
}

/* ---- Boot --------------------------------------------------------------------- */
initNav();
initScrollbars();
hydrateFigures();
observeReveal();

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
