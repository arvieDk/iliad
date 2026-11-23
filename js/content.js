/* The Iliad: an interactive book
 * The pages of the book, in order.
 *
 * Markup inside page text:
 *   [[Hektor]]            a name that opens a character profile (see ILIAD.aliases)
 *   [[hector|the prince]] a profile link with custom text
 *   {{aegis|aegis}}       a glossary term (key|text shown)
 *
 * Excerpts are quoted from Samuel Butler's translation of the Iliad (1898),
 * revised by Timothy Power and Gregory Nagy, as published by the Perseus
 * Digital Library (CC BY-SA 4.0). Bracketed Greek glosses in that edition
 * are omitted here, and cuts are marked with an ellipsis.
 */

window.ILIAD = window.ILIAD || {};

ILIAD.source = {
  short: "tr. Samuel Butler, rev. Power & Nagy",
  full: "Homer, The Iliad, translated by Samuel Butler (London: Longmans, Green and Co., 1898), revised by Timothy Power and Gregory Nagy. Perseus Digital Library, Tufts University.",
  url: "https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0012/tlg001/tlg0012.tlg001.perseus-eng4.xml",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
};

/* The eight scrolls of this condensed telling */
ILIAD.chapters = [
  { n: 1, greek: "Α", title: "The Wrath of Achilles", book: "I",
    blurb: "A quarrel over a captive splits the Achaean host." },
  { n: 2, greek: "Β", title: "Helen upon the Wall", book: "III",
    blurb: "Paris and Menelaus fight for Helen while she watches from Troy." },
  { n: 3, greek: "Γ", title: "Hector and Andromache", book: "VI",
    blurb: "A last farewell at the Scaean Gates." },
  { n: 4, greek: "Δ", title: "The Embassy", book: "IX",
    blurb: "Gifts and pleading cannot move Achilles." },
  { n: 5, greek: "Ε", title: "The Death of Patroclus", book: "XVI",
    blurb: "A friend goes to war in borrowed armor." },
  { n: 6, greek: "Ϛ", title: "The Grief and the Shield", book: "XVIII",
    blurb: "Achilles mourns, and a god forges his armor." },
  { n: 7, greek: "Ζ", title: "The Death of Hector", book: "XXII",
    blurb: "Three times around the walls of Troy." },
  { n: 8, greek: "Η", title: "The Ransom of Hector", book: "XXIV",
    blurb: "A king kneels before his son's killer." }
];

