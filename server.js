/**
 * The Iliad Interactive — Express server
 *
 * Locally:  `npm start` serves the static site in /public and the JSON API.
 * On Vercel: this file is detected as a zero-config Express app. Static files
 *            in /public are served by Vercel's CDN; everything else (the /api
 *            routes and the 404 page) runs through this app.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

// Data is required (not read at runtime) so Vercel bundles it with the function.
const characters = require('./public/data/characters.json');
const gods = require('./public/data/gods.json');
const story = require('./public/data/story.json');
const timeline = require('./public/data/timeline.json');
const quiz = require('./public/data/quiz.json');
const battle = require('./public/data/battle.json');

const PUBLIC_DIR = path.join(__dirname, 'public');
const app = express();

/* ---------------------------------------------------------------- */
/* Middleware                                                        */
/* ---------------------------------------------------------------- */

app.disable('x-powered-by');

// Lightweight security headers (no extra dependency needed).
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

/** Fisher–Yates shuffle on a copy of the array. */
function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Send JSON with a short shared cache (data changes only on deploy). */
function sendData(res, data) {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.json(data);
}

/** Build list + detail routes for a collection of profiles. */
function profileRoutes(router, name, collection) {
  router.get(`/${name}`, (req, res) => {
    const { side } = req.query;
    sendData(res, side ? collection.filter((item) => item.side === side) : collection);
  });

  router.get(`/${name}/:id`, (req, res) => {
    const item = collection.find((entry) => entry.id === req.params.id);
    if (!item) return res.status(404).json({ error: `No ${name.slice(0, -1)} with id "${req.params.id}"` });
    return sendData(res, item);
  });
}

/* ---------------------------------------------------------------- */
/* API                                                               */
/* ---------------------------------------------------------------- */

const api = express.Router();

api.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', time: new Date().toISOString() });
});

profileRoutes(api, 'characters', characters);
profileRoutes(api, 'gods', gods);

api.get('/story', (req, res) => sendData(res, story));
api.get('/timeline', (req, res) => sendData(res, timeline));
api.get('/battle', (req, res) => sendData(res, battle));

// Quiz questions are shuffled per request, so it must not be cached.
api.get('/quiz', (req, res) => {
  const requested = Number.parseInt(req.query.count, 10);
  const count = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), quiz.length) : quiz.length;
  res.set('Cache-Control', 'no-store');
  res.json(shuffle(quiz).slice(0, count));
});

api.use((req, res) => res.status(404).json({ error: 'Unknown API route' }));

app.use('/api', api);

/* ---------------------------------------------------------------- */
/* Static site (local development; Vercel serves /public itself)     */
/* ---------------------------------------------------------------- */

app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'], // clean URLs: /story -> story.html
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
  })
);

/* ---------------------------------------------------------------- */
/* 404 + error handling                                              */
/* ---------------------------------------------------------------- */

const FALLBACK_404 =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Lost at sea · The Iliad Interactive</title></head>' +
  '<body style="font-family:system-ui,sans-serif;background:#FAF6EF;color:#1B1714;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center">' +
  '<main><h1>Lost on the wine-dark sea</h1><p>This page does not exist.</p><p><a href="/">Return to the home page</a></p></main></body></html>';

function read404() {
  try {
    return fs.readFileSync(path.join(PUBLIC_DIR, '404.html'), 'utf8');
  } catch (error) {
    return FALLBACK_404;
  }
}

app.use((req, res) => {
  res.status(404).type('html').send(read404());
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

/* ---------------------------------------------------------------- */
/* Start (only when run directly, not when imported by Vercel)       */
/* ---------------------------------------------------------------- */

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`The Iliad Interactive is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
