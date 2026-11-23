# The Iliad: an illustrated, interactive telling

A static website that tells the story of Homer's *Iliad* as one long illustrated scroll: a prologue, eight books, and an epilogue, drawn like Greek vase paintings, followed by a section of infographics about the poem.

## How it works

- **The invocation.** The site opens on the first line of the poem in Greek, with Samuel Butler's English writing itself in beneath it. Enter with sound or in silence.
- **The title.** Achilles alone before the walls of Troy at night, with a short guide to reading.
- **The chapters.** Each chapter starts with a title card (its number, the book, its Greek title, a one-line summary), then a full-screen picture that stays in place while text cards scroll over it. Each card that reaches the reading line plays its moment on the stage, and the camera moves to frame it. Between cards the camera keeps drifting with the scroll. Some moments follow the scroll directly: Paris's ship crossing the sea, the fleet sailing for Troy, the three laps around the city, Priam's night journey, the wooden horse, and Odysseus sailing home.
- **Things to touch.** A glowing ring on the stage marks something to try: the waves, the scales of Zeus, Hector's helmet, Achilles' lyre, the anvil (strike it five times to forge the shield, then touch each ring to see what Hephaestus made on it), the two urns of Zeus.
- **Before and after.** The prologue (the Judgment of Paris, Helen, the thousand ships) and the epilogue (the death of Achilles, the wooden horse, the fall of Troy, the Odyssey) are told in later Greek poems, and they are labeled that way.
- **Characters.** Touch a figure in a scene, or a name in the text, to open a profile with lineage, allies and rivals, fate, and the chapters where they appear. The menu has a gallery of all sixteen heroes and gods.
- **Glossary.** Words with a dotted underline explain themselves on hover or tap.
- **The menu.** Chapters (with the ones you have finished checked off), Heroes & Gods, a map of the Troad whose medallions jump to each book, and Sources.
- **The Iliad in numbers.** Seven small infographics that animate into view: lines in each of the 24 books, the 1,186 ships of the Catalogue, the gods taking sides, the chain of deaths from Sarpedon to Achilles, the days the poem covers, who appears in which chapter, and the rhythm of the first line (press play to hear it).
- **Sound.** Synthesized with the Web Audio API, so there are no audio files, plus an optional ambient lyre.
- **Phones.** Held upright, the picture fills the screen and the cards rise from below; the camera keeps any glowing ring in view.

Deep links: `#ch-0` is the prologue, `#ch-1` to `#ch-8` are the eight books, `#ch-9` is the epilogue, `#numbers` is the infographics, and `#map` opens the map. The older `#scroll-3` links still work.

## The pictures

Everything is drawn in code as SVG. Scenes by day are black-figure (black figures with incised lines on orange clay); scenes by night are red-figure (clay figures on black); the gods are drawn in gold. The palette comes from CSS variables, so a scene's `mode` switches it, and a light layer over each stage sets the time of day (noon, dusk, dawn, moonlight, smoke, firelight). Figures are posable rigs whose joints animate with CSS transitions. The far layers of each scene lag a little behind the camera for depth.

## Sources

Every quotation is word for word from Samuel Butler's translation (1898), as revised by Timothy Power and Gregory Nagy and published by the [Perseus Digital Library](https://www.perseus.tufts.edu/) ([source text](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng4.xml), CC BY-SA 4.0). Each carries its book and line reference, and cuts are marked with an ellipsis. The narration, profiles and glossary are original summaries.

The line counts and the ship count come from the [Greek text](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-grc2.xml) in the same library. (Butler's translation gives the Euboeans fifty ships at 2.545; the Greek says forty, which is how the total comes to 1,186.) The day spans in the timeline are the ones the poem states; the total of about fifty days follows the usual count.

## Running it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

To publish with Vercel, import the repository with the framework preset set to **Other**, no build command, and the project root as the output directory. GitHub Pages also works.

## Structure

```
index.html       the invocation, the title, the chapters container, the infographics, the menu and the profile drawer
css/art.css      the vase-painting palettes and everything drawn on the stages
css/style.css    the page: cards, chapter titles, top bar, menu, drawer, infographics, layouts
js/data.js       character profiles, glossary, places
js/art.js        the art kit: posable figures, scenery, props, effects
js/scenes.js     how each character is drawn, and the ten chapters with their beats
js/audio.js      synthesized sound effects and the ambient lyre
js/numbers.js    the infographics
js/app.js        the engine: scroll-driven stages, camera, menu, profiles, popovers
```

A chapter is `{ title, book, mode, light, greek, gloss, dek, build(c), beats[] }`. `build` draws the world and returns the things it will animate. Each beat has `cam: [x, y, zoom]` on a 1600 by 900 stage, `say` (narration), an optional `quote: [text, "book.line"]`, an optional `tap: { at: [x, y, radius], label }`, and `act(refs, c)`, which changes the picture. A beat can also have `scrub(refs, c, progress)`, called as the reader scrolls through it (it may return a camera), plus `tableau` (set the quotation large), `wash` (a red wash for a death) and `light` (change the light for this beat). Scrolling back replays earlier beats instantly, so `act` should set state rather than toggle it. Inside narration, `[[Hector]]` links a profile and `{{scaean|Scaean Gates}}` a glossary entry.
