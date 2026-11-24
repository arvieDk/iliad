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

/* ---- Boot --------------------------------------------------------------------- */
initNav();
hydrateFigures();
observeReveal();

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
