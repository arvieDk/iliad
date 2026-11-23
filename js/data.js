/* The Iliad: an interactive book
 * Reference data: the cast, the glossary, and places on the map.
 * Profiles and glossary entries are original summaries written for this site.
 */

window.ILIAD = window.ILIAD || {};

/* ------------------------------------------------------------------ *
 * Dramatis personae
 * side: "achaean" | "trojan" | "olympian"
 * moments: chapter numbers link to chapter openers in the book
 * ------------------------------------------------------------------ */
ILIAD.characters = {
  achilles: {
    name: "Achilles",
    greek: "Ἀχιλλεύς",
    initial: "Α",
    side: "achaean",
    epithet: "Swift-footed, best of the Achaeans",
    lineage: "Son of Peleus, king of Phthia, and the sea-nymph Thetis",
    home: "Phthia, leading the Myrmidons",
    bio: "The greatest warrior at Troy and the heart of the poem. Dishonored when Agamemnon seizes his prize Briseis, he withdraws from battle and prays that the Achaeans be made to feel his absence. His wrath is answered with the death of his dearest friend, Patroclus, and turns into a terrible grief that only an old man's plea can soften.",
    traits: ["Unmatched in battle", "Proud and quick to anger", "Fiercely loyal", "Chooses glory over a long life"],
    allies: ["patroclus", "thetis", "athena", "odysseus"],
    rivals: ["agamemnon", "hector", "apollo"],
    moments: [
      [1, "Quarrels with Agamemnon and withdraws from the war"],
      [4, "Refuses the embassy and the gifts of Agamemnon"],
      [6, "Mourns Patroclus and receives new armor from Hephaestus"],
      [7, "Slays Hector before the walls of Troy"],
      [8, "Weeps with Priam and returns Hector's body"]
    ],
    fate: "Fated to die young at Troy. After the poem ends he falls at the Scaean Gates to an arrow of Paris, guided by Apollo."
  },
  agamemnon: {
    name: "Agamemnon",
    greek: "Ἀγαμέμνων",
    initial: "Α",
    side: "achaean",
    epithet: "Son of Atreus, king of men",
    lineage: "Son of Atreus; elder brother of Menelaus",
    home: "Mycenae, rich in gold",
    bio: "High king of the Achaean host and commander of the expedition to Troy. Forced to return his captive Chryseis to appease Apollo, he takes Briseis from Achilles instead, setting the whole tragedy in motion. Powerful but insecure in his authority, he later offers lavish gifts to win Achilles back.",
    traits: ["Commander of the host", "Proud of his rank", "Rash in anger", "Capable fighter"],
    allies: ["menelaus", "odysseus", "hera"],
    rivals: ["achilles", "hector"],
    moments: [
      [1, "Seizes Briseis from Achilles"],
      [2, "Leads the oaths before the duel of Paris and Menelaus"],
      [4, "Sends an embassy with gifts to Achilles"]
    ],
    fate: "Returns home to Mycenae after the war, where he is murdered by his wife Clytemnestra."
  },
  menelaus: {
    name: "Menelaus",
    greek: "Μενέλαος",
    initial: "Μ",
    side: "achaean",
    epithet: "Of the loud battle cry",
    lineage: "Son of Atreus; younger brother of Agamemnon",
    home: "Lacedaemon (Sparta)",
    bio: "King of Sparta and husband of Helen, whose abduction by Paris is the cause of the war. He meets Paris in single combat to settle the war and very nearly wins, until Aphrodite snatches his rival away in a cloud of mist.",
    traits: ["Wronged husband", "Brave and direct", "A man of few words"],
    allies: ["agamemnon", "odysseus", "athena"],
    rivals: ["paris"],
    moments: [
      [2, "Fights Paris in single combat for Helen"]
    ],
    fate: "Recovers Helen at the fall of Troy and, after long wandering, brings her home to Sparta."
  },
  odysseus: {
    name: "Odysseus",
    greek: "Ὀδυσσεύς",
    initial: "Ο",
    side: "achaean",
    epithet: "Of many wiles, son of Laertes",
    lineage: "Son of Laertes",
    home: "Rugged Ithaca",
    bio: "The cleverest of the Achaeans, a master of speech and stratagem. Helen points him out to Priam from the walls of Troy. He leads the embassy that tries, with every art of persuasion, to bring Achilles back into the fighting.",
    traits: ["Cunning strategist", "Persuasive speaker", "Steady in crisis"],
    allies: ["athena", "agamemnon", "achilles"],
    rivals: ["hector"],
    moments: [
      [2, "Pointed out by Helen from the Trojan wall"],
      [4, "Speaks first in the embassy to Achilles"]
    ],
    fate: "Devises the wooden horse that takes Troy, then spends ten years returning home: the story of the Odyssey."
  },
  patroclus: {
    name: "Patroclus",
    greek: "Πάτροκλος",
    initial: "Π",
    side: "achaean",
    epithet: "Horseman, gentle and beloved",
    lineage: "Son of Menoetius",
    home: "Raised in Phthia alongside Achilles",
    bio: "Achilles' dearest companion since childhood. Moved to tears by the Achaeans' suffering, he begs to lead the Myrmidons into battle wearing Achilles' armor. He drives the Trojans from the ships but presses too far, and falls to Apollo, Euphorbus, and Hector.",
    traits: ["Compassionate", "Loyal friend", "Brave to the point of recklessness"],
    allies: ["achilles"],
    rivals: ["hector", "apollo"],
    moments: [
      [1, "Hands Briseis over to the heralds"],
      [5, "Goes to battle in Achilles' armor and is slain"]
    ],
    fate: "Killed by Hector. His death draws Achilles back into the war."
  },
  hector: {
    name: "Hector",
    greek: "Ἕκτωρ",
    initial: "Ε",
    side: "trojan",
    epithet: "Of the shining helm, tamer of horses",
    lineage: "Eldest son of Priam and Hecuba; husband of Andromache",
    home: "Ilion (Troy)",
    bio: "Prince of Troy and the city's chief defender. He fights not for glory alone but for his family and people, knowing in his heart that Troy may fall. He kills Patroclus and strips him of Achilles' armor, and in turn meets Achilles alone outside the walls.",
    traits: ["Protector of Troy", "Devoted husband and father", "Dutiful to the end"],
    allies: ["priam", "andromache", "apollo", "paris"],
    rivals: ["achilles", "patroclus"],
    moments: [
      [2, "Rebukes Paris and arranges the duel"],
      [3, "Bids farewell to Andromache and Astyanax"],
      [5, "Slays Patroclus"],
      [7, "Falls to Achilles before the Scaean Gates"],
      [8, "His body is ransomed and mourned by Troy"]
    ],
    fate: "Slain by Achilles; his funeral is the last scene of the Iliad."
  },
  priam: {
    name: "Priam",
    greek: "Πρίαμος",
    initial: "Π",
    side: "trojan",
    epithet: "King of Troy, son of Laomedon",
    lineage: "Son of Laomedon; father of Hector, Paris, and many more",
    home: "Ilion (Troy)",
    bio: "The aged king of Troy, father of fifty sons. Gentle with Helen, whom he does not blame for the war, he watches his sons fall one by one. In the poem's final book he goes alone by night to the Achaean camp to beg Achilles for the body of Hector.",
    traits: ["Dignified and kind", "Grieving father", "Courageous in old age"],
    allies: ["hector", "helen", "zeus"],
    rivals: ["achilles"],
    moments: [
      [2, "Asks Helen to name the Achaean chiefs"],
      [8, "Kisses the hands of Achilles and ransoms Hector"]
    ],
    fate: "Killed when Troy is sacked, at the altar of Zeus in his own palace."
  },
  paris: {
    name: "Paris",
    greek: "Πάρις",
    initial: "Π",
    side: "trojan",
    epithet: "Also called Alexander, fair to look upon",
    lineage: "Son of Priam and Hecuba; brother of Hector",
    home: "Ilion (Troy)",
    bio: "The Trojan prince whose abduction of Helen from Sparta began the war. Handsome and favored by Aphrodite, he is a fine archer but an uneven warrior. He challenges the Achaeans to single combat, loses to Menelaus, and is rescued by the goddess.",
    traits: ["Charming", "Archer", "Careless of the cost of his choices"],
    allies: ["aphrodite", "helen", "hector"],
    rivals: ["menelaus"],
    moments: [
      [2, "Duels Menelaus and is spirited away by Aphrodite"]
    ],
    fate: "Kills Achilles with an arrow after the poem ends, and is himself later slain by Philoctetes."
  },
  helen: {
    name: "Helen",
    greek: "Ἑλένη",
    initial: "Ε",
    side: "trojan",
    epithet: "Daughter of aegis-bearing Zeus",
    lineage: "Daughter of Zeus and Leda; wife of Menelaus, then of Paris",
    home: "Taken from Lacedaemon to Troy",
    bio: "The most beautiful woman in the world, whose flight with Paris launched a thousand ships. In the Iliad she is full of regret, weaving the war's struggles into her tapestry and naming the Achaean heroes for Priam from the walls of Troy.",
    traits: ["Famed for beauty", "Regretful and self-reproaching", "Sharp-tongued"],
    allies: ["priam", "hector", "aphrodite"],
    rivals: ["paris"],
    moments: [
      [2, "Names the Achaean chiefs from the wall"],
      [8, "Mourns Hector, who was always kind to her"]
    ],
    fate: "Returns with Menelaus to Sparta after the fall of Troy."
  },
  andromache: {
    name: "Andromache",
    greek: "Ἀνδρομάχη",
    initial: "Α",
    side: "trojan",
    epithet: "Of the white arms",
    lineage: "Daughter of Eetion, king of Thebe; wife of Hector",
    home: "Born in Thebe under Mount Plakos",
    bio: "Hector's wife and the mother of the infant Astyanax. Achilles killed her father and seven brothers when he sacked her city, so Hector is her whole family. She begs him to fight from the wall rather than the open plain.",
    traits: ["Devoted wife and mother", "Clear-sighted about war", "Bereaved"],
    allies: ["hector", "priam"],
    rivals: ["achilles"],
    moments: [
      [3, "Pleads with Hector at the Scaean Gates"],
      [8, "Leads the lament over Hector's body"]
    ],
    fate: "Taken as a captive by the son of Achilles after Troy falls."
  },
  zeus: {
    name: "Zeus",
    greek: "Ζεύς",
    initial: "Ζ",
    side: "olympian",
    epithet: "Father of gods and men, cloud-gatherer",
    lineage: "Son of Kronos; brother and husband of Hera",
    home: "Mount Olympus and Mount Ida",
    bio: "King of the gods. At Thetis' plea he nods his assent to honor Achilles by letting the Trojans prevail for a time, and that nod shakes Olympus. He loves Hector and pities him, yet weighs the fates and lets them stand.",
    traits: ["Supreme power", "Keeper of the balance of fate", "Wielder of the thunderbolt"],
    allies: ["thetis"],
    rivals: ["hera"],
    moments: [
      [1, "Nods to Thetis and shakes Olympus"],
      [7, "Pities Hector but lets fate run its course"]
    ],
    fate: "Immortal."
  },
  hera: {
    name: "Hera",
    greek: "Ἥρα",
    initial: "Η",
    side: "olympian",
    epithet: "Queen of heaven, white-armed",
    lineage: "Daughter of Kronos; wife and sister of Zeus",
    home: "Mount Olympus",
    bio: "Queen of the gods and a relentless enemy of Troy, which she has hated since Paris judged Aphrodite fairest. She sends Athena to stop Achilles from killing Agamemnon and quarrels openly with Zeus over his favors to the Trojans.",
    traits: ["Proud", "Persistent", "Champion of the Achaeans"],
    allies: ["athena", "agamemnon", "achilles"],
    rivals: ["zeus", "aphrodite", "paris"],
    moments: [
      [1, "Sends Athena to restrain Achilles"]
    ],
    fate: "Immortal."
  },
  athena: {
    name: "Athena",
    greek: "Ἀθηνᾶ",
    initial: "Α",
    side: "olympian",
    epithet: "Grey-eyed daughter of aegis-bearing Zeus",
    lineage: "Daughter of Zeus, born from his head",
    home: "Mount Olympus",
    bio: "Goddess of wisdom and war, fierce partisan of the Achaeans. She seizes Achilles by his golden hair to keep him from drawing his sword on Agamemnon, and later deceives Hector into standing his ground against Achilles.",
    traits: ["Wise strategist", "Warrior goddess", "Protector of heroes"],
    allies: ["hera", "achilles", "odysseus", "menelaus"],
    rivals: ["aphrodite", "hector"],
    moments: [
      [1, "Stays the hand of Achilles"],
      [7, "Tricks Hector into facing Achilles"]
    ],
    fate: "Immortal."
  },
  apollo: {
    name: "Apollo",
    greek: "Ἀπόλλων",
    initial: "Α",
    side: "olympian",
    epithet: "Phoebus, the far-shooter, son of Zeus and Leto",
    lineage: "Son of Zeus and Leto; twin of Artemis",
    home: "Mount Olympus",
    bio: "God of archery, healing, and plague. Angered when Agamemnon dishonors his priest Chryses, he sends pestilence on the Achaean camp. He champions Troy, strikes the armor from Patroclus in battle, and protects Hector even after death.",
    traits: ["Archer god", "Bringer of plague", "Protector of Troy"],
    allies: ["hector", "paris"],
    rivals: ["achilles", "patroclus"],
    moments: [
      [1, "Sends a plague upon the Achaeans"],
      [5, "Strikes down Patroclus"],
      [8, "Shields Hector's body from harm"]
    ],
    fate: "Immortal. He will guide the arrow of Paris that kills Achilles."
  },
  aphrodite: {
    name: "Aphrodite",
    greek: "Ἀφροδίτη",
    initial: "Α",
    side: "olympian",
    epithet: "Golden, laughter-loving",
    lineage: "Daughter of Zeus and Dione",
    home: "Mount Olympus",
    bio: "Goddess of love and beauty. Paris awarded her the golden apple and she gave him Helen in return. She protects him on the battlefield, snapping his helmet strap and whisking him to safety, and compels Helen back to his chamber.",
    traits: ["Irresistible", "Protective of her favorites", "Not made for war"],
    allies: ["paris", "helen"],
    rivals: ["hera", "athena"],
    moments: [
      [2, "Rescues Paris from Menelaus"]
    ],
    fate: "Immortal."
  },
  thetis: {
    name: "Thetis",
    greek: "Θέτις",
    initial: "Θ",
    side: "olympian",
    epithet: "Silver-footed daughter of the Old Man of the Sea",
    lineage: "A Nereid, daughter of Nereus; wife of Peleus",
    home: "The depths of the sea",
    bio: "The sea-goddess mother of Achilles, who knows her son's short fate and grieves for it. She carries his prayer to Zeus and, after Patroclus dies, brings him new armor forged by Hephaestus, including the wondrous shield.",
    traits: ["Loving mother", "Knows the future", "Persuasive suppliant"],
    allies: ["achilles", "zeus"],
    rivals: [],
    moments: [
      [1, "Beseeches Zeus to honor her son"],
      [6, "Brings Achilles armor from Hephaestus"]
    ],
    fate: "Immortal. She mourns Achilles at his funeral."
  }
};

