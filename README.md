# The Iliad: an interactive book

A static website that tells the story of Homer's *Iliad* as a book you can page through. It opens on a closed, gold-tooled cover, and the pages turn in 3D as you read a condensed telling of the poem in eight "scrolls", from the quarrel of Achilles and Agamemnon to the funeral of Hector.

## Features

- **Page-turning book.** Two-page spreads on wide screens; a single page at a time on phones and tablets. Turn pages with the toolbar arrows, the arrow keys, a swipe, or a tap on the page.
- **Character profiles.** Names in the text open a profile with lineage, allies and rivals, key moments (each links to its chapter), and fate. Sixteen principal characters, mortal and divine.
- **Glossary.** Words with a dotted underline explain themselves on hover or tap.
- **Map of the Troad.** Tap a place to learn its part in the story and jump to the chapter.
- **Shield of Achilles.** An interactive shield whose rings describe the scenes Hephaestus forged.
- **Contents and Dramatis Personae** pages, plus toolbar shortcuts.
- **Sound.** A synthesized page-turn rustle (on by default) and an optional ambient lyre (off by default), both generated with the Web Audio API, so there are no audio files.

## Sources

Every italic excerpt is quoted word for word from Samuel Butler's translation (1898), as revised by Timothy Power and Gregory Nagy and published by the [Perseus Digital Library](https://www.perseus.tufts.edu/) ([source text](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng4.xml), CC BY-SA 4.0). Each excerpt carries its book and line reference. Bracketed Greek glosses are omitted and cuts are marked with an ellipsis. The connecting narrative, profiles, glossary, and map notes are original summaries.

## Running it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

To publish with GitHub Pages, enable Pages for the repository's default branch (root folder).

## Structure

```
index.html       page shell, toolbar, shared SVG ornaments
css/style.css    the look: parchment, gold leaf, meanders, layout for desktop and mobile
js/data.js       characters, glossary, and map places
js/content.js    the pages of the book and the eight chapters
js/audio.js      synthesized page-turn sound and ambient lyre
js/book.js       page rendering, the page-turn engine, profiles, popovers
```

To add or edit a page, change `ILIAD.pages` in `js/content.js`. Inside page text, `[[Hektor]]` links a character profile and `{{aegis|aegis}}` links a glossary entry. In two-page mode the page count must stay even so the back cover lands on the left.
