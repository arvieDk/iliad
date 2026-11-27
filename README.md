# The Iliad Interactive

Homer's *Iliad* retold through interaction: an eight-chapter choose-as-the-hero story, character and god profiles in modal windows, an alliance board, a Book-by-Book timeline and a fact-checked quiz hosted by animated characters.

Built with HTML, CSS and vanilla JavaScript (ES modules) on a small Node.js + Express server. No build step. Deploys to Vercel as is.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # same, restarts when server files change
```

Set `PORT` to use another port.

## Deploy to Vercel

Either import the repository in the Vercel dashboard, or run:

```bash
npx vercel        # preview
npx vercel --prod # production
```

No settings are needed:

- `server.js` exports the Express app, which Vercel detects as a zero-config Express project. It handles `/api/*` and the 404 page.
- Everything in `public/` is served directly by Vercel's CDN.
- `vercel.json` turns on clean URLs (`/story` instead of `/story.html`) and adds security and cache headers.

## Pages

| Route | What it does |
|---|---|
| `/` | Four bands over a fixed, faded painting: title, summary with an "at a glance" facts card and links to Britannica and the full text, a live 3-question mini quiz, and the board game teaser with its credit |
| `/story` | Eight chapters. Read short beats, choose as the character, then see what Homer wrote (Book cited). Progress is saved in the browser |
| `/characters` | Eleven mortals with Greek/Trojan filters and profile modals (key moments, connections, fate, a "did you know") |
| `/gods` | Eleven gods with the same modals, plus an alliance board based on the sides listed in Book 20 |
| `/timeline` | Twenty-one events grouped by phase, a 24-Book rail to jump around, and flags for events that are *not* in the Iliad |
| `/quiz` | Two modes in tabs. **Classic quiz:** ten random questions from a pool of eighteen, with instant feedback, sources, streaks and a saved best score. **Battle of Troy** (`/quiz#battle`): a visual novel, described below |
| `/game` | **Iliad: Greeks vs Trojans**, the board game (below) |
| `/developers` | The team inside a temple front: one card per developer (photo and name) standing between two pillars, under a pediment that rises behind the title. Edited in `public/content/developers/` (see below) |

### Greeks vs Trojans (board game)

> **For school purposes only.** This game is adapted from the board game *Iliad* by Bitewing Games, game design by Reiner Knizia. It is not an official version and is not for sale.

A two-sided strategy game on a 6×6 battlefield, ringed by 24 tokens. The rules are the original game's, unchanged:

- Each turn, place a tile from your hand on an empty space of your color that touches another tile.
- Tiles 1–4 have optional powers: move an enemy tile, move your own, swap a token with the market, or turn tiles face down. 5 has no power; **Dolos** (the wooden horse) counts as the sum of its neighbors.
- When a row or column fills, the higher total wins it and takes one of its end tokens. The loser gets the other.
- The support of all five gods wins (four gods plus both marriages also counts). Otherwise the most points win, then the tie-breaks.

What the redesign adds:

- **Every asset drawn**, as minimalist vector art, with no placeholders left:
  - 12 tiles (Roman numerals built from shapes, with a small power icon) and 2 tile backs
  - 2 team coins and 2 decks
  - 21 god tokens (Zeus, Apollo, Athena, Poseidon, Aphrodite), 6 hero and hardship tokens, and the marriage token
  - the board corners and the interface icons

  All of them are also exported as standalone files in `public/img/game/` (40 SVGs).
- Blue (Greeks) and red (Trojans), toned down to sit with the site's Iliad palette.
- **Three modes:** two players on one device, play as the Greeks against the computer, or play as the Trojans against the computer.
- **Interface:**
  - glowing legal spaces, and a preview of your tile when you hover one
  - tooltips for every tile and token
  - line and token choices you can click directly on the board
  - Escape puts back a picked tile
- **Animations:** a coin toss, a turn coin that flips, tiles dropping in and flipping face down, lines flashing when scored, and an end-of-game tally followed by a full score breakdown.
- **Saving:** the game is saved after every move, so a reload offers "Continue game".
- **Layout:** the play area fits on one screen. The board is sized from the window height, so there's no scrolling on laptops, desktops, tablets or most phones. The start menu is laid out flat over the board, with no card. The Sound button opens a small panel with on/off, music and effects volume.
- **Other:** a chronicle (game log), soft synthesized lyre-like sound with volume settings, a phone layout that keeps the active hand under the board, and a pieces legend on the page.

Code: `public/js/game/engine.js` (rules, no DOM), `ai.js` (computer opponent), `art.js` (all artwork), `audio.js` (sound), `public/js/pages/game.js` (interface), `public/css/game.css`.

### Battle of Troy (visual-novel quiz)

A start-to-finish visual novel built on the same fact-checked questions:

1. **Title screen.** Choose your side: fight as Achilles (against Paris, Ares and Hector) or as Hector (against Menelaus, Ajax and Achilles).
2. **Prologue.** The Muse sets the scene in a dialogue box with typewriter text. Click, tap, Enter or Space to continue.
3. **Three duels**, each in its own painted scene: the plain before Troy, the banks of the Scamander, the Greek ships, and the Scaean Gate at dusk. The champion asks the questions.
   - Right answer: your hero lunges, the spear thrusts, a slash lands and the enemy loses strength.
   - Wrong answer: the enemy strikes you.
   - Three right in a row: an **aristeia** (a hero's moment of glory) for extra damage.
   - After each answer the Muse gives the explanation and its Book.
   - Win a duel and you get some strength back before the next one.
4. **Ending.** Victory or defeat scenes, then results (champions defeated, accuracy), the best run saved on the device, a review of every answer, and buttons to fight again or switch sides.

The duels are a contest of knowledge, not scenes from the poem, and the prologue says so. The dialogue sticks to the poem's facts: Hector's offer to return the loser's body, his dying prophecy about Paris and Apollo, Ajax defending the ships, and so on. The script is in `public/data/battle.json`.

## API

| Endpoint | Returns |
|---|---|
| `GET /api/health` | `{ status: "ok" }` |
| `GET /api/characters` · `/api/characters/:id` | Characters (filter with `?side=greek` or `?side=trojan`) |
| `GET /api/gods` · `/api/gods/:id` | Gods (`?side=greek`, `trojan` or `neutral`) |
| `GET /api/story` | Story chapters |
| `GET /api/timeline` | `{ phases, events }` |
| `GET /api/quiz?count=10` | Shuffled questions |
| `GET /api/battle` | The Battle of Troy script (sides, opponents, lines, rules) |

The front end calls the API first and falls back to the same JSON files in `public/data/` if the API cannot be reached.

## Project structure

```
server.js            Express app (API, static files, 404)
vercel.json          Clean URLs and headers
public/
  *.html             One file per page
  css/
    tokens.css       Colors, type scale, spacing, motion
    base.css         Reset, typography, header, navigation, footer
    components.css   Buttons, cards, figures, modal, quiz
    pages.css        Page layouts
    battle.css       Battle of Troy stage, fighters, dialogue box, quiz tabs
    game.css         Board game layout, board, tiles, panels, overlays
  js/core/
    site.js          Navigation, scroll reveal, figure placeholders
    api.js           Data loading with fallback, helpers
    figures.js       Animated black-figure SVG characters
    modal.js         Profile modal (native <dialog>)
    quiz-engine.js   Quiz shared by the home page and /quiz
    battle-engine.js Battle of Troy visual novel
  js/game/           Board game: engine, computer opponent, artwork, sound
  js/pages/          One script per page
  img/game/          Every board-game asset as a standalone SVG
  data/              Characters, gods, story, timeline, quiz and battle (JSON)
  img/favicon.svg
  img/iliad-background.jpg  Home page background painting
  content/developers/       Developers page content and photos (editable)
```

To edit content, change the JSON files in `public/data/`. Nothing else needs to change.

### Editing the Developers page

Everything on `/developers` lives in `public/content/developers/`:

```
public/content/developers/
  developers.json    Title, intro and the list of developers
  README.md          Step-by-step instructions
  *.jpg / *.png      Photos, referenced by file name from developers.json
```

Add a photo to that folder, then add or edit an entry in `developers.json`:

```json
{ "name": "Maria Santos", "photo": "maria.jpg" }
```

Cards appear in list order and are numbered automatically. A missing photo shows the person's initials instead.

## Design

The colors come from the Iliad and the vases that illustrate it:

| Token | Source | Hex |
|---|---|---|
| `--dawn` | "rosy-fingered Dawn" | `#EBD5CE` |
| `--olive` | Homer's olive similes | `#D6D7C4` |
| `--ink` | "black ships", black-figure glaze | `#1B1714` |
| `--wine` | "the wine-dark sea" | `#2E1A26` |
| `--clay` | terracotta of Greek pottery | `#B85C38` |
| `--bronze` | the bronze-armoured Achaeans | `#A87B45` |
| `--saffron` | "saffron-robed Dawn" | `#E2A84B` |

The characters are drawn in black-figure style: ink silhouettes on terracotta, with details as thin "incised" lines. As on real black-figure vases, women's skin is painted in white. They blink, their crests sway and Apollo's rays turn. In the quiz they walk on stage, jump when you're right and shake their heads when you're wrong.

## Accessibility

- Skip link, landmarks, one `h1` per page, visible focus rings
- Mobile menu with `aria-expanded`; Esc closes it
- Modals use native `<dialog>`, so focus is trapped, Esc closes and focus goes back to the card
- Quiz and story feedback is announced through `aria-live`; quiz keys 1–4 or A–D
- Collapsed timeline panels are `inert`
- Text colors meet WCAG AA contrast
- Animations are switched off under `prefers-reduced-motion`
- Layout is mobile-first and tested at 375px with no horizontal scrolling

## Fact-checking

Each story beat, timeline event, profile detail and quiz answer was checked against Samuel Butler's public-domain prose translation (MIT Internet Classics Archive) and cites its Book. Some examples:

- Achilles chases Hector **three** times around the walls (Book 22)
- Asteropaeus grazes Achilles' arm and draws blood, so there is no invulnerable heel in Homer (Book 21)
- Hector gives Ajax a sword and Ajax gives Hector a belt (Book 7)
- Priam had fifty sons when the Greeks came, nineteen from one mother (Book 24)
- The gods' sides, from Book 20: Hera, Athena, Poseidon, Hermes and Hephaestus for the Greeks; Ares, Apollo, Artemis, Leto, Xanthus and Aphrodite for Troy

Events outside the poem, such as the Wooden Horse and the death of Achilles, are marked **"Not in the Iliad"**. All text is original wording; no copyrighted translation is quoted.