/* Names as they appear in the translation, mapped to profiles */
ILIAD.aliases = {
  "Achilles": "achilles",
  "Agamemnon": "agamemnon",
  "Menelaos": "menelaus", "Menelaus": "menelaus",
  "Odysseus": "odysseus",
  "Patroklos": "patroclus", "Patroclus": "patroclus",
  "Hektor": "hector", "Hector": "hector",
  "Priam": "priam",
  "Paris": "paris", "Alexander": "paris",
  "Helen": "helen",
  "Andromache": "andromache",
  "Zeus": "zeus",
  "Hera": "hera",
  "Athena": "athena",
  "Apollo": "apollo", "Phoebus Apollo": "apollo", "Phoebus": "apollo",
  "Aphrodite": "aphrodite",
  "Thetis": "thetis"
};

/* ------------------------------------------------------------------ *
 * Glossary (hover or tap the dotted words)
 * ------------------------------------------------------------------ */
ILIAD.glossary = {
  achaeans: ["Achaeans", "The Greeks besieging Troy. Homer also calls them Argives and Danaans."],
  argives: ["Argives", "Another name for the Achaeans, after Argos, one of their homelands."],
  danaans: ["Danaans", "Another name for the Achaeans, after the legendary king Danaus."],
  ilion: ["Ilion", "Troy, the city of Priam, built on a hill above the plain of the Scamander."],
  myrmidons: ["Myrmidons", "The warriors of Phthia whom Achilles leads to Troy."],
  aegis: ["Aegis", "The terrible goatskin shield or cape of Zeus, fringed with gold. Athena often bears it."],
  olympus: ["Olympus", "The mountain where the gods dwell in bronze-floored halls built by Hephaestus."],
  hades: ["Hades", "The god of the dead, and the shadowy house below the earth where souls go."],
  phthia: ["Phthia", "Achilles' homeland in Thessaly, ruled by his father Peleus."],
  scaean: ["Scaean Gates", "The great western gate of Troy, facing the plain and the Achaean camp."],
  atreus: ["Son of Atreus", "Agamemnon (or Menelaus). Atreus was king of Mycenae, father of both."],
  peleus: ["Son of Peleus", "Achilles. Peleus is the aged king of Phthia, husband of Thetis."],
  briseis: ["Briseis", "A captive woman awarded to Achilles as his prize of honor. Her seizure starts the quarrel."],
  chryses: ["Chryses", "A priest of Apollo whose daughter Chryseis was taken by Agamemnon."],
  menis: ["Mênis", "Wrath. The very first word of the poem in Greek, used of the anger of gods and of Achilles."],
  kleos: ["Kleos", "Glory: the undying fame won by deeds, carried on in song. Achilles trades long life for it."],
  moira: ["Moira", "Fate or one's allotted portion. Even the gods are reluctant to overturn it."],
  hephaestus: ["Hephaestus", "The lame smith of the gods, who forges Achilles' new armor and shield."],
  hermes: ["Hermes", "Messenger of the gods, who guides Priam unseen into the Achaean camp."],
  astyanax: ["Astyanax", "“Lord of the city”: the people's name for Hector's infant son."],
  scamander: ["Scamander", "The great river of the Trojan plain, also a god, called Xanthus by the gods."],
  barrow: ["Barrow", "A mound of earth heaped over the grave of the dead."],
  ransom: ["Ransom", "Treasure offered to free a captive or recover a body, as Priam does for Hector."],
  suppliant: ["Suppliant", "One who begs for mercy, clasping the knees of the person entreated."],
  lacedaemon: ["Lacedaemon", "The kingdom of Sparta, ruled by Menelaus."],
  ithaca: ["Ithaca", "A rocky island in the west, the home of Odysseus."],
  okeanos: ["Okeanos", "The great river believed to encircle the whole flat earth."],
  embassy: ["Embassy", "Odysseus, Ajax, and old Phoenix are sent to plead with Achilles in Book IX."],
  nestor: ["Nestor", "The aged king of Pylos, wisest counselor among the Achaeans."],
  euphorbos: ["Euphorbos", "A young Trojan spearman, the first mortal to wound Patroclus."],
  automedon: ["Automedon", "The charioteer of Achilles."],
  antilochus: ["Antilochus", "The son of Nestor, who brings Achilles the news of Patroclus' death."],
  greaves: ["Greaves", "Bronze shin guards worn by Homeric warriors."]
};

