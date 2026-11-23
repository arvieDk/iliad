/* The Iliad: an illustrated, interactive telling
 * The cast as drawn figures, and the eight episodes as scenes.
 *
 * Each scene draws its world once, then plays a list of beats. A beat sets
 * the camera, the narration, an optional quotation, and what changes in the
 * scene. A beat with `tap` waits for the reader to touch a glowing ring.
 *
 * Quotations are word for word from Samuel Butler's translation (1898),
 * revised by Timothy Power and Gregory Nagy (Perseus Digital Library,
 * CC BY-SA 4.0). Cuts are marked with an ellipsis.
 */

window.ILIAD = window.ILIAD || {};

/* How each principal character is drawn */
ILIAD.cast = {
  achilles:   { kind: "warrior", helmet: true, shield: "gorgon", item: "spear", cls: "hero-gold" },
  agamemnon:  { kind: "warrior", helmet: true, beard: true, shield: "lion", item: "scepter", cls: "king" },
  menelaus:   { kind: "warrior", helmet: true, beard: true, shield: "boar", item: "spear" },
  odysseus:   { kind: "robed", beard: true, petasos: true, himation: true, item: "staff" },
  patroclus:  { kind: "warrior", hair: "short", item: "spear" },
  hector:     { kind: "warrior", helmet: true, shield: "lion", item: "spear", cls: "trojan" },
  priam:      { kind: "robed", beard: true, crown: true, himation: true, item: "scepter" },
  paris:      { kind: "warrior", hair: "long", item: "bow", cls: "trojan" },
  helen:      { kind: "woman", hair: "bun", skin: "white", himation: true },
  andromache: { kind: "woman", hair: "long", skin: "white" },
  zeus:       { kind: "robed", beard: true, wreath: true, himation: true, item: "thunder", halo: true },
  hera:       { kind: "woman", hair: "bun", skin: "white", crown: true, item: "scepter", halo: true },
  athena:     { kind: "woman", hair: "long", skin: "white", helmet: true, aegis: true, item: "spear", halo: true },
  apollo:     { kind: "robed", hair: "long", wreath: true, item: "bow", halo: true },
  aphrodite:  { kind: "woman", hair: "long", skin: "white", wreath: true, halo: true, himation: true },
  thetis:     { kind: "woman", hair: "long", skin: "white", halo: true, cls: "sea-goddess" }
};

/* Minor figures who appear in scenes but have no profile */
ILIAD.extras = {
  chryses:   { kind: "robed", beard: true, wreath: true, item: "staff", label: "Chryses" },
  soldier:   { kind: "warrior", helmet: true, shield: "tripod", item: "spear" },
  trojan:    { kind: "warrior", helmet: true, shield: "bull", item: "spear", cls: "trojan" },
  elder:     { kind: "robed", beard: true, himation: true },
  nurse:     { kind: "woman", hair: "bun", skin: "white" },
  ajax:      { kind: "warrior", helmet: true, beard: true, shield: "snake", item: "spear", label: "Ajax" },
  phoenix:   { kind: "robed", beard: true, item: "staff", label: "Phoenix" },
  hermes:    { kind: "robed", petasos: true, item: "caduceus", halo: true, label: "Hermes" },
  hephaestus:{ kind: "warrior", beard: true, hair: "short", item: "hammer", label: "Hephaestus" },
  euphorbos: { kind: "warrior", helmet: true, item: "spear", cls: "trojan", label: "Euphorbos" },
  nereid:    { kind: "woman", hair: "long", skin: "white" },
  mourner:   { kind: "woman", hair: "bun", skin: "white" },
  antilochus:{ kind: "warrior", hair: "short", label: "Antilochus" }
};

ILIAD.source = {
  short: "tr. Samuel Butler, rev. Power & Nagy",
  full: "Homer, The Iliad, translated by Samuel Butler (London: Longmans, Green and Co., 1898), revised by Timothy Power and Gregory Nagy. Perseus Digital Library, Tufts University.",
  url: "https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng4.xml",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
};

