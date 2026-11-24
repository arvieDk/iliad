/**
 * api.js — data access.
 *
 * Every request goes to the Express API first (/api/...). If that fails
 * (offline preview, cold start, static hosting) it falls back to the same
 * JSON served statically from /data/. Responses are cached per page load.
 */

const cache = new Map();

async function fetchJSON(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

/**
 * Load a data set by name: 'characters' | 'gods' | 'story' | 'timeline' | 'quiz'.
 * @returns {Promise<any>}
 */
export function load(name) {
  if (!cache.has(name)) {
    const request = fetchJSON(`/api/${name}`)
      .catch(() => fetchJSON(`/data/${name}.json`))
      .catch((error) => {
        cache.delete(name); // allow a retry later
        throw error;
      });
    cache.set(name, request);
  }
  return cache.get(name);
}

/** Characters and gods together, as a Map keyed by id (for cross-links). */
export async function loadProfiles() {
  const [characters, gods] = await Promise.all([load('characters'), load('gods')]);
  const all = new Map();
  characters.forEach((c) => all.set(c.id, { ...c, kind: 'character' }));
  gods.forEach((g) => all.set(g.id, { ...g, kind: 'god' }));
  return all;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Escape text before inserting it into HTML. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Tiny localStorage wrapper that never throws (private mode, blocked storage). */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — ignore */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
};

/** Shared markup for a failed load. */
export function errorState(message = 'The scrolls could not be loaded. Please refresh the page.') {
  return `<p class="state state--error" role="alert">${esc(message)}</p>`;
}