/* ------------------------------------------------------------------ *
 * The Troad: places on the map (x, y in the 600 x 720 map grid)
 * ------------------------------------------------------------------ */
ILIAD.places = [
  { id: "troy", x: 412, y: 440, name: "Ilion (Troy)", ch: 3,
    text: "The walled city of Priam on its windy height. Its towers look west over the plain toward the Achaean ships." },
  { id: "scaean", x: 372, y: 470, ly: 32, name: "Scaean Gates", ch: 7,
    text: "Troy's western gate. Here Helen names the Achaeans for Priam, Hector parts from Andromache, and Hector makes his last stand." },
  { id: "ships", x: 208, y: 188, name: "Achaean Ships", ch: 4,
    text: "The beached fleet and camp of the Achaeans, protected by a wall and trench, along the shore of the Hellespont." },
  { id: "myrmidons", x: 116, y: 236, ly: 32, name: "Tents of the Myrmidons", ch: 1,
    text: "Achilles' camp at the far end of the line, where he sits apart from the war, nursing his wrath." },
  { id: "plain", x: 290, y: 330, name: "Plain of Troy", ch: 2,
    text: "The open battlefield between city and sea, where the armies clash and Paris meets Menelaus." },
  { id: "scamander", x: 250, y: 420, name: "River Scamander", ch: 7,
    text: "The swirling river of the plain. Near its two springs, one warm and one cold, Achilles chases Hector around the walls." },
  { id: "simoeis", x: 470, y: 300, name: "River Simoeis", ch: 2,
    text: "The second river of the Troad, flowing from the east to join the Scamander on the plain." },
  { id: "ida", x: 508, y: 612, name: "Mount Ida", ch: 7,
    text: "The many-fountained mountain from whose peak Zeus watches the fighting." },
  { id: "tenedos", x: 52, y: 528, ly: 32, name: "Tenedos", ch: 1,
    text: "An island off the coast, sacred to Apollo, whom Chryses invokes as its lord." },
  { id: "hellespont", x: 360, y: 100, name: "The Hellespont", ch: 4,
    text: "The narrow strait between Europe and Asia. Achilles threatens to sail home across it to Phthia." }
];