(function () {
  const GY = 760; // the ground line of every scene

  /* small props used in several scenes */
  function baby(A, p) {
    const b = A.g({ class: "baby" }, p);
    A.path("M-16 0 Q-18 -14 -4 -16 L14 -12 Q20 -6 14 2 Q0 8 -16 0 Z", { class: "fill" }, b);
    A.el("circle", { cx: 18, cy: -16, r: 8, class: "skin-w" }, b);
    A.path("M-12 -6 L10 -8 M-10 -2 L12 -3", { class: "inc" }, b);
    return b;
  }
  function helmetProp(A, p, cls = "") {
    const h = A.g({ class: "prop-helmet " + cls }, p);
    A.path("M-14 -18 Q-17 -46 2 -47 Q18 -46 19 -30 L20 -20 L13 -20 L12 -24 Q8 -27 3 -24 L3 -14 L9 -10 L9 -2 Q-2 2 -10 -4 Q-14 -10 -14 -18 Z", { class: "fill" }, h);
    A.path("M-24 -34 Q-18 -78 10 -72 Q26 -68 22 -50 Q14 -66 -2 -62 Q-16 -58 -24 -34 Z", { class: "crest" }, h);
    A.path("M-10 -32 Q2 -40 15 -32", { class: "inc" }, h);
    return h;
  }
  function tripod(A, p, x, y, s = 1) {
    const t = A.g({ class: "gift", transform: `translate(${x} ${y}) scale(${s})` }, p);
    A.path("M-30 -60 L30 -60 Q26 -34 0 -30 Q-26 -34 -30 -60 Z", { class: "gold" }, t);
    A.path("M-24 -40 L-34 0 M24 -40 L34 0 M0 -30 L0 0 M-30 -60 q-6 -16 6 -18 M30 -60 q6 -16 -6 -18", { class: "gold-stroke" }, t);
    return t;
  }
  function urn(A, p, x, y, cls) {
    const u = A.g({ class: "urn " + cls, transform: `translate(${x} ${y})` }, p);
    A.path("M-14 -110 L14 -110 L12 -96 Q40 -80 40 -46 Q40 -10 20 0 L-20 0 Q-40 -10 -40 -46 Q-40 -80 -12 -96 Z", { class: "fill" }, u);
    A.path("M-30 -60 L30 -60 M-34 -40 L34 -40", { class: "inc" }, u);
    A.path("M-12 -96 Q-34 -100 -36 -76 M12 -96 Q34 -100 36 -76", { class: "lyre-frame" }, u);
    return u;
  }
  function army(A, p, x, y, n, spec, facing, s = 0.55, gap = 46) {
    const grp = A.g({ class: "army" }, p);
    const out = [];
    for (let i = 0; i < n; i++) out.push(A.figure(grp, spec, x + i * gap * facing, y, { scale: s, facing, pose: i % 2 ? "guard" : "stand" }));
    grp._figs = out;
    return grp;
  }

  /* ================================================================ *
   * The eight scenes
   * ================================================================ */
  ILIAD.scenes = [
    /* ------------------------------------------------------------ I */
    {
      n: 1, title: "The Wrath of Achilles", book: "I", mode: "day", place: "myrmidons",
      greek: "Μῆνις", gloss: "The Wrath", light: "noon", dek: "A quarrel over a captive splits the Achaean army, and Achilles withdraws from the war.",
      build(c) {
        const A = c.A, r = {};
        A.sky(c.bg, "day");
        A.sun(c.bg, 1380, 170, 50);
        A.clouds(c.bg, 140);
        r.olympus = A.g({ class: "olympus fadeable gone" }, c.bg);
        A.mountain(r.olympus, 1180, 420, 520, 300, "far");
        A.clouds(r.olympus, 180, 2);
        r.sea = A.sea(c.bg, 470, 140);
        A.ship(c.bg, 240, 560, 0.7, 1, { sail: false });
        A.ship(c.bg, 640, 556, 0.6, 1);
        A.ship(c.bg, 1520, 560, 0.7, -1);
        A.ground(c.bg, 590, "ground");
        A.tent(c.mid, 120, 640, 0.9);
        A.tent(c.mid, 1460, 640, 1);
        r.pyres = A.g({ class: "fadeable gone" }, c.mid);
        [[300, 640, 0.6], [1180, 630, 0.5], [880, 620, 0.45]].forEach(([x, y, s]) => { A.pyre(r.pyres, x, y, s); A.fire(r.pyres, x, y - 40 * s, s); });
        r.apollo = c.fig("apollo", 260, 330, { facing: 1, pose: "attack", scale: 0.9, cls: "fadeable gone sky-god" });
        r.arrows = A.arrows(c.fx, 16, "gone");
        r.chryses = c.extra("chryses", 330, GY, { pose: "plead" });
        r.agamemnon = c.fig("agamemnon", 690, GY, { facing: -1, pose: "point" });
        r.achilles = c.fig("achilles", 1040, GY, { facing: -1, pose: "stand" });
        r.athena = c.fig("athena", 1150, GY, { facing: -1, pose: "point", cls: "fadeable gone" });
        r.thetis = c.fig("thetis", 1330, 650, { facing: -1, pose: "hail", scale: 0.9, cls: "fadeable gone rising" });
        r.zeus = c.fig("zeus", 1180, 300, { facing: -1, pose: "sit", scale: 0.8, cls: "fadeable gone" });
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [520, 520, 1.3],
          say: "In the ninth year of the war, old {{chryses|Chryses}}, a priest of [[Apollo]], comes to the Achaean ships with a ransom to free his daughter. [[Agamemnon]] keeps the girl and drives him away with threats.",
          act(r) { r.chryses.pose("plead"); r.agamemnon.pose("point"); } },
        { cam: [800, 450, 1],
          say: "Chryses prays, and Apollo answers. For nine days the god’s arrows of plague rain down on the camp, and the funeral pyres burn day and night.",
          act(r, c) { r.chryses.pose("raise").move(250); r.apollo.show(); r.arrows.classList.remove("gone"); r.pyres.classList.remove("gone"); c.sfx("arrows"); } },
        { cam: [880, 560, 1.4],
          say: "[[Achilles]] calls the host to assembly. Agamemnon agrees to return the girl, but demands {{briseis|Briseis}}, Achilles’ own prize of honor, in her place.",
          quote: ["You are steeped in insolence and lust of gain.", "1.149"],
          act(r) { r.apollo.show(false); r.arrows.classList.add("gone"); r.chryses.show(false); r.achilles.pose("stride").move(960); r.agamemnon.face(1).pose("point"); } },
        { cam: [900, 560, 1.5],
          say: "Rage rises in Achilles. He grips his sword and begins to draw it from the scabbard.",
          tap: { at: [1110, 560, 48], label: "Touch the light behind Achilles" },
          act(r, c) { r.achilles.pose("attack"); c.sfx("clang"); } },
        { cam: [960, 560, 1.5],
          say: "[[Athena]] stands behind him, seen by no one else. She stays his hand, and Achilles sheathes his sword, swearing that the Achaeans will one day long for him in vain.",
          quote: ["Athena came down from heaven… and seized the son of Peleus by his yellow hair, visible to him alone, for of the others no man could see her.", "1.194–198"],
          act(r, c) { r.athena.show().move(1050); r.achilles.pose("stand"); c.sfx("chime"); } },
        { cam: [1180, 600, 1.4],
          say: "[[Patroclus|Patroclus]] leads Briseis away. Alone by the grey sea, Achilles weeps and calls to his mother.",
          tap: { at: [1330, 520, 56], label: "Touch the waves" },
          act(r) { r.athena.show(false); r.agamemnon.face(-1).pose("stand"); r.achilles.face(1).pose("mourn").move(1200); } },
        { tableau: true, cam: [1180, 420, 1.1],
          say: "[[Thetis]] rises from the sea like a mist and carries her son’s prayer to [[Zeus]]: let the Trojans win, until the Achaeans honor him.",
          quote: ["As he spoke the son of Kronos bowed his dark brows, and the ambrosial locks swayed on his immortal head, till vast Olympus reeled.", "1.528–530"],
          act(r, c) { r.thetis.show(); r.achilles.pose("hail"); r.olympus.classList.remove("gone"); r.zeus.show(); c.later(900, () => { r.zeus.pose("sit", { head: 24 }); c.shake(); c.sfx("thunder"); }); } }
      ]
    },

    /* ------------------------------------------------------------ II */
    {
      n: 2, title: "Helen upon the Wall", book: "III", mode: "day", place: "scaean",
      greek: "Τειχοσκοπία", gloss: "The View from the Wall", light: "noon", dek: "Paris and Menelaus fight for Helen while she watches from the walls of Troy.",
      build(c) {
        const A = c.A, r = {};
        A.sky(c.bg, "day");
        A.sun(c.bg, 260, 150, 44);
        A.clouds(c.bg, 120, 3);
        A.hills(c.bg, 560, 60, "far");
        A.ground(c.bg, 600, "ground");
        A.walls(c.mid, 1060, GY, 560, 300, { towers: [1180, 1480] });
        r.achaeans = army(A, c.mid, 90, 640, 6, ILIAD.extras.soldier, 1, 0.5, 40);
        r.trojans = army(A, c.mid, 980, 640, 3, ILIAD.extras.trojan, -1, 0.5, 40);
        r.names = A.g({ class: "names fadeable gone" }, c.fx);
        [["Agamemnon", 110, 520], ["Odysseus", 200, 470], ["Ajax", 290, 520]].forEach(([n, x, y]) => {
          const t = A.g({ class: "name-tag" }, r.names);
          A.el("rect", { x: x - 60, y: y - 18, width: 120, height: 26, rx: 4 }, t);
          A.el("text", { x, y: y, "text-anchor": "middle" }, t).textContent = n;
          A.path(`M${x} ${y + 8} L${x} 570`, { class: "tag-line" }, t);
        });
        r.priam = c.fig("priam", 1260, 460, { facing: -1, scale: 0.8 });
        r.helen = c.fig("helen", 1160, 460, { facing: -1, scale: 0.8, pose: "point" });
        A.el("rect", { x: 1090, y: 430, width: 240, height: 30, class: "parapet" }, c.mid);
        r.paris = c.fig("paris", 660, GY, { facing: -1, pose: "stride" });
        r.menelaus = c.fig("menelaus", 420, GY, { facing: 1, pose: "stand" });
        r.hector = c.fig("hector", 860, GY, { facing: -1, pose: "point", cls: "fadeable gone" });
        r.spear = A.g({ class: "thrown gone" }, c.fx);
        A.path("M-100 0 L100 0 M100 -4 L122 0 L100 4 Z", { class: "shaft" }, r.spear);
        r.aphrodite = c.fig("aphrodite", 760, GY, { facing: -1, pose: "hold", cls: "fadeable gone" });
        r.mist = A.mist(c.fx, 650, 660, 150);
        r.mist.classList.add("gone");
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [560, 560, 1.3],
          say: "The armies face each other across the plain. [[Paris]] steps out, challenging the bravest Achaean. When [[Menelaus|Menelaus]], the husband he wronged, springs forward, Paris shrinks back into the ranks.",
          act(r) { r.paris.pose("stride").move(660); r.menelaus.pose("stride").move(460); } },
        { cam: [720, 560, 1.3],
          say: "[[Hector]] shames his brother, and Paris agrees to fight Menelaus man to man. The winner will take [[Helen]] and her wealth, and the war will end.",
          act(r) { r.paris.pose("stand").move(720); r.hector.show().pose("point"); } },
        { cam: [1220, 460, 1.6],
          say: "Helen is called to the {{scaean|Scaean Gates}}, where the elders of Troy sit on the tower. Old [[Priam]] seats her kindly beside him.",
          quote: ["I lay no responsibility upon you, it is the gods, not you who are responsible.", "3.164–165"],
          act(r) { r.hector.show(false); } },
        { cam: [520, 540, 1.1],
          say: "Priam asks her to name the Achaean kings on the plain below.",
          tap: { at: [190, 600, 70], label: "Touch the Achaean ranks" },
          act() {} },
        { cam: [520, 540, 1.1],
          say: "Helen names them: [[Agamemnon]], king of men; [[Odysseus]] of many wiles, from rugged {{ithaca|Ithaca}}; and huge Ajax, the bulwark of the Achaeans.",
          act(r) { r.names.classList.remove("gone"); } },
        { cam: [580, 600, 1.4],
          say: "The oaths are sworn and the duel begins. Paris throws first, and his spear glances off Menelaus’ shield.",
          tap: { at: [440, 560, 54], label: "Touch Menelaus to make his throw" },
          act(r) { r.names.classList.add("gone"); r.paris.pose("throwback").move(700); r.menelaus.pose("guard").move(470); } },
        { tableau: true, cam: [580, 600, 1.4],
          say: "Menelaus’ spear tears through Paris’ armor. His sword shatters on Paris’ helmet, so he seizes him by the plume and drags him toward the Achaeans.",
          quote: ["Menelaos would have dragged him off to his own great glory had not Zeus’ daughter Aphrodite been quick to mark and to break the strap of oxhide, so that the empty helmet came away in his hand.", "3.373–375"],
          act(r, c) { r.menelaus.pose("throwback"); c.fly(r.spear, [470, 600], [690, 620]); c.sfx("clang"); c.later(700, () => { r.paris.pose("fall").move(660); r.menelaus.pose("stride").move(560); }); } },
        { cam: [640, 600, 1.3],
          say: "[[Aphrodite]] hides Paris in a thick mist and carries him home to his perfumed chamber. Menelaus is left holding an empty helmet, and soon the truce is broken.",
          act(r, c) { r.aphrodite.show(); r.mist.classList.remove("gone"); c.later(900, () => r.paris.show(false)); c.later(1600, () => { r.aphrodite.show(false); r.mist.classList.add("gone"); r.menelaus.pose("raise"); }); } }
      ]
    },

    /* ------------------------------------------------------------ III */
    {
      n: 3, title: "Hector and Andromache", book: "VI", mode: "day", place: "troy", warm: true,
      greek: "Ἕκτορος καὶ Ἀνδρομάχης ὁμιλία", gloss: "The Meeting of Hector and Andromache", light: "dusk", dek: "A last farewell at the Scaean Gates.",
      build(c) {
        const A = c.A, r = {};
        A.sky(c.bg, "day");
        A.sun(c.bg, 1320, 210, 56);
        A.clouds(c.bg, 110, 3);
        A.ground(c.bg, 640, "ground");
        r.walls = A.walls(c.mid, -100, GY, 1800, 330, { towers: [260, 1340], gate: 800 });
        A.figtree(c.mid, 120, GY, 1.2);
        r.hector = c.fig("hector", 560, GY, { facing: 1, pose: "stride" });
        r.andromache = c.fig("andromache", 1140, GY, { facing: -1, pose: "run" });
        r.nurse = c.extra("nurse", 1280, GY, { facing: -1, pose: "hold" });
        r.baby = baby(A, c.act);
        r.baby.style.transform = "translate(1236px, 640px)";
        r.helmet = helmetProp(A, c.act, "gone");
        r.helmet.style.transform = "translate(700px, 754px) rotate(-12deg)";
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [800, 520, 1.1],
          say: "As the battle turns against Troy, [[Hector]] comes back to the city. At the {{scaean|Scaean Gates}} his wife runs to meet him, followed by a nurse carrying their baby son, {{astyanax|Astyanax}}.",
          act(r) { r.hector.pose("stand").move(700); r.andromache.pose("run").move(980); } },
        { cam: [820, 580, 1.5],
          say: "[[Andromache]] takes his hand and weeps. [[Achilles]] killed her father and all seven of her brothers. Hector is all the family she has left.",
          quote: ["Nay—Hektor—you who to me are father, mother, brother, and dear husband—have mercy upon me; stay here upon this wall; make not your child fatherless, and your wife a widow…", "6.429–432"],
          act(r) { r.andromache.pose("plead").move(860); } },
        { cam: [960, 560, 1.4],
          say: "Hector cannot hang back from the fighting. He reaches for his son, but the boy screams at the sight of the great nodding horsehair plume and hides in his nurse’s arms.",
          tap: { at: [700, 520, 46], label: "Touch Hector’s helmet" },
          act(r) { r.hector.pose("hold").move(760); r.andromache.pose("stand"); r.baby.classList.add("crying"); } },
        { tableau: true, cam: [860, 580, 1.4],
          say: "His father and mother laugh. Hector takes off the gleaming helmet, lays it on the ground, and lifts his son, praying that one day people will say the boy was better than his father.",
          quote: ["Hektor took the helmet from his head and laid it all gleaming upon the ground. Then he took his darling child, kissed him, and dandled him in his arms…", "6.472–474"],
          act(r, c) { r.hector.helmet(false); r.helmet.classList.remove("gone"); r.baby.classList.remove("crying"); r.baby.classList.add("held"); r.baby.style.transform = "translate(806px, 610px)"; r.hector.cls("no-shield").pose("hold"); r.andromache.pose("stand", { head: -8 }); c.sfx("chime"); } },
        { cam: [800, 520, 1.05],
          say: "He gives the boy back to Andromache, takes up his plumed helmet, and goes out to war. She walks home, looking back again and again, and the women of the house mourn Hector while he still lives.",
          act(r) { r.helmet.classList.add("gone"); r.hector.cls("no-shield", false).helmet(true).pose("stride").face(-1).move(420); r.baby.classList.remove("held"); r.baby.style.transform = "translate(1236px, 640px)"; r.andromache.face(1).pose("stride", { head: -14 }).move(1060); } }
      ]
    },

    /* ------------------------------------------------------------ IV */
    {
      n: 4, title: "The Embassy", book: "IX", mode: "night", place: "ships",
      greek: "Πρεσβεία", gloss: "The Embassy", light: "moon", dek: "Gifts and pleading cannot move Achilles, who chooses between two fates.",
      build(c) {
        const A = c.A, r = {};
        A.sky(c.bg, "night");
        A.moon(c.bg, 280, 150, 34);
        A.hills(c.bg, 540, 40, "far");
        r.fires = A.g({ class: "watchfires" }, c.bg);
        for (let i = 0; i < 26; i++) A.fire(r.fires, 820 + (i * 61) % 760, 520 + (i * 37) % 70, 0.12 + (i % 3) * 0.04);
        A.ground(c.bg, 600, "ground");
        A.tent(c.mid, 360, GY, 2.1, "big");
        A.fire(c.mid, 700, GY, 0.7);
        r.achilles = c.fig("achilles", 420, GY, { facing: 1, pose: "sitlyre", cls: "no-shield" });
        r.achilles.parts.farArm._item && r.achilles.parts.farArm._item.classList.add("gone");
        r.lyre = A.g({ class: "toy lyre-toy", transform: "translate(470 640)" }, c.act);
        A.path("M-16 -8 Q-30 -44 -14 -60 M16 -8 Q30 -44 14 -60 M-18 -54 L18 -54", { class: "lyre-frame" }, r.lyre);
        A.el("ellipse", { cx: 0, cy: -2, rx: 18, ry: 10, class: "fill" }, r.lyre);
        for (let i = -2; i <= 2; i++) A.path(`M${i * 4} -4 L${i * 5} -54`, { class: "string" }, r.lyre);
        r.patroclus = c.fig("patroclus", 250, GY, { facing: 1, pose: "sit" });
        r.odysseus = c.fig("odysseus", 1900, GY, { facing: -1, pose: "stride" });
        r.ajax = c.extra("ajax", 2020, GY, { facing: -1, pose: "stride" });
        r.phoenix = c.extra("phoenix", 2140, GY, { facing: -1, pose: "stride" });
        r.gifts = A.g({ class: "fadeable gone gifts" }, c.act);
        tripod(A, r.gifts, 980, GY, 1); tripod(A, r.gifts, 1060, GY, 0.8); tripod(A, r.gifts, 1130, GY, 0.9);
        A.horse(r.gifts, 1290, GY, 0.9, -1);
        r.scales = A.scales(c.act, 800, 520, 1.4);
        r.scales.classList.add("fadeable", "gone");
        const lbl = (x, t) => { const e = A.el("text", { x, y: -14, "text-anchor": "middle", class: "pan-label" }, r.scales); e.textContent = t; };
        lbl(-104, "a long life"); lbl(104, "undying glory");
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [1100, 520, 1.2],
          say: "As [[Zeus]] promised, the Trojans have driven the Achaeans back to their ships. Tonight a thousand Trojan watchfires burn on the plain.",
          act() {} },
        { cam: [520, 560, 1.4],
          say: "In his tent, [[Achilles]] plays a silver-bridged lyre and sings of the deeds of heroes, while [[Patroclus]] sits listening.",
          tap: { at: [470, 600, 46], label: "Touch the lyre" },
          act() {} },
        { cam: [820, 560, 1.1],
          say: "Three envoys arrive: [[Odysseus]], great Ajax, and old Phoenix, who raised Achilles. This is the {{embassy|embassy}}. Odysseus lists [[Agamemnon]]’s gifts: tripods and gold, swift horses, seven cities, and Briseis returned.",
          act(r, c) { c.pluck(); r.odysseus.move(900).pose("plead"); r.ajax.move(1020).pose("stand"); r.phoenix.move(1140).pose("stand"); r.gifts.classList.remove("gone"); r.achilles.pose("sit"); } },
        { cam: [660, 560, 1.3],
          say: "Achilles answers with iron. No gift can buy back a life once lost.",
          quote: ["Hateful to me like the gates of Hades is the man who says one thing while he hides another thing in his mind…", "9.312–313"],
          act(r) { r.gifts.classList.add("gone"); r.achilles.pose("point"); r.odysseus.pose("stand"); } },
        { cam: [800, 470, 1.25],
          say: "Then he reveals what his mother told him: he must choose between two fates.",
          tap: { at: [800, 440, 60], label: "Touch the scales" },
          act(r) { r.scales.classList.remove("gone"); } },
        { tableau: true, cam: [800, 470, 1.25],
          say: "Go home, and live long but be forgotten. Stay, and die young at Troy, but win {{kleos|kleos}}, glory that never fades. Achilles will not fight, and the envoys go back with nothing.",
          quote: ["If I stay here and fight, I shall lose my safe homecoming but I will have a glory that is unwilting…", "9.412–413"],
          act(r) { r.scales.classList.add("tipped"); r.odysseus.face(1).pose("stride").move(1400); r.ajax.face(1).pose("stride").move(1520); r.phoenix.pose("sit").move(1000); } }
      ]
    },

    /* ------------------------------------------------------------ V */
    {
      n: 5, title: "The Death of Patroclus", book: "XVI", mode: "day", place: "plain", smoke: true,
      greek: "Πατρόκλεια", gloss: "The Story of Patroclus", light: "ash", dek: "A friend goes to war in borrowed armor.",
      build(c) {
        const A = c.A, r = {};
        A.sky(c.bg, "day");
        A.sun(c.bg, 1200, 160, 40);
        A.sea(c.bg, 470, 140);
        r.shipBurn = A.ship(c.bg, 360, 572, 0.85, 1);
        A.fire(r.shipBurn, 0, -40, 1.6, "ship-fire");
        A.ship(c.bg, 60, 560, 0.6, 1);
        A.ground(c.bg, 600, "ground");
        r.troy = A.walls(c.bg, 1320, 640, 500, 160, { towers: [1420] });
        r.troy.classList.add("distant");
        A.tent(c.mid, 540, GY, 1.4);
        r.armor = A.g({ class: "armor-stand toy" }, c.act);
        A.path("M940 760 L940 600 M910 640 L970 640", { class: "shaft" }, r.armor);
        helmetProp(A, r.armor).setAttribute("transform", "translate(942 604)");
        A.el("circle", { cx: 980, cy: 680, r: 36, class: "fill" }, r.armor);
        A.el("circle", { cx: 980, cy: 680, r: 30, class: "inc-ring" }, r.armor);
        r.trojans = army(A, c.mid, 110, GY, 4, Object.assign({}, ILIAD.extras.trojan, { item: "torch" }), 1, 0.7, 70);
        r.achilles = c.fig("achilles", 710, GY, { facing: 1, pose: "stand" });
        r.patroclus = c.fig("patroclus", 840, GY, { facing: -1, pose: "mourn" });
        r.patroclus2 = c.fig("achilles", 840, GY, { facing: 1, pose: "stand", cls: "gone", char: "patroclus", label: "Patroclus in Achilles’ armor" });
        r.apollo = c.fig("apollo", 1160, GY, { facing: 1, pose: "attack", cls: "fadeable gone" });
        r.euphorbos = c.extra("euphorbos", 1120, GY, { facing: 1, pose: "thrust", cls: "fadeable gone" });
        r.hector = c.fig("hector", 1500, GY, { facing: -1, pose: "stand", cls: "fadeable gone" });
        r.helmetRoll = helmetProp(A, c.act, "gone rolled");
        r.helmetRoll.style.transform = "translate(1240px, 754px) rotate(70deg)";
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [520, 560, 1.15],
          say: "Without Achilles, the Achaean champions fall wounded one by one. The Trojans storm the wall, and [[Hector]] sets fire to the first of the ships.",
          act(r, c) { c.sfx("fire"); } },
        { cam: [770, 560, 1.4],
          say: "[[Patroclus]] comes to Achilles in tears and speaks to him more harshly than anyone has dared.",
          quote: ["You know no pity; horseman Peleus was not your father nor Thetis your mother, but the gray sea bore you and the sheer cliffs begot you…", "16.33–35"],
          act(r) { r.patroclus.pose("plead"); } },
        { cam: [860, 600, 1.45],
          say: "If Achilles will not fight, says Patroclus, let him wear his armor. The Trojans will think Achilles has returned. Achilles agrees, but warns him to come back once the ships are saved.",
          tap: { at: [950, 650, 70], label: "Touch the armor to arm Patroclus" },
          act() {} },
        { cam: [700, 560, 1.05],
          say: "Patroclus leads the {{myrmidons|Myrmidons}} out in Achilles’ shining armor. The Trojans see the armor, take him for Achilles, and flee from the ships.",
          act(r, c) { r.armor.classList.add("gone"); r.patroclus.show(false); r.patroclus2.show().pose("attack").move(620); r.trojans._figs.forEach((f, i) => f.face(-1).pose(i % 2 ? "run" : "run2").move(f.x + 900 + i * 40)); c.sfx("clang"); } },
        { cam: [1220, 600, 1.3],
          say: "Forgetting the warning, he chases them to the walls of Troy. There [[Apollo]] strikes him from behind and knocks the helmet from his head.",
          act(r, c) { r.trojans._figs.forEach((f) => f.show(false)); r.achilles.show(false); r.patroclus2.move(1260).pose("stride"); r.apollo.show(); c.later(800, () => { r.patroclus2.helmet(false); r.helmetRoll.classList.remove("gone"); r.patroclus2.pose("crouch"); c.sfx("clang"); }); } },
        { tableau: true, wash: true, cam: [1260, 600, 1.3],
          say: "The young Trojan {{euphorbos|Euphorbos}} wounds him, and Hector deals the final blow. Dying, Patroclus warns Hector that his own death is near, at the hands of Achilles.",
          quote: ["You too shall live but for a little season; death and the day of your doom are close upon you…", "16.852–853"],
          act(r, c) { r.apollo.show(false); r.euphorbos.show().move(1150); r.hector.show().pose("thrust").move(1340); c.later(700, () => { r.patroclus2.pose("fall").move(1270); r.euphorbos.show(false); }); } }
      ]
    },

    /* ------------------------------------------------------------ VI */
    {
      n: 6, title: "The Grief and the Shield", book: "XVIII", mode: "day", place: "myrmidons",
      greek: "Ὁπλοποιία", gloss: "The Making of the Arms", light: "dusk", dek: "Achilles mourns, and a god forges him a shield with the whole world on it.",
      build(c) {
        const A = c.A, r = {};
        r.shore = A.g({ class: "set" }, c.bg);
        A.sky(r.shore, "day");
        A.sun(r.shore, 300, 200, 40, "sun pale");
        A.sea(r.shore, 470, 160);
        A.ground(r.shore, 610, "ground");
        A.tent(r.shore, 300, GY, 1.6);
        r.forge = A.g({ class: "set forge gone" }, c.bg);
        A.el("rect", { x: -400, y: -200, width: 2400, height: 1300, class: "forge-wall" }, r.forge);
        A.fire(r.forge, 1240, GY - 20, 2.2, "furnace");
        for (let i = 0; i < 5; i++) A.column(r.forge, 120 + i * 300, GY, 560, 46);
        A.el("rect", { x: -400, y: GY, width: 2400, height: 400, class: "forge-floor" }, r.forge);
        r.anvil = A.anvil(r.forge, 820, GY);
        r.achilles = c.fig("achilles", 760, GY, { facing: 1, pose: "stand", cls: "no-shield" });
        r.antilochus = c.extra("antilochus", 1300, GY, { facing: -1, pose: "run" });
        r.dust = A.dust(c.fx, 800, 590);
        r.dust.classList.add("gone");
        r.thetis = c.fig("thetis", 1200, 680, { facing: -1, pose: "hail", cls: "fadeable gone rising" });
        r.nereids = A.g({ class: "fadeable gone rising" }, c.mid);
        [1330, 1440].forEach((x) => A.figure(r.nereids, ILIAD.extras.nereid, x, 680, { facing: -1, pose: "mourn", scale: 0.8 }));
        r.heph = c.extra("hephaestus", 680, GY, { facing: 1, pose: "attack", cls: "gone" });
        r.sparks = A.sparks(c.fx, 840, 690, 14);
        r.sparks.classList.add("gone");
        // the shield takes shape ring by ring as the smith strikes
        r.shield = A.g({ class: "forged", transform: "translate(860 400)" }, c.act);
        const RINGS = [
          ["cosmos", 44, "Earth, Sky, and Sea", "At the center: the earth, the heavens and the sea, the untiring sun and the full moon, and the stars, the Pleiades, the Hyades, Orion, and the Bear."],
          ["cities", 78, "Two Cities", "A city at peace with weddings, dancing, and a trial in the marketplace, and a city at war, besieged, with an ambush laid by a river."],
          ["fields", 108, "Field and Vineyard", "Ploughmen turning dark earth made of gold, reapers on a king’s estate, and young people carrying grapes while a boy plays the lyre."],
          ["herds", 136, "Herds and Lions", "Golden cattle hurrying to pasture by a river, two lions seizing a bull, and a valley full of white sheep."],
          ["dance", 162, "The Dancing Floor", "Young men and women dancing hand in hand on a floor like the one Daedalus built for Ariadne."],
          ["rim", 186, "Okeanos", "Around the rim runs the mighty river Okeanos, which circles the whole world."]
        ];
        r.rings = RINGS.slice().reverse().map(([id, rad, name, text]) => {
          const ring = A.el("circle", { r: rad, class: "ring ring-" + id, "data-ring": id, tabindex: "0", role: "button", "aria-label": name }, r.shield);
          ring._info = [name, text];
          return ring;
        });
        const art = A.g({ class: "shield-art" }, r.shield);
        A.el("circle", { cx: -12, cy: -4, r: 12, class: "sun-mark" }, art);
        A.path("M16 -14 a12 12 0 1 0 0 22 a9 9 0 1 1 0 -22z", { class: "moon-mark" }, art);
        for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; A.el("circle", { cx: Math.cos(a) * 174, cy: Math.sin(a) * 174, r: 3.2, class: "dancer" }, art); }
        for (let i = 0; i < 36; i++) A.path("M-7 0 q3.5 -5 7 0 q3.5 5 7 0", { class: "wave-mark", transform: `rotate(${i * 10}) translate(0 -196)` }, art);
        for (let i = 0; i < 12; i++) A.el("ellipse", { rx: 7, ry: 4, class: "dancer", transform: `rotate(${i * 30}) translate(0 -122)` }, art);
        r.shieldInfo = A.g({ class: "shield-caption gone" }, c.fx);
        r.shield.classList.add("gone");
        A.frieze(c.fg, 878);
        r.strikes = 0;
        return r;
      },
      beats: [
        { cam: [1000, 560, 1.2],
          say: "All day the armies fight over the body of Patroclus. Then {{antilochus|Antilochus}} runs weeping to Achilles with the news.",
          act(r) { r.antilochus.pose("run").move(1000); } },
        { cam: [800, 580, 1.4],
          say: "Achilles pours dust over his head and lies in the dirt, tearing his hair. His cry reaches his mother in the depths of the sea.",
          quote: ["A dark cloud of grief fell upon Achilles as he listened. He filled both hands with dust from off the ground, and poured it over his head…", "18.22–24"],
          act(r, c) { r.antilochus.pose("kneel"); r.achilles.pose("mourn"); r.dust.classList.remove("gone"); c.sfx("lament"); } },
        { cam: [1060, 560, 1.15],
          say: "[[Thetis]] rises with her sister Nereids. She warns him that his own death will follow soon after Hector’s. He does not waver.",
          quote: ["I will pursue Hektor who has slain him whom I loved so dearly, and will then abide my doom when it may please Zeus and the other gods to send it.", "18.114–116"],
          act(r) { r.dust.classList.add("gone"); r.antilochus.show(false); r.achilles.pose("raise"); r.thetis.show(); r.nereids.classList.remove("gone"); } },
        { cam: [840, 520, 1.15],
          say: "Hector now wears Achilles’ armor, so Thetis goes to the bronze house of {{hephaestus|Hephaestus}}, the smith of the gods. All night he works at his roaring forge.",
          tap: { at: [830, 690, 56], label: "Strike the anvil five times", fn: (r, c) => c.strike() },
          act(r) { r.shore.classList.add("gone"); r.forge.classList.remove("gone"); r.achilles.show(false); r.thetis.move(1100, GY).pose("plead"); r.nereids.classList.add("gone"); r.heph.show(); r.shield.classList.remove("gone"); r.shield.classList.add("unforged"); } },
        { tableau: true, cam: [860, 440, 1.05],
          say: "The shield is finished: five layers of bronze, tin, silver, and gold, with the whole world worked upon it. Touch each ring to see what Hephaestus made.",
          quote: ["He wrought the earth, the heavens, and the sea; the moon also at her full and the untiring sun, with all the signs that glorify the face of heaven…", "18.483–485"],
          act(r) { r.shield.classList.remove("unforged"); r.rings.forEach((x) => x.classList.add("lit")); r.heph.pose("stand"); } }
      ],
      toys(r, c) {
        // strike the anvil: sparks fly and the next ring of the shield appears
        c.onTap(r.anvil, () => { if (c.strike()) c.advance(); });
        c.strike = () => {
          r.heph.pose("attack");
          setTimeout(() => r.heph.pose("thrust", { item: 30 }), 10);
          setTimeout(() => r.heph.pose("attack"), 260);
          r.sparks.classList.remove("gone");
          r.sparks.classList.remove("burst");
          void r.sparks.getBBox();
          r.sparks.classList.add("burst");
          c.sfx("anvil");
          if (!r.shield.classList.contains("unforged")) return false;
          r.strikes = Math.min(6, r.strikes + 1);
          r.rings.slice().reverse().forEach((ring, i) => ring.classList.toggle("lit", i < r.strikes));
          return r.strikes >= 5;
        };
        r.rings.forEach((ring) => c.onTap(ring, () => {
          if (r.shield.classList.contains("unforged")) return;
          r.rings.forEach((x) => x.classList.toggle("active", x === ring));
          c.note(ring._info[0], ring._info[1]);
        }));
      }
    },

    /* ------------------------------------------------------------ VII */
    {
      n: 7, title: "The Death of Hector", book: "XXII", mode: "day", place: "scaean",
      greek: "Ἕκτορος ἀναίρεσις", gloss: "The Killing of Hector", light: "noon", dek: "Three times around the walls of Troy.",
      build(c) {
        const A = c.A, r = {};
        A.sky(c.bg, "day");
        A.sun(c.bg, 1460, 140, 46);
        r.olympus = A.g({ class: "fadeable gone" }, c.bg);
        A.clouds(r.olympus, 200, 2);
        A.ground(c.bg, 600, "ground");
        r.walls = A.walls(c.mid, 300, GY, 1000, 300, { towers: [420, 1180], gate: 800 });
        A.figtree(c.mid, 1460, GY, 1);
        r.priam = c.fig("priam", 700, 460, { facing: 1, scale: 0.7, pose: "plead" });
        A.el("rect", { x: 620, y: 430, width: 360, height: 30, class: "parapet" }, c.mid);
        r.hecuba = c.extra("mourner", 880, 460, { facing: -1, scale: 0.7, pose: "plead", label: "Hecuba" });
        r.hector = c.fig("hector", 800, GY, { facing: -1, pose: "guard" });
        r.achilles = c.fig("achilles", 1700, GY, { facing: -1, pose: "stride", cls: "blazing" });
        r.athena = c.fig("athena", 620, GY, { facing: 1, pose: "point", cls: "fadeable gone" });
        r.scales = A.scales(c.fx, 800, 300, 1.2);
        r.scales.classList.add("fadeable", "gone");
        [["Achilles", 90], ["Hector", -90]].forEach(([t, x]) => { const e = A.el("text", { x, y: -34, "text-anchor": "middle", class: "pan-label" }, r.scales); e.textContent = t; });
        r.lap = A.el("text", { x: 800, y: 260, "text-anchor": "middle", class: "lap-label gone" }, c.fx);
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [800, 560, 1.05],
          say: "The Trojans flee into the city before Achilles. Only [[Hector]] stays outside the {{scaean|Scaean Gates}}. From the walls, [[Priam]] and Hecuba beg him to come in.",
          act(r) { r.achilles.move(1400); } },
        { cam: [1000, 560, 1.2],
          say: "[[Achilles]] comes on, his armor blazing like fire or the rising sun. Hector’s courage breaks, and he runs.",
          tap: { at: [800, 640, 60], label: "Touch Hector to begin the chase" },
          act(r) { r.achilles.move(1120).pose("attack"); } },
        { cam: [800, 520, 0.95],
          say: "Three times they run around the city of Priam, past the lookout, past the wild fig tree, past the two springs where Trojan women once washed their clothes in time of peace.",
          quote: ["Good was the man that fled, but better far was he that followed after… they ran for the life of Hektor.", "22.158–161"],
          act(r) { r.hector.face(-1).pose("run"); r.achilles.face(-1).pose("run2"); },
          // scrolling drives the chase: three laps around the city
          scrub(r, c, p) {
            const wrap = (v) => -400 + (((v % 2400) + 2400) % 2400);
            const run = p * 7200;
            r.hector.move(wrap(1200 - run), GY, 1);
            r.achilles.move(wrap(1520 - run), GY, 1);
            const stride = Math.floor(p * 70) % 2;
            r.hector.pose(stride ? "run" : "run2");
            r.achilles.pose(stride ? "run2" : "run");
            const lap = Math.min(3, Math.floor(p * 3) + 1);
            r.lap.classList.toggle("gone", p >= 0.995);
            r.lap.textContent = ["", "First lap", "Second lap", "Third lap"][lap];
          } },
        { cam: [800, 400, 1.1],
          say: "On high, [[Zeus]] pities Hector. He lifts his golden scales and lays a fate of death in each pan.",
          tap: { at: [800, 240, 70], label: "Touch the golden scales" },
          act(r) { r.lap.classList.add("gone"); r.hector.move(800, GY).pose("guard"); r.achilles.move(1120, GY).pose("stride"); r.olympus.classList.remove("gone"); r.scales.classList.remove("gone"); } },
        { cam: [760, 560, 1.2],
          say: "Hector’s side sinks toward {{hades|Hades}}. [[Athena]] comes to him in the shape of his brother Deiphobus, and Hector turns to fight, only to find he stands alone.",
          act(r, c) { r.scales.classList.add("tipped-left"); c.sfx("thunder"); c.later(1200, () => { r.scales.classList.add("gone"); r.olympus.classList.add("gone"); r.athena.show(); }); } },
        { tableau: true, wash: true, cam: [920, 600, 1.35],
          say: "Achilles finds the one gap in the armor Hector stripped from Patroclus, at the throat, and drives his spear home.",
          quote: ["I know you what you are, and was sure that I should not move you, for your heart is hard as iron…", "22.356–357"],
          act(r, c) { r.athena.show(false); r.achilles.pose("thrust").move(960); c.sfx("clang"); c.later(600, () => r.hector.pose("fall").move(840)); } },
        { cam: [800, 480, 1.0],
          say: "Hector dies foretelling that Paris and [[Apollo]] will kill Achilles at these same gates. Achilles drags the body in the dust before the eyes of Troy, and the city wails.",
          act(r, c) { r.achilles.pose("raise"); r.priam.pose("mourn"); r.hecuba.pose("mourn"); c.sfx("lament"); } }
      ]
    },

    /* ------------------------------------------------------------ VIII */
    {
      n: 8, title: "The Ransom of Hector", book: "XXIV", mode: "night", place: "myrmidons",
      greek: "Ἕκτορος λύτρα", gloss: "The Ransom of Hector", light: "moon", dek: "A king kneels before the man who killed his son.",
      build(c) {
        const A = c.A, r = {};
        r.night = A.g({ class: "set" }, c.bg);
        A.sky(r.night, "night");
        A.moon(r.night, 1320, 150, 32);
        A.hills(r.night, 560, 50, "far");
        A.ground(r.night, 610, "ground");
        A.tent(r.night, 1320, GY, 2.2, "big lit");
        r.wagon = A.g({ class: "wagon-g" }, c.act);
        A.horse(r.wagon, 120, GY, 0.85, 1);
        A.wagon(r.wagon, -40, GY - 6, 1);
        r.wagon.style.transform = "translate(-300px, 0px)";
        r.hermes = c.extra("hermes", -100, GY, { facing: 1, pose: "stride" });
        r.priam = c.fig("priam", -260, GY, { facing: 1, pose: "stride" });
        r.achilles = c.fig("achilles", 1260, GY, { facing: -1, pose: "sit", cls: "no-shield" });
        r.urns = A.g({ class: "fadeable gone" }, c.act);
        r.urnGood = urn(A, r.urns, 900, GY, "toy good");
        r.urnBad = urn(A, r.urns, 1020, GY, "toy bad");
        r.troy = A.g({ class: "set gone" }, c.bg);
        A.sky(r.troy, "night");
        A.walls(r.troy, -100, GY - 40, 1800, 260, { towers: [200, 1400] });
        A.ground(r.troy, 700, "ground");
        A.pyre(r.troy, 800, GY, 1.3);
        A.fire(r.troy, 800, GY - 60, 1.6, "pyre-fire");
        r.mourners = A.g({ class: "gone" }, c.act);
        [[480, 1, "andromache"], [580, 1, "helen"], [1080, -1, null], [1180, -1, null]].forEach(([x, f, k]) => {
          if (k) c.fig(k, x, GY, { facing: f, pose: "mourn", parent: r.mourners });
          else A.figure(r.mourners, ILIAD.extras.mourner, x, GY, { facing: f, pose: "mourn" });
        });
        A.frieze(c.fg, 878);
        return r;
      },
      beats: [
        { cam: [500, 560, 1.0],
          say: "For twelve days Achilles drags Hector’s body, and for twelve days [[Apollo]] keeps it from harm. At last the gods send old [[Priam]] by night to the Achaean camp, with a wagon of treasure as {{ransom|ransom}}.",
          act(r, c) { c.sfx("hooves"); },
          // the night journey follows the reader's scroll
          scrub(r, c, p) {
            const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            r.wagon.style.transition = "none";
            r.wagon.style.transform = `translate(${-300 + 560 * e}px, 0px)`;
            r.hermes.move(-100 + 660 * e, GY, 1);
            r.priam.move(-260 + 680 * e, GY, 1);
            return [300 + 260 * e, 560, 1.0];
          } },
        { cam: [700, 560, 1.0],
          say: "{{hermes|Hermes}} guides him unseen past the sentries, right to the door of Achilles’ tent.",
          tap: { at: [1180, 640, 60], label: "Touch the tent to go in" },
          act(r) { r.wagon.style.transition = ""; r.wagon.style.transform = "translate(560px, 0px)"; r.hermes.move(920).pose("point"); r.priam.move(800); } },
        { cam: [1180, 600, 1.4],
          say: "Priam goes in unseen, clasps Achilles’ knees, and kisses the hands that killed so many of his sons.",
          quote: ["King Priam entered without their seeing him, and going right up to Achilles he clasped his knees and kissed the dread murderous hands that had slain so many of his sons.", "24.477–479"],
          act(r) { r.hermes.show(false); r.priam.move(1150).pose("supplicate"); r.achilles.pose("sit"); } },
        { cam: [1180, 600, 1.4],
          say: "“Think of your father, Achilles,” the king begs. “He is old like me.”",
          tap: { at: [1210, 620, 50], label: "Touch Achilles’ hand" },
          act() {} },
        { tableau: true, cam: [1180, 600, 1.4],
          say: "Achilles takes the old man’s hand. Together they weep, one for his son, the other for his father and for Patroclus.",
          quote: ["The two wept bitterly—Priam, as he lay at Achilles’ feet, weeping for Hektor, and Achilles now for his father and now for Patroklos, till the house was filled with their lamentation.", "24.509–512"],
          act(r, c) { r.priam.pose("kneel", { head: 20 }); r.achilles.pose("sit", { head: 24, lean: 10, far: [150, 125], near: [140, 130] }); c.sfx("lament"); } },
        { cam: [1020, 580, 1.2],
          say: "Achilles raises Priam up and tells him of the two urns on the floor of Zeus’s palace. Touch them: one holds good gifts and one holds evil, and no mortal gets only good.",
          quote: ["On the floor of Zeus’ palace there stand two urns, the one filled with evil gifts, and the other with good ones.", "24.527–528"],
          act(r) { r.priam.pose("stand"); r.achilles.pose("point"); r.urns.classList.remove("gone"); } },
        { cam: [800, 520, 1.0],
          say: "Priam carries his son home. For nine days Troy gathers wood, and on the tenth they lay Hector on the pyre. [[Andromache]] and [[Helen]] lead the lament.",
          quote: ["Thus, then, did they celebrate the funeral of Hektor tamer of horses.", "24.804"],
          end: true,
          act(r, c) { r.night.classList.add("gone"); r.troy.classList.remove("gone"); r.urns.classList.add("gone"); r.wagon.classList.add("gone"); r.priam.show(false); r.achilles.show(false); r.mourners.classList.remove("gone"); c.sfx("fire"); } }
      ],
      toys(r, c) {
        c.onTap(r.urnGood, () => c.note("The urn of good gifts", "Zeus mixes these with evil for most men, so they meet now with good fortune and now with bad."));
        c.onTap(r.urnBad, () => c.note("The urn of evil gifts", "A man given only these is driven over the earth, honored by neither gods nor men."));
      }
    }
  ];

  /* ================================================================ *
   * Before and after: the prologue and the epilogue
   * ================================================================ */
  // a wrapper that can be slid across the stage by scrolling
  function slider(A, p, x, y) {
    const w = A.g({ class: "slider" }, p);
    w.style.transform = `translate(${x}px, ${y}px)`;
    w._at = (nx, ny = y) => { w.style.transition = "none"; w.style.transform = `translate(${nx}px, ${ny}px)`; };
    return w;
  }
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

  ILIAD.prologue = {
    n: 0, key: "prologue", title: "The Apple of Discord", book: null, kicker: "Before the Iliad", mode: "day", light: "dawn",
    greek: "Πρόλογος", gloss: "Prologue", dek: "A golden apple, a shepherd prince and a stolen queen: how a thousand ships came to Troy.",
    later: true,
    build(c) {
      const A = c.A, r = {};
      A.sky(c.bg, "day");
      A.sun(c.bg, 1260, 210, 52);
      A.clouds(c.bg, 130, 3);
      A.mountain(c.bg, 330, 560, 820, 360, "far");
      A.sea(c.bg, 470, 140);
      r.troy = A.walls(c.bg, 1230, 600, 470, 170, { towers: [1320, 1620] });
      r.troy.classList.add("distant");
      A.ground(c.bg, 600, "ground");
      // the camp before Troy, nine years on
      r.camp = A.g({ class: "fadeable gone" }, c.mid);
      [[80, 566, 0.5], [300, 562, 0.5], [520, 566, 0.45]].forEach(([x, y, s]) => A.ship(r.camp, x, y, s, 1, { sail: false }));
      [[760, 0.8], [930, 0.7], [1090, 0.75]].forEach(([x, s]) => A.tent(r.camp, x, 640, s));
      r.army = army(A, r.camp, 860, GY, 5, ILIAD.extras.soldier, 1, 0.55, 52);
      // the ship of Paris and Helen
      r.ship = slider(A, c.mid, 60, 566);
      A.ship(r.ship, 0, 0, 0.62, 1, { sail: true });
      c.fig("paris", -24, -16, { parent: r.ship, scale: 0.3, pose: "point" });
      c.fig("helen", 26, -16, { parent: r.ship, scale: 0.3, facing: -1 });
      r.ship.classList.add("gone");
      // the fleet
      r.fleet = slider(A, c.mid, -1000, 0);
      A.fleet(r.fleet, 0, 500, 3, 8, 0.27);
      r.fleet.classList.add("gone");
      // the Judgment on Mount Ida
      r.rock = A.path("M260 760 Q262 712 316 706 Q368 704 378 760 Z", { class: "fill" }, c.mid);
      r.paris = c.fig("paris", 320, GY, { facing: 1, pose: "sit" });
      r.hera = c.fig("hera", 640, GY, { facing: -1, pose: "point" });
      r.athena = c.fig("athena", 790, GY, { facing: -1, pose: "stand" });
      r.aphrodite = c.fig("aphrodite", 940, GY, { facing: -1, pose: "hail" });
      r.agamemnon = c.fig("agamemnon", 470, GY, { facing: 1, pose: "point", cls: "fadeable gone" });
      r.menelaus = c.fig("menelaus", 330, GY, { facing: 1, pose: "stand", cls: "fadeable gone" });
      r.apple = A.g({ class: "apple-g" }, c.fx);
      A.apple(r.apple, 0, 0, 13);
      r.apple.style.transform = "translate(392px, 640px)";
      A.frieze(c.fg, 878);
      return r;
    },
    beats: [
      { cam: [620, 560, 1.25],
        say: "At a wedding of the gods, Strife throws down a golden apple marked “for the fairest.” [[Hera]], [[Athena]] and [[Aphrodite]] each claim it, and [[Zeus]] sends them to a shepherd on Mount Ida to judge: [[Paris]], a prince of Troy.",
        act(r) { r.paris.pose("sit"); } },
      { cam: [700, 560, 1.25],
        say: "Hera offers him power, Athena victory in war, Aphrodite the most beautiful woman in the world. Paris gives the apple to Aphrodite, and two goddesses never forgive Troy.",
        quote: ["…for they forgave not the wrong done them by Alexander in disdaining the goddesses who came to him when he was in his sheepyards, and preferring her who had offered him a wanton to his ruin.", "24.28–30"],
        act(r, c) { r.paris.pose("point"); r.apple.style.transform = "translate(946px, 520px)"; r.aphrodite.pose("raise"); r.hera.face(1).pose("stand"); r.athena.face(1).pose("stand"); c.sfx("chime"); } },
      { cam: [700, 520, 1.1],
        say: "The most beautiful woman in the world is [[Helen]], wife of King [[Menelaus]] of Sparta. Paris visits as a guest, and sails home to Troy with Helen and a ship full of treasure.",
        act(r) { r.apple.classList.add("gone"); [r.paris, r.hera, r.athena, r.aphrodite].forEach((f) => f.show(false)); r.rock.classList.add("gone"); r.ship.classList.remove("gone"); },
        scrub(r, c, p) {
          const x = 60 + 1120 * ease(p);
          r.ship._at(x, 566);
          return [Math.max(520, Math.min(1080, x + 80)), 500, 1.3];
        } },
      { cam: [800, 520, 1.0],
        say: "Menelaus and his brother [[Agamemnon]], king of Mycenae, call the Greek kings to war. In Book II the poet counts their fleet ship by ship: 1,186 ships from twenty-nine peoples.",
        act(r) { r.ship.classList.add("gone"); r.agamemnon.show(); r.menelaus.show(); r.fleet.classList.remove("gone"); },
        scrub(r, c, p) { r.fleet._at(-1000 + 1200 * ease(p), 0); } },
      { tableau: true, cam: [940, 540, 1.05],
        say: "The Achaeans beach their ships before Troy. Nine years later the city still stands. Here, in the tenth year of the war, the Iliad begins.",
        quote: ["Nine of Zeus years are gone; the timbers of our ships have rotted; their tackling is sound no longer.", "2.134–135"],
        act(r) { r.fleet.classList.add("gone"); r.menelaus.show(false); r.agamemnon.move(640).pose("point"); r.camp.classList.remove("gone"); } }
    ]
  };

  ILIAD.epilogue = {
    n: 9, key: "epilogue", title: "The Fall of Troy", book: null, kicker: "After the Iliad", mode: "night", light: "moon",
    greek: "Ἐπίλογος", gloss: "Epilogue", dek: "What the Iliad leaves untold: the death of Achilles, the wooden horse, and the long way home.",
    later: true,
    build(c) {
      const A = c.A, r = {};
      r.city = A.g({ class: "set" }, c.bg);
      A.sky(r.city, "night");
      A.moon(r.city, 1340, 140, 30);
      A.hills(r.city, 560, 50, "far");
      A.ground(r.city, 600, "ground");
      r.walls = A.walls(r.city, 160, GY, 1280, 300, { towers: [300, 1300], gate: 800 });
      r.parapet = A.el("rect", { x: 520, y: 430, width: 300, height: 30, class: "parapet" }, c.mid);
      r.fires = A.g({ class: "fadeable gone" }, c.mid);
      [[300, 380, 1.5], [560, 470, 1.1], [800, 470, 1.3], [1050, 470, 1.0], [1300, 380, 1.6], [180, 600, 0.8], [1460, 610, 0.9]].forEach(([x, y, s]) => A.fire(r.fires, x, y, s));
      r.paris = c.fig("paris", 640, 460, { facing: 1, scale: 0.7, pose: "attack" });
      r.apollo = c.fig("apollo", 520, 330, { facing: 1, scale: 0.75, pose: "point", cls: "fadeable gone sky-god" });
      r.achilles = c.fig("achilles", 1060, GY, { facing: -1, pose: "attack", cls: "blazing" });
      r.arrow = A.g({ class: "flying gone" }, c.fx);
      A.path("M-34 0 L30 0 M30 -4 L42 0 L30 4 Z M-34 0 l-8 -5 M-34 0 l-8 5", { class: "arrow-line" }, r.arrow);
      // the horse
      r.horse = slider(A, c.act, 1700, GY);
      A.woodHorse(r.horse, 0, 0, 1.1);
      r.pullers = A.g({}, r.horse);
      for (let i = 0; i < 3; i++) A.figure(r.pullers, ILIAD.extras.trojan, -200 - i * 64, 0, { facing: -1, pose: "plead", scale: 0.6 });
      r.horse.classList.add("gone");
      // the sea, for the voyage home
      r.sea = A.g({ class: "set gone" }, c.bg);
      A.sky(r.sea, "night");
      A.moon(r.sea, 300, 160, 26);
      A.sea(r.sea, 470, 430);
      r.ship = slider(A, c.act, -300, 640);
      A.ship(r.ship, 0, 0, 0.9, 1, { sail: true });
      c.fig("odysseus", 0, -24, { parent: r.ship, scale: 0.42, pose: "point" });
      r.ship.classList.add("gone");
      A.frieze(c.fg, 878);
      return r;
    },
    beats: [
      { wash: true, cam: [840, 540, 1.05],
        say: "Soon after Hector’s funeral, [[Achilles]] fights his way to the {{scaean|Scaean Gates}}. [[Paris]] shoots, and [[Apollo]] guides the arrow, just as Hector had foretold with his dying breath.",
        quote: ["…on the day when Paris and Phoebus Apollo, valiant though you be, shall slay you at the Scaean gates.", "22.359–360"],
        act(r, c) {
          r.apollo.show();
          const a = r.arrow;
          a.classList.remove("gone");
          a.style.transition = "none";
          a.style.transform = "translate(690px, 420px) rotate(40deg)";
          void a.getBoundingClientRect();
          a.style.transition = c.instant ? "none" : "transform .7s cubic-bezier(.3,.1,.6,1)";
          a.style.transform = "translate(1040px, 720px) rotate(40deg)";
          c.later(700, () => { r.achilles.cls("blazing", false).pose("fall").move(1080); c.sfx("clang"); });
          c.later(1400, () => { a.classList.add("gone"); r.apollo.show(false); });
        } },
      { light: "moon", cam: [1000, 540, 1.0],
        say: "The war drags on. At last [[Odysseus]] has a plan: the Achaeans build a great wooden horse, hide their best men inside, and pretend to sail for home. The Trojans haul the horse through their own gates.",
        act(r) { r.achilles.show(false); r.paris.show(false); r.arrow.classList.add("gone"); r.apollo.show(false); r.horse.classList.remove("gone"); r.walls.classList.add("open"); },
        scrub(r, c, p) { r.horse._at(1700 - 820 * ease(p), GY); } },
      { light: "fire", wash: true, cam: [800, 480, 1.0],
        say: "That night the men inside climb out and open the gates. Troy burns. [[Priam]] is killed, and the women of the city, [[Andromache]] among them, are carried off as captives. Only a few escape the flames.",
        act(r, c) { r.horse._at(880, GY); r.horse.classList.add("burnt"); r.fires.classList.remove("gone"); c.sfx("fire"); } },
      { light: "dawn", end: true, cam: [800, 560, 1.0],
        say: "Odysseus, whose trick won the war, sets out for home. Angry gods and the sea will keep him from it for ten more years. That is another poem: the {{odyssey|Odyssey}}.",
        act(r) { r.city.classList.add("gone"); r.fires.classList.add("gone"); r.horse.classList.add("gone"); r.parapet.classList.add("gone"); r.sea.classList.remove("gone"); r.ship.classList.remove("gone"); },
        scrub(r, c, p) { r.ship._at(-300 + 1500 * ease(p), 640); } }
    ]
  };

  ILIAD.chapters = [ILIAD.prologue].concat(ILIAD.scenes, [ILIAD.epilogue]);

  // the lyre and other small pleasures
  ILIAD.scenes[3].toys = (r, c) => { c.onTap(r.lyre, () => c.pluck()); };
  ILIAD.scenes[6].toys = (r, c) => {
    c.onTap(r.scales, () => { r.scales.classList.add("tipped-left"); });
  };
})();
