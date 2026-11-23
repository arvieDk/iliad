/* The Iliad: an illustrated, interactive telling
 * Art kit. Everything is drawn in SVG in the manner of Greek vase painting:
 * black-figure (black figures on clay) for day scenes, red-figure (clay
 * figures on black) for night scenes. Colors come from CSS variables, so a
 * scene's mode switches the whole palette.
 */

window.ILIAD = window.ILIAD || {};

ILIAD.art = (function () {
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) {
      if (attrs[k] === undefined || attrs[k] === null) continue;
      if (k === "html") e.innerHTML = attrs[k];
      else if (k === "style" && typeof attrs[k] === "object") Object.assign(e.style, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  const g = (attrs, parent) => el("g", attrs, parent);
  const path = (d, attrs = {}, parent) => el("path", Object.assign({ d }, attrs), parent);

  /* A joint: a <g> whose transform is animated through CSS */
  function joint(parent, x, y, cls = "") {
    const j = g({ class: "j " + cls }, parent);
    j._x = x;
    j._y = y;
    j._r = 0;
    setJoint(j, 0);
    return j;
  }
  function setJoint(j, r, x = j._x, y = j._y) {
    j._r = r;
    j._x = x;
    j._y = y;
    j.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
  }

  /* ================================================================ *
   * Figures
   * ================================================================ */
  // limb outline: a tapered capsule hanging down from (0,0)
  function limb(len, w1, w2, extra = "") {
    const a = w1 / 2, b = w2 / 2;
    return `M${-a} 0 Q${-a - 1} ${len * 0.5} ${-b} ${len} Q0 ${len + b * 1.4} ${b} ${len} Q${a + 2} ${len * 0.45} ${a} 0 Q0 ${-a * 1.2} ${-a} 0 Z${extra}`;
  }

  const POSES = {
    stand:   { lean: 0, dy: 0, head: 0, far: [8, 10], near: [-6, 12], farLeg: [6, 0], nearLeg: [-6, 0] },
    stride:  { lean: 4, dy: 3, head: 0, far: [30, 20], near: [-20, 30], farLeg: [-22, 6], nearLeg: [28, -4] },
    attack:  { lean: 8, dy: 4, head: 0, far: [150, -40], near: [50, 50], farLeg: [-26, 8], nearLeg: [32, -6], item: -12 },
    thrust:  { lean: 12, dy: 5, head: 0, far: [80, 10], near: [40, 40], farLeg: [-30, 8], nearLeg: [34, -10], item: 0 },
    guard:   { lean: 2, dy: 2, head: 0, far: [40, 70], near: [40, 50], farLeg: [-16, 4], nearLeg: [18, -2], item: -60 },
    raise:   { lean: -4, dy: 0, head: -10, far: [160, 10], near: [-10, 20], farLeg: [6, 0], nearLeg: [-6, 0] },
    hail:    { lean: -2, dy: 0, head: -6, far: [130, 10], near: [100, 20], farLeg: [6, 0], nearLeg: [-6, 0] },
    plead:   { lean: 14, dy: 2, head: 6, far: [80, 10], near: [70, 20], farLeg: [-8, 0], nearLeg: [10, 0] },
    point:   { lean: 0, dy: 0, head: 0, far: [10, 10], near: [90, 0], farLeg: [6, 0], nearLeg: [-6, 0] },
    hold:    { lean: 0, dy: 0, head: 6, far: [60, 70], near: [50, 70], farLeg: [6, 0], nearLeg: [-6, 0] },
    mourn:   { lean: 20, dy: 4, head: 20, far: [150, 120], near: [140, 125], farLeg: [-6, 4], nearLeg: [8, 0] },
    kneel:   { lean: 6, dy: 46, head: 8, far: [70, 20], near: [60, 30], farLeg: [-8, -84], nearLeg: [84, -84], seated: 1 },
    supplicate: { lean: 22, dy: 46, head: -10, far: [96, -4], near: [80, 10], farLeg: [-8, -84], nearLeg: [84, -84], seated: 1 },
    sit:     { lean: -2, dy: 42, head: 0, far: [30, 50], near: [20, 60], farLeg: [86, -84], nearLeg: [80, -80], seated: 1 },
    sitlyre: { lean: -2, dy: 42, head: -6, far: [50, 60], near: [70, 70], farLeg: [86, -84], nearLeg: [80, -80], item: -70, seated: 1 },
    crouch:  { lean: 30, dy: 30, head: -14, far: [40, 40], near: [70, 30], farLeg: [60, -100], nearLeg: [40, -60], seated: 1 },
    run:     { lean: 16, dy: 6, head: -4, far: [-40, 60], near: [60, 70], farLeg: [-50, 40], nearLeg: [56, -20] },
    run2:    { lean: 16, dy: 6, head: -4, far: [50, 70], near: [-30, 60], farLeg: [50, -30], nearLeg: [-44, 40] },
    fall:    { lean: 0, dy: 0, head: -20, far: [140, 10], near: [100, 20], farLeg: [10, 10], nearLeg: [-14, 6], rot: -86 },
    throwback: { lean: -8, dy: 2, head: -6, far: [170, 30], near: [60, 40], farLeg: [-24, 6], nearLeg: [26, -4], item: -20 },
    wing:    { lean: 0, dy: 0, head: 0, far: [110, 30], near: [100, 40], farLeg: [6, 0], nearLeg: [-6, 0] }
  };

  /*
   * spec: {
   *   kind: "warrior" | "robed" | "woman" | "child",
   *   helmet, crest (bool), beard, hair ("short"|"long"|"bun"),
   *   shield: emblem name | false, item: "spear"|"sword"|"scepter"|"bow"|"staff"|"thunder"|"lyre"|"caduceus"|"spindle",
   *   wreath, petasos, aegis, halo, skin: "white" (women), cap
   * }
   */
  function figure(parent, spec, x = 0, y = 0, opts = {}) {
    const id = "f" + uid++;
    const root = g({ class: "fig " + (spec.cls || ""), "data-fig": spec.name || "" }, parent);
    if (spec.char) {
      root.setAttribute("data-char", spec.char);
      root.setAttribute("tabindex", "0");
      root.setAttribute("role", "button");
      root.setAttribute("aria-label", spec.label || spec.char);
    }
    // a generous, invisible target so a figure is easy to touch
    if (spec.char || spec.hit) el("rect", { x: -34, y: -236, width: 68, height: 242, rx: 20, class: "hit" }, root);
    const s = opts.scale || 1;
    const facing = opts.facing || 1;
    const skinCls = spec.skin === "white" ? "skin-w" : "skin";

    // aura for gods, drawn behind everything
    if (spec.halo) el("circle", { cx: 0, cy: -150, r: 95, class: "aura", fill: `url(#aura)` }, root);

    const body = joint(root, 0, -95, "body");
    // far leg and far arm sit behind the torso
    const farLeg = joint(body, -2, 0, "leg");
    const farArm = joint(body, 0, -60, "arm");
    const torso = g({ class: "torso" }, body);
    const nearLeg = joint(body, 2, 0, "leg");
    const neck = joint(body, 2, -66, "neck");
    const nearArm = joint(body, 2, -60, "arm");

    function buildLeg(L, near) {
      path(limb(50, 17, 12), { class: "limb fill" }, L);
      const knee = joint(L, 0, 48);
      path(limb(48, 12, 7), { class: "limb fill" }, knee);
      path("M-4 44 L16 46 Q18 51 12 52 L-5 52 Z", { class: "fill" }, knee); // foot
      if (spec.kind === "warrior") path("M-6 6 Q0 4 7 6 M-6 30 Q0 27 6 30", { class: "inc" }, knee); // greaves
      L._knee = knee;
    }
    buildLeg(farLeg, false);
    buildLeg(nearLeg, true);

    function buildArm(A, near) {
      const cls = spec.kind === "woman" || spec.skin === "white" ? "skin-w" : "fill";
      path(limb(36, 11, 9), { class: "limb " + cls }, A);
      const elbow = joint(A, 0, 34);
      path(limb(34, 9, 7), { class: "limb " + cls }, elbow);
      el("circle", { cx: 0, cy: 36, r: 5, class: cls }, elbow);
      const hand = joint(elbow, 0, 36, "hand");
      A._elbow = elbow;
      A._hand = hand;
    }
    buildArm(farArm, false);
    buildArm(nearArm, true);

    // torso and clothing
    const k = spec.kind;
    if (k === "warrior") {
      // short chiton skirt, then a bronze cuirass
      path("M-15 -8 L-21 22 Q0 28 23 22 L16 -8 Z", { class: "fill" }, torso);
      path("M-17 14 L-15 22 M-9 15 L-8 25 M-1 16 L-1 26 M7 15 L8 25 M14 14 L17 22", { class: "inc" }, torso);
      path("M-14 2 L-17 -60 Q-6 -70 6 -68 Q20 -64 20 -48 Q22 -30 15 -14 L14 2 Z", { class: "fill" }, torso);
      path("M-12 -4 Q0 0 13 -4 M-11 -18 Q2 -14 15 -18 M4 -60 Q14 -54 14 -42", { class: "inc" }, torso);
    } else if (k === "woman" || k === "robed") {
      // a long chiton to the ankles with a patterned hem; covers the legs
      const robe = g({ class: "robe" }, torso);
      path("M-16 -64 Q-2 -70 14 -64 Q22 -40 18 -10 Q30 40 34 92 L-30 92 Q-26 40 -18 -10 Q-22 -40 -16 -64 Z", { class: "fill" }, robe);
      path("M-28 80 L32 80 M-27 86 L33 86", { class: "inc" }, robe);
      path("M-20 0 Q-16 46 -14 78 M-6 0 Q-4 40 -2 78 M8 0 Q10 40 14 78", { class: "inc faint" }, robe);
      if (k === "woman") path("M-20 -10 Q0 -2 20 -10", { class: "inc" }, robe);
      if (spec.himation) path("M-17 -60 Q10 -40 20 -6 Q0 10 -18 0 Z", { class: "fill" }, robe), path("M-14 -54 Q6 -36 16 -8", { class: "inc" }, robe);
      if (spec.aegis) {
        path("M-16 -62 Q2 -72 16 -62 L18 -30 Q0 -20 -18 -30 Z", { class: "aegis" }, robe);
        for (let i = 0; i < 6; i++) path(`M${-16 + i * 6.6} -30 q2 6 -1 9`, { class: "inc snake" }, robe);
        el("circle", { cx: 2, cy: -46, r: 5, class: "gorgon" }, robe);
      }
    } else if (k === "child") {
      path("M-10 -40 Q0 -46 10 -40 L12 0 L-12 0 Z", { class: "fill" }, torso);
    }

    // head
    function buildHead(N) {
      const H = g({ class: "head" }, N);
      const hc = spec.kind === "woman" || spec.skin === "white" ? "skin-w" : "fill";
      path("M-4 0 L6 0 L6 -10 L-4 -10 Z", { class: hc }, H); // neck
      // profile: back of skull, brow, nose, lips, chin
      path("M-12 -18 Q-14 -40 2 -42 Q14 -42 16 -30 L22 -22 L16 -20 Q18 -16 15 -14 Q16 -10 12 -8 Q6 -4 -2 -6 Q-12 -8 -12 -18 Z", { class: hc }, H);
      el("ellipse", { cx: 9, cy: -27, rx: 2.6, ry: 1.6, class: "eye" }, H);
      if (spec.beard) path("M-2 -8 Q2 -2 8 -4 Q14 -6 15 -12 Q18 -4 10 4 Q2 8 -4 2 Z", { class: "fill beard" }, H);
      if (spec.hair === "long") path("M-12 -26 Q-16 -42 2 -44 Q12 -44 14 -36 Q4 -38 -4 -34 Q-10 -20 -16 6 Q-22 -6 -12 -26 Z", { class: "fill hair" }, H);
      if (spec.hair === "bun") {
        path("M-12 -26 Q-14 -44 4 -44 Q14 -42 14 -36 Q2 -38 -6 -32 Q-10 -24 -12 -20 Z", { class: "fill hair" }, H);
        el("circle", { cx: -14, cy: -36, r: 7, class: "fill hair" }, H);
        path("M-8 -40 Q2 -44 12 -38", { class: "inc red" }, H);
      }
      if (spec.hair === "short" || (!spec.hair && !spec.helmet)) path("M-12 -24 Q-14 -44 4 -44 Q14 -42 15 -34 Q6 -36 0 -32 Q-6 -26 -10 -14 Z", { class: "fill hair" }, H);
      if (spec.wreath) for (let i = 0; i < 5; i++) el("ellipse", { cx: -8 + i * 5, cy: -42 + Math.abs(i - 2) * 1.5, rx: 3.4, ry: 1.6, class: "gold", transform: `rotate(${-30 + i * 15} ${-8 + i * 5} ${-42})` }, H);
      if (spec.crown) path("M-10 -40 L-8 -50 L-3 -43 L2 -52 L7 -43 L12 -50 L13 -39 Z", { class: "gold" }, H);
      if (spec.petasos) path("M-20 -38 Q2 -50 24 -38 Q2 -34 -20 -38 Z M-8 -40 Q2 -56 12 -40 Z", { class: "fill" }, H);
      if (spec.helmet) {
        const hel = g({ class: "helmet" }, H);
        path("M-14 -18 Q-17 -46 2 -47 Q18 -46 19 -30 L20 -20 L13 -20 L12 -24 Q8 -27 3 -24 L3 -14 L9 -10 L9 -2 Q-2 2 -10 -4 Q-14 -10 -14 -18 Z", { class: "fill" }, hel);
        el("ellipse", { cx: 9, cy: -28, rx: 3, ry: 1.7, class: "eye" }, hel);
        path("M-10 -32 Q2 -40 15 -32", { class: "inc" }, hel);
        if (spec.crest !== false) {
          path("M-24 -34 Q-18 -78 10 -72 Q26 -68 22 -50 Q14 -66 -2 -62 Q-16 -58 -24 -34 Z", { class: "crest" }, hel);
          path("M-18 -46 Q-10 -66 8 -66 M-14 -42 Q-6 -60 10 -60", { class: "inc" }, hel);
          path("M0 -46 L2 -58", { class: "inc" }, hel);
        }
        H._helmet = hel;
      }
      return H;
    }
    const head = buildHead(neck);

    // items held in the far hand (weapon hand)
    function item(kind, hand) {
      const it = joint(hand, 0, 0, "item");
      if (kind === "spear") {
        path("M-80 0 L120 0", { class: "shaft" }, it);
        path("M120 -4 L142 0 L120 4 Z M-80 -2 L-90 0 L-80 2 Z", { class: "fill" }, it);
      } else if (kind === "sword") {
        path("M-6 0 L6 0 M0 0 L52 0", { class: "blade" }, it);
        path("M-10 -5 L-10 5 L-2 5 L-2 -5 Z", { class: "fill" }, it);
        path("M2 -3 L46 -3 L56 0 L46 3 L2 3 Z", { class: "fill" }, it);
      } else if (kind === "scepter") {
        path("M-30 0 L110 0", { class: "shaft gold-stroke" }, it);
        el("circle", { cx: 112, cy: 0, r: 6, class: "gold" }, it);
      } else if (kind === "staff") {
        path("M-40 0 L110 0", { class: "shaft" }, it);
        path("M104 -8 Q114 -12 116 0 Q114 12 104 8", { class: "fill" }, it);
      } else if (kind === "bow") {
        path("M0 -60 Q30 0 0 60", { class: "bowline" }, it);
        path("M0 -60 L0 60", { class: "string" }, it);
      } else if (kind === "thunder") {
        path("M-6 -40 L10 -12 L0 -12 L14 16 L2 16 L16 46 L-12 8 L0 8 L-14 -18 L-2 -18 Z", { class: "gold" }, it);
      } else if (kind === "lyre") {
        path("M-16 -8 Q-30 -44 -14 -60 M16 -8 Q30 -44 14 -60 M-18 -54 L18 -54", { class: "lyre-frame" }, it);
        el("ellipse", { cx: 0, cy: -2, rx: 18, ry: 10, class: "fill" }, it);
        for (let i = -2; i <= 2; i++) path(`M${i * 4} -4 L${i * 5} -54`, { class: "string" }, it);
      } else if (kind === "caduceus") {
        path("M-10 0 L90 0", { class: "shaft gold-stroke" }, it);
        path("M90 0 q8 -10 14 0 q-8 10 -14 0 M60 0 q6 -10 12 0 t12 0", { class: "lyre-frame" }, it);
      } else if (kind === "hammer") {
        path("M-6 0 L60 0", { class: "shaft" }, it);
        path("M54 -14 L72 -14 L72 14 L54 14 Z", { class: "fill" }, it);
      } else if (kind === "torch") {
        path("M-6 0 L50 0", { class: "shaft" }, it);
        const tf = g({ class: "torch-flame", transform: "translate(56 0) rotate(90)" }, it);
        path("M-8 0 Q-10 -18 0 -30 Q10 -18 8 0 Z", { class: "flame f1" }, tf);
      } else if (kind === "cup") {
        path("M-10 -6 L12 -6 Q10 6 0 8 Q-8 6 -10 -6 Z", { class: "gold" }, it);
      }
      return it;
    }
    if (spec.item) farArm._item = item(spec.item, farArm._hand);
    if (spec.item2) nearArm._item = item(spec.item2, nearArm._hand);

    // shield on the near arm
    if (spec.shield) {
      const sh = joint(nearArm._hand, 0, 0, "shield");
      el("circle", { cx: 0, cy: 0, r: 40, class: "fill" }, sh);
      el("circle", { cx: 0, cy: 0, r: 34, class: "inc-ring" }, sh);
      emblem(sh, spec.shield);
      nearArm._shield = sh;
    }

    const parts = { root, body, farLeg, nearLeg, farArm, nearArm, neck, head, torso };
    const api = {
      el: root,
      parts,
      spec,
      x, y, s, facing,
      rot: 0,
      pose(name, extra = {}) {
        const p = Object.assign({}, POSES[name] || POSES.stand, extra);
        api.current = name;
        setJoint(body, p.lean, 0, -95 + (p.dy || 0));
        setJoint(farLeg, -p.farLeg[0]);
        setJoint(farLeg._knee, -p.farLeg[1]);
        setJoint(nearLeg, -p.nearLeg[0]);
        setJoint(nearLeg._knee, -p.nearLeg[1]);
        setJoint(farArm, -p.far[0]);
        setJoint(farArm._elbow, -p.far[1]);
        setJoint(nearArm, -p.near[0]);
        setJoint(nearArm._elbow, -p.near[1]);
        setJoint(neck, p.head || 0);
        if (farArm._item) {
          const abs = p.item !== undefined ? p.item : (spec.itemAbs !== undefined ? spec.itemAbs : -84);
          setJoint(farArm._item, abs + p.far[0] + p.far[1] - (p.lean || 0));
        }
        if (nearArm._item) setJoint(nearArm._item, (p.item2 !== undefined ? p.item2 : -80) + p.near[0] + p.near[1] - (p.lean || 0));
        if (nearArm._shield) setJoint(nearArm._shield, 0);
        root.classList.toggle("seated", !!p.seated);
        api.rot = p.rot || 0;
        place();
        return api;
      },
      move(nx, ny = api.y, dur) {
        api.x = nx;
        api.y = ny;
        root.style.transitionDuration = dur ? dur + "ms" : "";
        place();
        return api;
      },
      face(f) { api.facing = f; place(); return api; },
      show(on = true) { root.classList.toggle("gone", !on); return api; },
      cls(c, on = true) { root.classList.toggle(c, on); return api; },
      helmet(on) { if (head._helmet) head._helmet.classList.toggle("gone", !on); return api; }
    };
    function place() {
      root.style.transform = `translate(${api.x}px, ${api.y}px) rotate(${api.rot}deg) scale(${api.s * api.facing}, ${api.s})`;
    }
    api.pose(opts.pose || "stand");
    return api;
  }

  function emblem(parent, kind) {
    const c = { class: "emblem" };
    if (kind === "lion") path("M-16 6 Q-14 -10 0 -12 Q10 -12 14 -4 L18 -6 L16 2 Q18 10 8 12 L-2 10 Q-10 16 -16 6 Z", c, parent);
    else if (kind === "gorgon") { el("circle", Object.assign({ cx: 0, cy: 0, r: 11 }, c), parent); path("M-8 -9 l-6 -6 M8 -9 l6 -6 M-11 0 l-8 0 M11 0 l8 0", { class: "emblem-line" }, parent); }
    else if (kind === "snake") path("M-18 10 Q-10 -14 0 0 T18 -10", { class: "emblem-line wide" }, parent);
    else if (kind === "boar") path("M-18 4 Q-14 -10 2 -10 Q14 -10 18 0 L22 2 L16 6 Q4 12 -12 10 Z", c, parent);
    else if (kind === "tripod") path("M-12 -8 L12 -8 L8 4 L-8 4 Z M-6 4 L-12 16 M6 4 L12 16 M0 4 L0 16", { class: "emblem-line" }, parent);
    else if (kind === "bull") path("M-16 0 Q-12 -10 0 -8 Q12 -10 16 0 Q12 10 0 8 Q-12 10 -16 0 Z M-14 -6 L-20 -14 M14 -6 L20 -14", c, parent);
    else if (kind === "owl") { el("circle", Object.assign({ cx: -5, cy: -4, r: 4 }, c), parent); el("circle", Object.assign({ cx: 5, cy: -4, r: 4 }, c), parent); path("M-10 -10 Q0 18 10 -10", { class: "emblem-line" }, parent); }
    else el("circle", Object.assign({ cx: 0, cy: 0, r: 8 }, c), parent);
  }

  /* ================================================================ *
   * Scenery
   * ================================================================ */
  function defs(svg) {
    const d = el("defs", {}, svg);
    d.innerHTML = `
      <radialGradient id="aura"><stop offset="0" stop-color="var(--aura)" stop-opacity=".75"/><stop offset="1" stop-color="var(--aura)" stop-opacity="0"/></radialGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#ffd37a" stop-opacity=".9"/><stop offset=".4" stop-color="#ff9a3c" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
      <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-top)"/><stop offset="1" stop-color="var(--sky-bot)"/></linearGradient>
      <pattern id="meanderPat" width="40" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 18 H6 V2 H18 V14 H10 V6 H14 V10 M20 18 H26 V2 H38 V14 H30 V6 H34 V10 M18 14 V18 H40" fill="none" stroke="var(--band-line)" stroke-width="2.4"/>
      </pattern>
      <pattern id="wavePat" width="60" height="30" patternUnits="userSpaceOnUse">
        <path d="M0 22 Q8 22 12 14 Q16 6 24 8 Q30 10 28 16 Q26 20 22 18 Q30 26 44 22 Q52 20 60 22" fill="none" stroke="var(--wave)" stroke-width="2.6"/>
      </pattern>
      <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" result="n"/>
        <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>`;
    return d;
  }

  function sky(p, mode, w = 1600, h = 900) {
    const s = g({ class: "sky" }, p);
    el("rect", { x: -400, y: -200, width: w + 800, height: h + 400, fill: "url(#skyDay)" }, s);
    if (mode === "night") {
      const st = g({ class: "stars" }, s);
      for (let i = 0; i < 90; i++) {
        const x = (i * 197) % (w + 400) - 200, y = (i * 113) % 420 - 40;
        el("circle", { cx: x, cy: y, r: (i % 3) * 0.6 + 0.8, class: "star", style: { animationDelay: (i % 7) * 0.6 + "s" } }, st);
      }
    }
    return s;
  }

  function sun(p, x, y, r = 46, cls = "sun") {
    const s = g({ class: cls }, p);
    el("circle", { cx: x, cy: y, r: r * 2.4, fill: "url(#aura)", opacity: 0.6 }, s);
    el("circle", { cx: x, cy: y, r, class: "disc" }, s);
    return s;
  }

  function moon(p, x, y, r = 30) {
    const s = g({ class: "moon" }, p);
    el("circle", { cx: x, cy: y, r: r * 2.6, fill: "url(#aura)", opacity: 0.35 }, s);
    path(`M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.72} ${r} 0 1 1 ${x} ${y - r} Z`, { class: "disc" }, s);
    return s;
  }

  function clouds(p, y = 120, n = 4) {
    const c = g({ class: "clouds" }, p);
    for (let i = 0; i < n; i++) {
      const cx = 120 + i * 420 + (i % 2) * 80, cy = y + (i % 3) * 36;
      const cl = g({ class: "cloud", style: { animationDelay: -i * 9 + "s", animationDuration: 70 + i * 12 + "s" } }, c);
      path(`M${cx - 90} ${cy} Q${cx - 80} ${cy - 30} ${cx - 40} ${cy - 24} Q${cx - 20} ${cy - 52} ${cx + 20} ${cy - 36} Q${cx + 60} ${cy - 46} ${cx + 80} ${cy - 16} Q${cx + 110} ${cy - 10} ${cx + 100} ${cy} Z`, { class: "cloud-shape" }, cl);
    }
    return c;
  }

  function hills(p, y, amp, cls, seed = 1, w = 1600) {
    let d = `M-400 ${y + 300} L-400 ${y}`;
    for (let x = -400; x <= w + 400; x += 160) {
      const yy = y - amp * (0.5 + 0.5 * Math.sin(x * 0.006 * seed + seed));
      d += ` Q${x + 80} ${yy - amp * 0.3} ${x + 160} ${yy}`;
    }
    d += ` L${w + 400} ${y + 300} Z`;
    return path(d, { class: cls }, p);
  }

  function mountain(p, x, y, w, h, cls = "far") {
    const m = g({ class: "mountain " + cls }, p);
    path(`M${x - w / 2} ${y} L${x - w * 0.12} ${y - h * 0.86} L${x} ${y - h} L${x + w * 0.16} ${y - h * 0.8} L${x + w / 2} ${y} Z`, {}, m);
    path(`M${x - w * 0.12} ${y - h * 0.86} L${x - w * 0.04} ${y - h * 0.7} L${x} ${y - h * 0.8} L${x + w * 0.08} ${y - h * 0.68} L${x + w * 0.16} ${y - h * 0.8}`, { class: "snow" }, m);
    return m;
  }

  function sea(p, y, h = 260, w = 1600) {
    const s = g({ class: "sea" }, p);
    el("rect", { x: -400, y, width: w + 800, height: h, class: "sea-body" }, s);
    for (let i = 0; i < 4; i++) {
      const band = g({ class: "waves", style: { animationDuration: 14 + i * 5 + "s", animationDirection: i % 2 ? "reverse" : "normal" } }, s);
      el("rect", { x: -460, y: y + 10 + i * (h / 4.4), width: w + 920, height: 30, fill: "url(#wavePat)", opacity: 0.5 + i * 0.12 }, band);
    }
    return s;
  }

  function ground(p, y, cls = "ground", w = 1600) {
    const gr = g({ class: "ground-g" }, p);
    path(`M-400 ${y + 6} Q${w * 0.25} ${y - 10} ${w * 0.5} ${y} T${w + 400} ${y} L${w + 400} ${y + 400} L-400 ${y + 400} Z`, { class: cls }, gr);
    return gr;
  }

  // a black galley with an eye on the bow
  function ship(p, x, y, s = 1, facing = 1, opts = {}) {
    const sh = g({ class: "ship", transform: `translate(${x} ${y}) scale(${s * facing} ${s})` }, p);
    path("M-170 -10 Q-176 -40 -150 -54 L-140 -40 Q-60 -26 90 -28 L150 -38 Q172 -40 186 -20 L160 -14 Q150 4 120 10 L-130 12 Q-160 8 -170 -10 Z", { class: "hull" }, sh);
    path("M-130 -14 L130 -14 M-126 -4 L126 -4", { class: "inc" }, sh);
    el("ellipse", { cx: 140, cy: -24, rx: 9, ry: 5, class: "ship-eye" }, sh);
    el("circle", { cx: 140, cy: -24, r: 2.4, class: "fill" }, sh);
    for (let i = 0; i < 9; i++) path(`M${-100 + i * 24} -6 L${-112 + i * 24} 26`, { class: "oar" }, sh);
    if (opts.mast !== false) {
      path("M10 -28 L10 -190 M-60 -176 L80 -176", { class: "mast" }, sh);
      if (opts.sail) path("M-56 -172 L76 -172 L70 -70 Q10 -60 -50 -70 Z", { class: "sail" }, sh);
      else path("M-58 -176 Q10 -160 78 -176 Q10 -168 -58 -176 Z", { class: "fill" }, sh);
    }
    return sh;
  }

  function tent(p, x, y, s = 1, cls = "") {
    const t = g({ class: "tent " + cls, transform: `translate(${x} ${y}) scale(${s})` }, p);
    path("M-90 0 L0 -120 L90 0 Z", { class: "tent-body" }, t);
    path("M0 -120 L-20 0 L20 0 Z", { class: "tent-door" }, t);
    path("M0 -120 L0 -136 M-90 0 L-104 4 M90 0 L104 4", { class: "mast" }, t);
    path("M-70 -24 L70 -24", { class: "inc" }, t);
    return t;
  }

  // the walls of Troy: towers, battlements, and an opening gate
  function walls(p, x, y, w, h = 230, opts = {}) {
    const wg = g({ class: "walls" }, p);
    const bw = w;
    // sloped masonry base and wall
    path(`M${x} ${y} L${x + 18} ${y - h} L${x + bw - 18} ${y - h} L${x + bw} ${y} Z`, { class: "wall" }, wg);
    // battlements
    let bat = "";
    for (let i = x + 20; i < x + bw - 30; i += 34) bat += `M${i} ${y - h} h20 v-18 h-20 Z `;
    path(bat, { class: "wall" }, wg);
    // masonry courses
    let lines = "";
    for (let r = 1; r < 7; r++) lines += `M${x + 6 + r * 2} ${y - r * (h / 7)} L${x + bw - 6 - r * 2} ${y - r * (h / 7)} `;
    path(lines, { class: "inc faint" }, wg);
    // towers
    (opts.towers || []).forEach((tx) => {
      path(`M${tx - 46} ${y} L${tx - 40} ${y - h - 70} L${tx + 40} ${y - h - 70} L${tx + 46} ${y} Z`, { class: "wall tower" }, wg);
      let tb = "";
      for (let i = tx - 40; i < tx + 36; i += 22) tb += `M${i} ${y - h - 70} h14 v-16 h-14 Z `;
      path(tb, { class: "wall tower" }, wg);
      path(`M${tx - 8} ${y - h - 20} v-26 q8 -10 16 0 v26 Z`, { class: "window" }, wg);
    });
    // the gate
    if (opts.gate) {
      const gx = opts.gate;
      path(`M${gx - 52} ${y} L${gx - 52} ${y - 120} Q${gx} ${y - 176} ${gx + 52} ${y - 120} L${gx + 52} ${y} Z`, { class: "gate-arch" }, wg);
      const doors = g({ class: "gate-doors" }, wg);
      path(`M${gx - 50} ${y} L${gx - 50} ${y - 118} Q${gx - 26} ${y - 150} ${gx} ${y - 154} L${gx} ${y} Z`, { class: "door door-l", style: { transformOrigin: `${gx - 50}px ${y}px` } }, doors);
      path(`M${gx + 50} ${y} L${gx + 50} ${y - 118} Q${gx + 26} ${y - 150} ${gx} ${y - 154} L${gx} ${y} Z`, { class: "door door-r", style: { transformOrigin: `${gx + 50}px ${y}px` } }, doors);
      path(`M${gx - 40} ${y - 40} h30 M${gx + 10} ${y - 40} h30 M${gx - 40} ${y - 90} h30 M${gx + 10} ${y - 90} h30`, { class: "inc" }, doors);
      wg._doors = doors;
    }
    return wg;
  }

  // flickering fire with a glow; returns the group
  function fire(p, x, y, s = 1, cls = "") {
    const f = g({ class: "fire " + cls, transform: `translate(${x} ${y}) scale(${s})` }, p);
    el("circle", { cx: 0, cy: -30, r: 90, fill: "url(#glow)", class: "fire-glow" }, f);
    const fl = g({ class: "flames" }, f);
    path("M-30 0 Q-36 -40 -10 -70 Q-14 -40 4 -36 Q0 -70 20 -96 Q22 -50 36 -40 Q40 -20 30 0 Z", { class: "flame f1" }, fl);
    path("M-18 0 Q-22 -26 -4 -46 Q0 -26 10 -24 Q10 -48 22 -60 Q26 -30 24 0 Z", { class: "flame f2" }, fl);
    path("M-8 0 Q-10 -16 0 -28 Q4 -14 10 -12 Q14 -6 10 0 Z", { class: "flame f3" }, fl);
    return f;
  }

  function pyre(p, x, y, s = 1) {
    const py = g({ class: "pyre", transform: `translate(${x} ${y}) scale(${s})` }, p);
    for (let i = 0; i < 5; i++) path(`M${-80 + i * 4} ${-i * 14} L${80 - i * 4} ${-i * 14} L${80 - i * 4} ${-i * 14 - 10} L${-80 + i * 4} ${-i * 14 - 10} Z`, { class: "fill" }, py);
    path("M-70 -5 L-70 -60 M70 -5 L70 -60", { class: "inc" }, py);
    return py;
  }

  function column(p, x, y, h = 220, w = 34) {
    const c = g({ class: "column" }, p);
    path(`M${x - w / 2} ${y} L${x - w / 2 + 3} ${y - h} L${x + w / 2 - 3} ${y - h} L${x + w / 2} ${y} Z`, { class: "stone" }, c);
    path(`M${x - w / 2 - 8} ${y - h} h${w + 16} v-12 h-${w + 16} Z M${x - w / 2 - 4} ${y} h${w + 8} v8 h-${w + 8} Z`, { class: "stone" }, c);
    path(`M${x - 6} ${y - 4} L${x - 5} ${y - h + 4} M${x + 6} ${y - 4} L${x + 5} ${y - h + 4}`, { class: "inc faint" }, c);
    return c;
  }

  function figtree(p, x, y, s = 1) {
    const t = g({ class: "tree", transform: `translate(${x} ${y}) scale(${s})` }, p);
    path("M-6 0 Q-10 -60 -30 -110 M-4 -50 Q10 -80 30 -100 M-8 -30 Q-30 -40 -48 -60", { class: "trunk" }, t);
    [[-30, -120, 34], [26, -112, 30], [-52, -72, 24], [0, -150, 28], [40, -140, 22]].forEach(([cx, cy, r]) => el("circle", { cx, cy, r, class: "leaves" }, t));
    return t;
  }

  function scales(p, x, y, s = 1) {
    const sc = g({ class: "scales", transform: `translate(${x} ${y}) scale(${s})` }, p);
    path("M0 0 L0 -120 M-8 -124 L8 -124", { class: "gold-stroke wide" }, sc);
    const beam = g({ class: "beam" }, sc);
    beam.style.transformOrigin = `0px -120px`;
    path("M-90 -120 L90 -120", { class: "gold-stroke wide" }, beam);
    const pans = [];
    [-90, 90].forEach((px, i) => {
      const pan = g({ class: "pan" }, beam);
      path(`M${px} -120 L${px - 26} -60 M${px} -120 L${px + 26} -60`, { class: "gold-stroke" }, pan);
      path(`M${px - 30} -60 Q${px} -40 ${px + 30} -60 Z`, { class: "gold" }, pan);
      pans.push(pan);
    });
    sc._beam = beam;
    sc._pans = pans;
    return sc;
  }

  // a stylized horse in profile, after vase painting
  function horse(p, x, y, s = 1, facing = 1) {
    const h = g({ class: "horse", transform: `translate(${x} ${y}) scale(${s * facing} ${s})` }, p);
    path("M-70 -70 Q-40 -86 20 -80 Q40 -100 52 -128 Q58 -140 70 -136 L84 -118 Q90 -110 82 -106 L66 -112 Q60 -92 50 -70 Q46 -50 40 -40 L44 0 L36 0 L32 -36 Q0 -40 -40 -40 L-44 0 L-52 0 L-54 -44 Q-72 -46 -76 -60 Q-96 -54 -100 -30 Q-94 -60 -70 -70 Z", { class: "fill" }, h);
    path("M50 -126 Q40 -110 30 -84 M58 -132 Q46 -112 36 -84", { class: "inc" }, h);
    path("M-30 -40 L-34 0 L-40 0 M24 -40 L28 0 L22 0", { class: "fill-stroke" }, h);
    return h;
  }

  function wagon(p, x, y, s = 1) {
    const w = g({ class: "wagon", transform: `translate(${x} ${y}) scale(${s})` }, p);
    path("M-80 -40 L80 -40 L72 -10 L-72 -10 Z", { class: "fill" }, w);
    [[-50, 0], [50, 0]].forEach(([cx]) => {
      el("circle", { cx, cy: -6, r: 22, class: "wheel" }, w);
      path(`M${cx - 22} -6 L${cx + 22} -6 M${cx} -28 L${cx} 16`, { class: "wheel-spoke" }, w);
    });
    // treasure
    path("M-60 -40 L-50 -62 L-30 -62 L-24 -40 Z M-10 -40 L0 -70 L10 -40 Z M20 -40 Q30 -60 50 -40 Z", { class: "gold" }, w);
    return w;
  }

  function anvil(p, x, y) {
    const a = g({ class: "anvil" }, p);
    path(`M${x - 50} ${y - 60} L${x + 60} ${y - 60} Q${x + 40} ${y - 44} ${x + 20} ${y - 42} L${x + 14} ${y - 14} L${x + 30} ${y} L${x - 30} ${y} L${x - 14} ${y - 14} L${x - 20} ${y - 42} Q${x - 46} ${y - 46} ${x - 50} ${y - 60} Z`, { class: "fill" }, a);
    return a;
  }

  function arrows(p, n = 14, cls = "") {
    const a = g({ class: "arrows " + cls }, p);
    for (let i = 0; i < n; i++) {
      const ar = g({ class: "arrow", style: { animationDelay: (i * 0.23) % 2.2 + "s", "--ax": (i * 97) % 1100 + 200 + "px" } }, a);
      path("M0 0 L-40 -40 M0 0 L-10 -2 M0 0 L-2 -10 M-34 -34 l-8 2 M-34 -34 l2 -8", { class: "arrow-line" }, ar);
    }
    return a;
  }

  function sparks(p, x, y, n = 10) {
    const s = g({ class: "sparks", transform: `translate(${x} ${y})` }, p);
    for (let i = 0; i < n; i++) el("circle", { r: 2.4, class: "spark", style: { "--sx": Math.cos(i * 2.3) * 70 + "px", "--sy": -40 - (i % 4) * 22 + "px", animationDelay: i * 0.05 + "s" } }, s);
    return s;
  }

  function dust(p, x, y, n = 12) {
    const s = g({ class: "dust", transform: `translate(${x} ${y})` }, p);
    for (let i = 0; i < n; i++) el("circle", { r: 4 + (i % 3) * 3, class: "dust-p", style: { "--sx": (i - n / 2) * 9 + "px", "--sy": -30 - (i % 5) * 10 + "px", animationDelay: i * 0.06 + "s" } }, s);
    return s;
  }

  function mist(p, x, y, r = 120) {
    const m = g({ class: "mist" }, p);
    for (let i = 0; i < 6; i++) el("circle", { cx: x + Math.cos(i) * r * 0.5, cy: y + Math.sin(i * 1.7) * r * 0.3, r: r * (0.5 + (i % 3) * 0.2), class: "mist-p", filter: "url(#blur18)" }, m);
    return m;
  }

  // a clickable halo marking something to try
  function hint(p, x, y, r = 46) {
    const h = g({ class: "hint", transform: `translate(${x} ${y})` }, p);
    el("circle", { r, class: "hint-ring" }, h);
    el("circle", { r: r * 0.6, class: "hint-ring r2" }, h);
    el("circle", { r: Math.max(6, r * 0.16), class: "hint-dot" }, h);
    return h;
  }

  // the decorated band that frames a scene, like the frieze of a vase
  function frieze(p, y, w = 1600, h = 22) {
    const f = g({ class: "frieze" }, p);
    el("rect", { x: -400, y, width: w + 800, height: h, class: "band" }, f);
    el("rect", { x: -400, y: y + 2, width: w + 800, height: h - 4, fill: "url(#meanderPat)" }, f);
    return f;
  }

  return {
    el, g, path, joint, setJoint, figure, POSES, emblem,
    defs, sky, sun, moon, clouds, hills, mountain, sea, ground, ship, tent, walls,
    fire, pyre, column, figtree, scales, horse, wagon, anvil, arrows, sparks, dust, mist, hint, frieze
  };
})();
