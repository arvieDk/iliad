# The Iliad: an illustrated, interactive telling

A static website that tells the story of Homer's *Iliad* as eight animated scenes you step into, from the quarrel of Achilles and Agamemnon to the funeral of Hector. It opens on a closed, gold-tooled book; after that the book is gone, and the story plays out full screen in pictures drawn like Greek vase paintings.

## How it works

- **The cover.** Tap the book to open it. The inside page gives the opening line of the poem and the way in.
- **The map of Troy.** The plain of the Troad, with the Achaean ships, the rivers, Mount Ida and the walls of Ilion. Eight medallions mark the scenes. The next one to play glows, and the ones you have seen get a laurel wreath (remembered in the browser).
- **The scenes.** Each scene is a drawn world with a moving camera. Every step adds a line of narration, often a quotation from the poem, and something changes in the picture. Some steps wait for you: a glowing ring asks you to touch Achilles, the waves, the scales of Zeus, Hector's helmet, and so on.
- **Things to play with.** Pluck Achilles' lyre, strike Hephaestus' anvil to forge the shield ring by ring, then touch each ring to see what he made on it; touch the two urns of Zeus.
- **Characters.** Touch a figure in a scene, or a name in the narration, to open a profile with lineage, allies and rivals, fate, and the scenes where they appear. A gallery of all sixteen heroes and gods is one tap away.
- **Glossary.** Words with a dotted underline explain themselves on hover or tap.
- **Sound.** Synthesized with the Web Audio API, so there are no audio files: arrows, bronze, thunder, the anvil, fire, hooves, a lament, and an optional ambient lyre (off by default).
- **Phones.** On a phone held upright the picture sits above the caption; held sideways, the caption moves to the right. Swipe left or right to move between steps; on a keyboard, use the arrow keys.

Deep links: `#map` opens the map and `#scroll-3` opens the third scene.

## The pictures

Everything is drawn in code as SVG. Scenes by day are black-figure (black figures with incised lines on orange clay); scenes by night are red-figure (clay figures on black). The palette comes from CSS variables, so a scene's `mode` switches it. Figures are posable rigs whose joints animate with CSS transitions.

## Sources

Every quotation is word for word from Samuel Butler's translation (1898), as revised by Timothy Power and Gregory Nagy and published by the [Perseus Digital Library](https://www.perseus.tufts.edu/) ([source text](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng4.xml), CC BY-SA 4.0). Each carries its book and line reference, and cuts are marked with an ellipsis. The narration, profiles and glossary are original summaries.

## Running it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

To publish with Vercel, import the repository with the framework preset set to **Other**, no build command, and the project root as the output directory. GitHub Pages also works.

## Structure

```
index.html       the cover, the map, the scene player, and the overlays
css/style.css    the look: vase-painting palettes, parchment and gold, animations, layouts
js/data.js       character profiles, glossary, places
js/art.js        the art kit: posable figures, scenery, props, effects
js/scenes.js     how each character is drawn, and the eight scenes with their steps
js/audio.js      synthesized sound effects and the ambient lyre
js/app.js        the engine: book, map, camera, steps, profiles, gallery, popovers
```

A scene is `{ title, book, mode, build(c), beats[] }`. `build` draws the world and returns the things it will animate. Each beat has `cam: [x, y, zoom]` on a 1600 by 900 stage, `say` (narration), an optional `quote: [text, "book.line"]`, an optional `tap: { at: [x, y, radius], label }` that waits for a touch, and `act(refs, c)`, which changes the picture. Going back replays earlier beats instantly, so `act` should set state rather than toggle it. Inside narration, `[[Hector]]` links a profile and `{{scaean|Scaean Gates}}` a glossary entry.