ILIAD.pages = [
  /* ---------- front matter ---------- */
  { type: "cover" },
  { type: "endpaper", desktopOnly: true },
  { type: "title" },
  { type: "proem" },
  { type: "contents" },
  { type: "personae", side: "mortal" },
  { type: "personae", side: "olympian" },
  { type: "map" },
  { type: "prologue" },

  /* ---------- Scroll I: the wrath ---------- */
  { type: "opener", ch: 1, html: `
    <p class="dropcap">In the ninth year of the war, the {{achaeans|Achaeans}} lie camped beside their ships on the shore below Troy. Their king, [[Agamemnon]], has taken as his prize Chryseis, daughter of {{chryses|Chryses}}, a priest of [[Apollo]]. When the old priest comes with ransom to beg for her, Agamemnon drives him away with threats.</p>
    <p>Chryses prays, and Apollo answers. For nine days the god's arrows of plague rain down on the camp, and the funeral pyres burn day and night. On the tenth day [[Achilles]] calls the host to assembly, and the prophet Calchas reveals the cause.</p>` },
  { type: "text", ch: 1, html: `
    <p>Agamemnon agrees to give the girl back, but demands another prize in her place. When Achilles protests, the king's pride flares.</p>
    <blockquote class="ex"><p>[[Achilles]] scowled at him and answered, “You are steeped in insolence and lust of gain. With what heart can any of the {{achaeans|Achaeans}} do your bidding, either on foray or in open fighting? I came to make war here not because the Trojans are responsible for any wrong committed against me… We have followed you, Sir Insolence! for your pleasure, not ours—to gain satisfaction from the Trojans for your shameless self and for [[Menelaos]].”</p>
    <cite data-ref="1.148–160"></cite></blockquote>
    <p>Agamemnon answers that he will take Achilles’ own prize, {{briseis|Briseis}}, so that all may learn who is the greater king.</p>` },
  { type: "text", ch: 1, html: `
    <p>Achilles reaches for his sword. At that moment a goddess descends.</p>
    <blockquote class="ex"><p>While he was thus in two minds, and was drawing his mighty sword from its scabbard, [[Athena]] came down from heaven (for [[Hera]] had sent her in the love she bore to them both), and seized the son of Peleus by his yellow hair, visible to him alone, for of the others no man could see her. Achilles turned in amaze, and by the fire that flashed from her eyes at once knew that she was Athena.</p>
    <cite data-ref="1.193–200"></cite></blockquote>
    <p>Achilles obeys and sheathes his blade, but swears a great oath: the day will come when the Achaeans long for him and cannot find him. He hurls down the gold-studded scepter and withdraws to his tents with his {{myrmidons|Myrmidons}}.</p>` },
  { type: "text", ch: 1, html: `
    <p>[[Patroklos]] leads Briseis out to the heralds, and she goes unwillingly. Alone by the grey sea, Achilles weeps and calls to his mother, [[Thetis]]. She rises from the waves like a mist, and carries his prayer up to [[Zeus]]: let the Trojans win, until the Achaeans honor her son.</p>
    <blockquote class="ex"><p>“See, I nod my head that you believe me. This is the most solemn act that I can offer to any god…” As he spoke the son of Kronos bowed his dark brows, and the ambrosial locks swayed on his immortal head, till vast {{olympus|Olympus}} reeled.</p>
    <cite data-ref="1.525–530"></cite></blockquote>
    <p>So the will of Zeus is set in motion, and the war turns against the Achaeans.</p>` },

  /* ---------- Scroll II: Helen upon the wall ---------- */
  { type: "opener", ch: 2, html: `
    <p class="dropcap">The two armies advance across the plain. From the Trojan ranks steps [[Paris]], called Alexander, a panther skin on his shoulders, challenging the bravest Achaean to single combat. But when [[Menelaos]], the husband he wronged, leaps from his chariot, Paris shrinks back into the throng.</p>
    <p>[[Hektor]] rebukes his brother bitterly, and shamed, Paris agrees to fight Menelaus man to man. The winner will take [[Helen]] and her wealth, and the rest will swear a solemn peace. Both hosts lay down their arms and wait.</p>` },
  { type: "text", ch: 2, html: `
    <p>The goddess Iris finds Helen weaving a great purple web of the war fought for her sake, and calls her to the {{scaean|Scaean Gates}}, where the elders of Troy sit on the tower.</p>
    <blockquote class="ex"><p>“No wonder the Trojans and {{achaeans|Achaeans}} endure so much and so long, for the sake of a woman so marvelously and divinely lovely… Still, fair though she be, let them take her and go, or she will breed sorrow for us and for our children after us.” But [[Priam]] bade her draw nigh. “My child,” said he, “take your seat in front of me that you may see your former husband, your kinsmen and your friends. I lay no responsibility upon you, it is the gods, not you who are responsible.”</p>
    <cite data-ref="3.156–165"></cite></blockquote>
    <p>From the wall, Helen names the Achaean kings for Priam: Agamemnon, [[Odysseus]] of many wiles, and huge Ajax.</p>` },
  { type: "text", ch: 2, html: `
    <p>The oaths are sworn, and the duel begins. Paris’ spear glances off the shield of Menelaus; Menelaus’ spear tears through Paris’ armor, and his sword shatters on Paris’ helmet.</p>
    <blockquote class="ex"><p>With this he flew at [[Alexander]], caught him by the horsehair plume of his helmet, and began dragging him towards the Achaeans… and Menelaos would have dragged him off to his own great glory had not Zeus’ daughter [[Aphrodite]] been quick to mark and to break the strap of oxhide, so that the empty helmet came away in his hand.</p>
    <cite data-ref="3.369–375"></cite></blockquote>
    <p>Hidden in mist, Paris is carried to his perfumed chamber. Soon the truce is broken, and the war goes on.</p>` },

  /* ---------- Scroll III: Hector and Andromache ---------- */
  { type: "opener", ch: 3, html: `
    <p class="dropcap">The battle turns against Troy, and [[Hektor]] hurries back into the city to bid the women pray to [[Athena]]. Before he returns to the fighting he looks for his wife, and finds her at the {{scaean|Scaean Gates}}.</p>
    <p>[[Andromache]] comes running to meet him, with a nurse who carries their infant son, whom the people call {{astyanax|Astyanax}}, “lord of the city,” because his father alone defends {{ilion|Ilion}}. Hector smiles at the boy in silence. Andromache takes his hand and weeps.</p>` },
  { type: "text", ch: 3, html: `
    <blockquote class="ex"><p>“Dear husband,” said she, “your valor will bring you to destruction; think on your infant son, and on my hapless self who ere long shall be your widow… I have neither father nor mother now. [[Achilles]] slew my father when he sacked Thebe the goodly city of the Cilicians… Nay—Hektor—you who to me are father, mother, brother, and dear husband—have mercy upon me; stay here upon this wall; make not your child fatherless, and your wife a widow…”</p>
    <cite data-ref="6.407–432"></cite></blockquote>
    <p>Hector answers that he would be shamed before Troy if he shirked battle. He knows the city will one day fall, and what grieves him most is the thought of Andromache led away into slavery.</p>` },
  { type: "text", ch: 3, html: `
    <blockquote class="ex"><p>He stretched his arms towards his child, but the boy cried and nestled in his nurse’s bosom, scared at the sight of his father’s armor, and at the horse-hair plume that nodded fiercely from his helmet. His father and mother laughed to see him, but Hektor took the helmet from his head and laid it all gleaming upon the ground. Then he took his darling child, kissed him, and dandled him in his arms, praying over him the while to [[Zeus]] and to all the gods.</p>
    <cite data-ref="6.466–475"></cite></blockquote>
    <p>He gives the boy back to his mother, who smiles through her tears. Hector takes up his plumed helmet and goes. Andromache walks home, looking back again and again, and the women of the house mourn Hector while he still lives.</p>` },

  /* ---------- Scroll IV: the embassy ---------- */
  { type: "opener", ch: 4, html: `
    <p class="dropcap">As [[Zeus]] promised, the Trojans drive the Achaeans back to their ships. That night a thousand Trojan watchfires burn on the plain, and in the Achaean camp there is despair.</p>
    <p>Old {{nestor|Nestor}} counsels [[Agamemnon]] to make amends. The king relents and promises a vast ransom of honor: tripods and gold, horses, seven cities, his own daughter in marriage, and [[briseis|Briseis]] returned untouched. Three envoys carry the offer to the tents of [[Achilles]]: [[Odysseus]], great Ajax, and Phoenix, who raised Achilles as a boy. This is the {{embassy|embassy}}.</p>` },
  { type: "text", ch: 4, html: `
    <p>They find Achilles playing a silver-bridged lyre and singing of the deeds of heroes. He welcomes them warmly, but when Odysseus has spoken, his answer is iron.</p>
    <blockquote class="ex"><p>“Hateful to me like the gates of {{hades|Hades}} is the man who says one thing while he hides another thing in his mind; therefore I will say what I mean. I will be appeased neither by Agamemnon son of Atreus nor by any other of the {{danaans|Danaans}}, for I see that I have no thanks for all my fighting. He that fights fares no better than he that does not; coward and hero are held in equal honor, and death deals like measure to him who works and him who is idle.”</p>
    <cite data-ref="9.312–320"></cite></blockquote>` },
  { type: "text", ch: 4, html: `
    <p>No gift, he says, could buy back a life once lost. And then he reveals the secret of his fate.</p>
    <blockquote class="ex"><p>“My mother [[Thetis]] tells me that there are two ways in which I may meet my end. If I stay here and fight, I shall lose my safe homecoming but I will have a glory that is unwilting: whereas if I go home my glory will die, but it will be a long time before the outcome of death shall take me.”</p>
    <cite data-ref="9.410–416"></cite></blockquote>
    <p>This is the choice of Achilles: {{kleos|kleos}}, undying glory, or a long and quiet life. The envoys return with nothing, and the Achaeans steel themselves for the battle at dawn.</p>` },

  /* ---------- Scroll V: Patroclus ---------- */
  { type: "opener", ch: 5, html: `
    <p class="dropcap">The Achaean champions fall wounded one by one. The Trojans storm the wall, and [[Hektor]] sets fire to the first of the ships. [[Patroklos]] comes to Achilles in tears, like a spring that pours down a sheer rock face.</p>
    <p>Achilles teases him gently, like a child tugging at its mother’s dress. But Patroclus will not be put off, and speaks to his friend more harshly than anyone has dared.</p>` },
  { type: "text", ch: 5, html: `
    <blockquote class="ex"><p>“You know no pity; horseman Peleus was not your father nor [[Thetis]] your mother, but the gray sea bore you and the sheer cliffs begot you, so cruel and remorseless are you in your thinking… at least send me and the {{myrmidons|Myrmidons}} with me, if I may bring deliverance to the {{danaans|Danaans}}. Let me moreover wear your armor; the Trojans may thus mistake me for you and quit the field…”</p>
    <cite data-ref="16.33–42"></cite></blockquote>
    <p class="aside">He knew not what he was asking, nor that he was suing for his own destruction. <cite data-ref="16.46"></cite></p>
    <p>Achilles agrees, but warns him: drive the Trojans from the ships, and come back. Do not chase them to the walls of Troy.</p>` },
  { type: "text", ch: 5, html: `
    <p>Patroclus sweeps the Trojans from the ships and, forgetting the warning, pursues them to the walls. There [[Apollo]] strikes him from behind and beats the helmet from his head. The young Trojan {{euphorbos|Euphorbos}} spears him in the back, and Hector deals the final blow.</p>
    <blockquote class="ex"><p>“Fate and the son of Leto have overpowered me, and among mortal men Euphorbos; you are yourself third only in the killing of me. I say further, and lay my saying to your heart, you too shall live but for a little season; death and the day of your doom are close upon you, and they will lay you low by the hand of Achilles son of Aiakos.”</p>
    <cite data-ref="16.849–854"></cite></blockquote>` },

  /* ---------- Scroll VI: the grief and the shield ---------- */
  { type: "opener", ch: 6, html: `
    <p class="dropcap">Hector strips the immortal armor of Achilles from the body, and around the corpse of Patroclus the fighting rages all day. At last {{antilochus|Antilochus}}, son of Nestor, runs weeping to Achilles’ tent with the news.</p>
    <blockquote class="ex"><p>A dark cloud of grief fell upon Achilles as he listened. He filled both hands with dust from off the ground, and poured it over his head, disfiguring his comely face, and letting the refuse settle over his shirt so fair and new. He flung himself down all huge and hugely at full length, and tore his hair with his hands.</p>
    <cite data-ref="18.22–27"></cite></blockquote>` },
  { type: "text", ch: 6, html: `
    <p>His cry reaches [[Thetis]] in the depths of the sea, and she rises with her sister Nereids to comfort him. She warns him that his own death must follow soon after Hector’s. He does not waver.</p>
    <blockquote class="ex"><p>“Therefore, perish strife both from among gods and men, and anger, wherein even a righteous man will harden his heart—which rises up in the soul of a man like smoke, and the taste thereof is sweeter than drops of honey. Even so has Agamemnon angered me. And yet—so be it, for it is over… I will go; I will pursue Hektor who has slain him whom I loved so dearly, and will then abide my doom when it may please Zeus and the other gods to send it.”</p>
    <cite data-ref="18.107–116"></cite></blockquote>` },
  { type: "text", ch: 6, html: `
    <p>Achilles has no armor, for Hector wears it. So Thetis climbs to the bronze house of {{hephaestus|Hephaestus}}, the lame smith of the gods, and clasps his knees. All night his bellows roar as he pours bronze, tin, silver, and gold into the fire.</p>
    <blockquote class="ex"><p>First he shaped the shield so great and strong, adorning it all over and binding it round with a gleaming circuit in three layers; and the baldric was made of silver. He made the shield in five thicknesses, and with many a wonder did his cunning hand enrich it. He wrought the earth, the heavens, and the sea; the moon also at her full and the untiring sun, with all the signs that glorify the face of heaven…</p>
    <cite data-ref="18.478–485"></cite></blockquote>
    <p class="aside">Explore the shield of Achilles, ring by ring, on the next page.</p>` },
  { type: "shield", ch: 6 },

  /* ---------- Scroll VII: the death of Hector ---------- */
  { type: "opener", ch: 7, html: `
    <p class="dropcap">Achilles returns to battle in his new armor, and the Trojans flee before him like deer into the city. Only [[Hektor]] remains outside the {{scaean|Scaean Gates}}. His father and mother beg him from the walls to come in. He will not.</p>
    <p>Yet when Achilles comes on, blazing like fire or the rising sun, Hector’s courage breaks, and he runs. Past the lookout, past the wild fig tree, past the springs of the {{scamander|Scamander}} where the women of Troy once washed their clothes in time of peace.</p>` },
  { type: "text", ch: 7, html: `
    <blockquote class="ex"><p>Past these did they flee, the one in front and the other giving chase behind him: good was the man that fled, but better far was he that followed after, and swiftly indeed did they run, for the prize was no mere beast for sacrifice or bullock’s hide, as it might be for a common foot-race, but they ran for the life of Hektor… so did these two run full speed three times round the city of [[Priam]].</p>
    <cite data-ref="22.157–166"></cite></blockquote>
    <p>[[Zeus]] pities Hector and lifts his golden scales; Hector’s doom sinks toward {{hades|Hades}}. [[Athena]] appears to Hector in the shape of his brother Deiphobus, and Hector turns at last to fight, only to find himself alone.</p>` },
  { type: "text", ch: 7, html: `
    <p>Achilles finds the one gap in the armor Hector stripped from Patroclus, the throat, and drives his spear home. With his last breath Hector begs that his body be returned to his parents. Achilles refuses.</p>
    <blockquote class="ex"><p>Hektor with his dying breath then said, “I know you what you are, and was sure that I should not move you, for your heart is hard as iron; look to it that I bring not heaven’s anger upon you on the day when [[Paris]] and [[Phoebus Apollo]], valiant though you be, shall slay you at the Scaean gates.”</p>
    <cite data-ref="22.355–360"></cite></blockquote>
    <p>Achilles lashes the body to his chariot and drags it in the dust before the eyes of Troy.</p>` },

  /* ---------- Scroll VIII: the ransom ---------- */
  { type: "opener", ch: 8, html: `
    <p class="dropcap">For twelve days Achilles drags Hector’s body around the tomb of Patroclus, and for twelve days [[Apollo]] keeps it from harm. At last the gods will bear it no longer. [[Zeus]] sends [[Thetis]] to her son, and Iris to old [[Priam]].</p>
    <p>By night the king loads a wagon with treasure and sets out for the Achaean camp. {{hermes|Hermes}} guides him unseen past the sentries to the very door of the tent where Achilles sits.</p>
    <blockquote class="ex"><p>King Priam entered without their seeing him, and going right up to Achilles he clasped his knees and kissed the dread murderous hands that had slain so many of his sons.</p>
    <cite data-ref="24.477–479"></cite></blockquote>` },
  { type: "text", ch: 8, html: `
    <blockquote class="ex"><p>“Think of your father, O Achilles like unto the gods, who is such even as I am, on the sad threshold of old age… Fear, O Achilles, the wrath of heaven; think on your own father and have compassion upon me, who am the more pitiable, for I have steeled myself as no man yet has ever steeled himself before me, and have raised to my lips the hand of him who slew my son.”</p>
    <cite data-ref="24.486–506"></cite></blockquote>
    <blockquote class="ex"><p>The two wept bitterly—Priam, as he lay at Achilles’ feet, weeping for Hektor, and Achilles now for his father and now for Patroklos, till the house was filled with their lamentation.</p>
    <cite data-ref="24.509–512"></cite></blockquote>` },
  { type: "text", ch: 8, html: `
    <p>Achilles raises the old man by the hand. The gods, he tells him, live without care, but they spin sorrow into the lives of men.</p>
    <blockquote class="ex"><p>“On the floor of Zeus’ palace there stand two urns, the one filled with evil gifts, and the other with good ones. He for whom Zeus the lord of thunder mixes the gifts he sends, will meet now with good and now with evil fortune…”</p>
    <cite data-ref="24.527–530"></cite></blockquote>
    <p>He grants a truce of eleven days. Priam carries his son home, and Troy weeps. [[Andromache]], Hecuba, and [[Helen]] lead the laments, and on the tenth day the pyre is lit.</p>` },
  { type: "text", ch: 8, finale: true, html: `
    <blockquote class="ex"><p>His brothers and comrades with many a bitter tear gathered his white bones, wrapped them in soft robes of purple, and laid them in a golden urn, which they placed in a grave and covered over with large stones set close together… When they had heaped up the {{barrow|barrow}} they went back again into the city, and being well assembled they held high feast in the house of Priam their king.</p>
    <cite data-ref="24.793–803"></cite></blockquote>
    <p class="last-line">Thus, then, did they celebrate the funeral of Hektor tamer of horses.</p>
    <cite class="center" data-ref="24.804"></cite>` },

  /* ---------- back matter ---------- */
  { type: "afterword" },
  { type: "sources" },
  { type: "endpaper", desktopOnly: true },
  { type: "backcover" }
];
