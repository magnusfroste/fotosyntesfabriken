/* Fotosyntesfabriken – fotosyntes och cellandning (biologi åk 4–6).
   Tränar Lgr22 BI.4-6.1.2: "Näringskedjor och kretslopp i närmiljön. Djurs, växters och
   svampars samspel med varandra och hur några miljöfaktorer påverkar dem. Fotosyntes och
   cellandning."

   Bladet är en fabrik: platser på vänstersidan tar in, platser på högersidan ger ut.
   Barnet trycker på en sak i brickan och sedan på en plats; modellen nedan avgör om
   reaktionen går ihop. Allt ritas i SVG i koden, ljudet skapas i WebAudio och målet
   läses upp med talsyntes. Del 1 är ren data och ren modell – verify.mjs kör den i node. */
(function () {
  "use strict";

  /* ================================================================ *
   * 1. DATA OCH MODELL – kontrolleras av verify.mjs                   *
   * ================================================================ */

  var VARLD = { b: 1000, h: 620 };
  var VARLD_P = { b: 500, h: 830 };

  /* Fast rutnät: tre in-platser till vänster, tre ut-platser till höger.
     Nivån bestämmer hur många som används. */
  var PLATSER = [];
  var ys = [90, 250, 410];
  for (var k = 0; k < 3; k++) {
    PLATSER.push({ id: "in" + (k + 1), typ: "in", x: 60, y: ys[k], w: 210, h: 130 });
    PLATSER.push({ id: "ut" + (k + 1), typ: "ut", x: 730, y: ys[k], w: 210, h: 130 });
  }
  var PLATSER_P = [];
  var xs = [20, 180, 340];
  for (var k2 = 0; k2 < 3; k2++) {
    PLATSER_P.push({ id: "in" + (k2 + 1), typ: "in", x: xs[k2], y: 70, w: 140, h: 120 });
    PLATSER_P.push({ id: "ut" + (k2 + 1), typ: "ut", x: xs[k2], y: 640, w: 140, h: 120 });
  }

  var DELAR = {
    vatten: { namn: "vatten", formel: "H₂O",
      fel: "Vatten tar växten upp med rötterna och det används i fotosyntesen. Prova att sätta det på in-sidan." },
    koldioxid: { namn: "koldioxid", formel: "CO₂",
      fel: "Koldioxid är gasen växten tar från luften. Den hör till in-sidan i fotosyntesen." },
    ljus: { namn: "solljus", formel: "ljus",
      fel: "Ljuset är energin som driver fabriken. Utan ljus stannar fotosyntesen – det ska in, inte ut." },
    socker: { namn: "socker", formel: "C₆H₁₂O₆",
      fel: "Socker bildas i fotosyntesen och är växtens näring. Det kommer ut ur fabriken, det går inte in." },
    syre: { namn: "syre", formel: "O₂",
      fel: "Syre bildas när vatten klyvs i fotosyntesen och lämnar bladet. Det hör till ut-sidan." },
    energi: { namn: "energi", formel: "energi",
      fel: "Energin frigörs när cellandningen bryter ner socker. Den kommer ut, den går inte in." },
    jord: { namn: "jord", formel: "jord",
      fel: "Jorden ger växten vatten och mineraler, men den är ingen byggsten i fotosyntesen. Fotosyntesen sker i bladet." },
    kvave: { namn: "kväve", formel: "N₂",
      fel: "Kväve finns i luften, men fotosyntesen använder koldioxid. Kväve behövs för proteiner, inte här." },
    morker: { namn: "mörker", formel: "mörker",
      fel: "I mörker stannar fotosyntesen. Växten behöver ljus – mörker är ingen byggsten." }
  };

  var FOTOSYNTES = "6 CO₂ + 6 H₂O + ljus → C₆H₁₂O₆ + 6 O₂";
  var CELLANDNING = "C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + energi";

  /* in = det som måste in, ut = det som bildas. visaUt = ut-platserna är redan fyllda. */
  var NIVAA = [
    { n: 1, namn: "Fotosyntes", in: ["vatten", "koldioxid", "ljus"], ut: ["socker", "syre"],
      visaUt: true, bricka: ["vatten", "koldioxid", "ljus"],
      mal: "Fotosyntesen: sätt in det bladet behöver.",
      forklaring: "Vatten, koldioxid och ljus – det är allt bladet behöver. Av det bygger växten socker, sin näring, och syre som går ut i luften.",
      formel: FOTOSYNTES },
    { n: 2, namn: "Fotosyntes med lockbeten", in: ["vatten", "koldioxid", "ljus"], ut: ["socker", "syre"],
      visaUt: true, bricka: ["vatten", "koldioxid", "ljus", "jord", "kvave"],
      mal: "Samma fabrik – men bara tre av sakerna hör dit.",
      forklaring: "Jord och kväve behövs för växten, men inte i fotosyntesen. Byggstenarna är vatten, koldioxid och ljus – inget annat.",
      formel: FOTOSYNTES },
    { n: 3, namn: "Hela reaktionen", in: ["vatten", "koldioxid", "ljus"], ut: ["socker", "syre"],
      visaUt: false, bricka: ["vatten", "koldioxid", "ljus", "socker", "syre", "morker"],
      mal: "Sätt in byggstenarna OCH det som bildas.",
      forklaring: "Fotosyntesen är en hel reaktion: vatten och koldioxid går in, socker och syre kommer ut. Ingenting försvinner – atomerna bara byter plats.",
      formel: FOTOSYNTES },
    { n: 4, namn: "Cellandning", in: ["socker", "syre"], ut: ["koldioxid", "vatten", "energi"],
      visaUt: false, bricka: ["socker", "syre", "koldioxid", "vatten", "energi", "ljus"],
      mal: "Nu är det natt: växten andas. Vänd på reaktionen.",
      forklaring: "På natten, utan ljus, andas växten som vi: socker och syre bryts ner och ger koldioxid, vatten och energi. Det kallas cellandning – fotosyntesens motsats.",
      formel: CELLANDNING }
  ];

  function nivaData(n) { return NIVAA[(n || 1) - 1]; }
  /* "vatten, koldioxid och ljus" – svensk uppräkning i stället för tre "och". */
  function lista(a) {
    if (a.length <= 1) return a.join("");
    return a.slice(0, -1).join(", ") + " och " + a[a.length - 1];
  }
  function tomPlacering() {
    return { in1: null, in2: null, in3: null, ut1: null, ut2: null, ut3: null };
  }

  /* Vilka platser nivån använder. */
  function platserFor(niva) {
    var p = nivaData(niva), ut = [], i;
    for (i = 0; i < p.in.length; i++) ut.push("in" + (i + 1));
    for (i = 0; i < p.ut.length; i++) ut.push("ut" + (i + 1));
    return ut;
  }
  function arLastPlats(niva, id) {
    var p = nivaData(niva);
    return p.visaUt && id.indexOf("ut") === 0;
  }

  /* Returnerar alltid samma form:
     { klar, fel: [{plats, del, text}], tomma: [plats], text } */
  function utvardera(plac, niva) {
    var p = nivaData(niva), i, id, d, inSatt = [], utSatt = [], tomma = [];
    var ids = platserFor(niva);

    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      d = plac ? plac[id] : null;
      if (!d) {
        if (arLastPlats(niva, id)) continue;
        tomma.push(id);
        continue;
      }
      if (id.indexOf("in") === 0) inSatt.push(d); else utSatt.push(d);
    }

    var fel = [];
    var dubbel = function (lista) {
      var sedda = {};
      for (var j = 0; j < lista.length; j++) {
        if (sedda[lista[j]]) return lista[j];
        sedda[lista[j]] = true;
      }
      return null;
    };
    var dIn = dubbel(inSatt), dUt = dubbel(utSatt);
    if (dIn) fel.push({ del: dIn, text: "Det ligger redan en " + DELAR[dIn].namn + " på in-sidan. Varje sak behövs bara en gång." });
    if (dUt) fel.push({ del: dUt, text: "Det ligger redan en " + DELAR[dUt].namn + " på ut-sidan. Varje sak behövs bara en gång." });

    for (i = 0; i < inSatt.length; i++) {
      if (p.in.indexOf(inSatt[i]) < 0) {
        fel.push({ del: inSatt[i], text: DELAR[inSatt[i]].fel });
        break;
      }
    }
    for (i = 0; i < utSatt.length; i++) {
      if (p.ut.indexOf(utSatt[i]) < 0) {
        fel.push({ del: utSatt[i], text: DELAR[utSatt[i]].fel });
        break;
      }
    }

    var saknasIn = [], saknasUt = [], j;
    for (j = 0; j < p.in.length; j++) if (inSatt.indexOf(p.in[j]) < 0) saknasIn.push(DELAR[p.in[j]].namn);
    if (!p.visaUt) for (j = 0; j < p.ut.length; j++) if (utSatt.indexOf(p.ut[j]) < 0) saknasUt.push(DELAR[p.ut[j]].namn);

    var klar = saknasIn.length === 0 && saknasUt.length === 0 && fel.length === 0;
    var text;
    if (klar) {
      text = p.n === 4
        ? "Cellandningen går! Socker och syre blir koldioxid, vatten och energi."
        : "Fotosyntesen går! Vatten, koldioxid och ljus blir socker och syre.";
    } else if (fel.length) {
      text = fel[0].text;
    } else if (saknasIn.length) {
      text = "Det fattas något som ska in: " + lista(saknasIn) + ".";
    } else {
      text = "Det fattas något som bildas: " + lista(saknasUt) + ".";
    }
    return { klar: klar, fel: fel, tomma: tomma, saknasIn: saknasIn, saknasUt: saknasUt, text: text };
  }

  /* Del 1 slut. *//* ================================================================ *
   * 2. RITNING – allt i SVG, inga bildfiler                           *
   * ================================================================ */

  var PAPER = "#f2ece1";
  var GRON = "#2f7d5a";
  var MORK = "#14181f";

  function el(tag, attrs, barn) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", tag), k;
    for (k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (barn) for (var i = 0; i < barn.length; i++) n.appendChild(barn[i]);
    return n;
  }
  function txt(s, attrs) { var n = el("text", attrs); n.textContent = s; return n; }

  function platsFor(id) {
    for (var i = 0; i < PLATSER.length; i++) if (PLATSER[i].id === id) return PLATSER[i];
    for (var j = 0; j < PLATSER_P.length; j++) if (PLATSER_P[j].id === id) return PLATSER_P[j];
    return null;
  }

  /* Bladet: en spetsig oval med en mittnerv och sidonerver. */
  function ritaBlad(cx, cy, rx, ry, lyser) {
    var g = el("g", {});
    if (lyser) {
      g.appendChild(el("ellipse", { cx: cx, cy: cy, rx: rx * 1.22, ry: ry * 1.16, fill: "#ffe9a8", opacity: .6, class: "glow" }));
    }
    var d = "M " + cx + " " + (cy - ry) +
      " C " + (cx + rx * 1.05) + " " + (cy - ry * 0.65) + " " + (cx + rx * 1.05) + " " + (cy + ry * 0.65) + " " + cx + " " + (cy + ry) +
      " C " + (cx - rx * 1.05) + " " + (cy + ry * 0.65) + " " + (cx - rx * 1.05) + " " + (cy - ry * 0.65) + " " + cx + " " + (cy - ry) + " Z";
    g.appendChild(el("path", { d: d, fill: lyser ? "#5cae7f" : "#6fb98d", stroke: "#2f7d5a", "stroke-width": 5 }));
    g.appendChild(el("line", { x1: cx, y1: cy - ry * 0.9, x2: cx, y2: cy + ry * 0.92, stroke: "#2f7d5a", "stroke-width": 5, "stroke-linecap": "round" }));
    for (var i = -3; i <= 3; i++) {
      if (!i) continue;
      var yy = cy + i * (ry / 4.2);
      var w = rx * 0.62 * (1 - Math.abs(i) / 4.6);
      g.appendChild(el("path", {
        d: "M " + cx + " " + yy + " Q " + (cx + w * 0.6) + " " + (yy - ry * 0.13) + " " + (cx + w) + " " + (yy - ry * 0.05),
        fill: "none", stroke: "#4f9c74", "stroke-width": 3, "stroke-linecap": "round"
      }));
      g.appendChild(el("path", {
        d: "M " + cx + " " + yy + " Q " + (cx - w * 0.6) + " " + (yy - ry * 0.13) + " " + (cx - w) + " " + (yy - ry * 0.05),
        fill: "none", stroke: "#4f9c74", "stroke-width": 3, "stroke-linecap": "round"
      }));
    }
    /* stjälk */
    g.appendChild(el("path", { d: "M " + cx + " " + (cy + ry) + " q 10 18 -12 30", fill: "none", stroke: "#7a5a33", "stroke-width": 9, "stroke-linecap": "round" }));
    return g;
  }

  /* Rör från plats till blad, med pil i flödesriktningen. */
  function ritaRor(plats, bladKant, smal) {
    var inFlode = plats.typ === "in";
    var x1, y1, x2, y2;
    if (!smal) {
      x1 = inFlode ? plats.x + plats.w : plats.x;
      y1 = plats.y + plats.h / 2;
      x2 = inFlode ? bladKant.x0 : bladKant.x1;
      y2 = y1;
    } else {
      x1 = plats.x + plats.w / 2;
      y1 = inFlode ? plats.y + plats.h : plats.y;
      x2 = x1;
      y2 = inFlode ? bladKant.y0 : bladKant.y1;
    }
    var g = el("g", {});
    g.appendChild(el("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: "#b9a077", "stroke-width": 9, "stroke-linecap": "round" }));
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    g.appendChild(el("path", {
      d: "M -11 -8 L 12 0 L -11 8 Z", fill: "#b9a077",
      transform: "translate(" + mx + " " + my + ") rotate(" + ang + ")"
    }));
    return g;
  }

  /* En del, ritad i en 120×120-ruta kring (x,y). */
  function ritaDel(typ, x, y, skala) {
    var s = skala || 1;
    var g = el("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
    if (typ === "vatten") {
      g.appendChild(el("path", { d: "M 0 -40 C 22 -14 34 2 34 16 A 34 34 0 0 1 -34 16 C -34 2 -22 -14 0 -40 Z", fill: "#5aa7d6", stroke: "#2c6fa8", "stroke-width": 4 }));
      g.appendChild(txt("H₂O", { x: 0, y: 18, "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#fff" }));
    } else if (typ === "koldioxid" || typ === "kvave") {
      var moln = typ === "koldioxid" ? "#9aa3ad" : "#b6a8d0";
      g.appendChild(el("ellipse", { cx: -14, cy: 4, rx: 26, ry: 20, fill: moln }));
      g.appendChild(el("ellipse", { cx: 14, cy: 4, rx: 24, ry: 19, fill: moln }));
      g.appendChild(el("ellipse", { cx: 0, cy: -12, rx: 24, ry: 21, fill: moln }));
      g.appendChild(txt(typ === "koldioxid" ? "CO₂" : "N₂", { x: 0, y: 12, "text-anchor": "middle", "font-size": 21, "font-weight": 700, fill: "#fff" }));
    } else if (typ === "ljus") {
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        g.appendChild(el("line", {
          x1: Math.cos(a) * 34, y1: Math.sin(a) * 34, x2: Math.cos(a) * 46, y2: Math.sin(a) * 46,
          stroke: "#e8a33d", "stroke-width": 7, "stroke-linecap": "round"
        }));
      }
      g.appendChild(el("circle", { cx: 0, cy: 0, r: 28, fill: "#ffd75e", stroke: "#e8a33d", "stroke-width": 4 }));
    } else if (typ === "socker") {
      g.appendChild(el("path", { d: "M -26 -8 L 0 -22 L 26 -8 L 26 18 L 0 32 L -26 18 Z", fill: "#fffdf7", stroke: "#b9a077", "stroke-width": 4 }));
      g.appendChild(txt("socker", { x: 0, y: 6, "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: "#6b5b47" }));
    } else if (typ === "syre") {
      g.appendChild(el("circle", { cx: 0, cy: 0, r: 32, fill: "#cfe8f7", stroke: "#5aa7d6", "stroke-width": 4 }));
      g.appendChild(el("circle", { cx: -10, cy: -12, r: 7, fill: "#fff", opacity: .8 }));
      g.appendChild(txt("O₂", { x: 0, y: 10, "text-anchor": "middle", "font-size": 24, "font-weight": 700, fill: "#2c6fa8" }));
    } else if (typ === "energi") {
      g.appendChild(el("path", { d: "M 6 -38 L -20 4 L -2 4 L -8 38 L 22 -6 L 4 -6 Z", fill: "#e8a33d", stroke: "#a8641c", "stroke-width": 4, "stroke-linejoin": "round" }));
    } else if (typ === "jord") {
      g.appendChild(el("path", { d: "M -40 26 Q -30 -10 -6 -6 Q 6 -26 26 -6 Q 44 -4 40 26 Z", fill: "#8b6a44", stroke: "#5f4527", "stroke-width": 4 }));
      g.appendChild(el("circle", { cx: -16, cy: 12, r: 4, fill: "#5f4527" }));
      g.appendChild(el("circle", { cx: 12, cy: 16, r: 3, fill: "#5f4527" }));
    } else if (typ === "morker") {
      g.appendChild(el("circle", { cx: 0, cy: 0, r: 30, fill: "#3f4a56" }));
      g.appendChild(el("circle", { cx: 12, cy: -8, r: 24, fill: PAPER }));
    }
    return g;
  }

  /* Kotten: en liten kotte med stora ögon. Fem uttryck. */
  function ritaKotten(uttryck, x, y, s) {
    s = s || 1;
    var g = el("g", { transform: "translate(" + x + " " + y + ") scale(" + s + ")" });
    var armUpp = uttryck === "hejar" || uttryck === "firar";
    var glad = uttryck === "firar" || uttryck === "hejar" || uttryck === "glad";
    g.appendChild(el("ellipse", { cx: 0, cy: 6, rx: 34, ry: 40, fill: "#b07d4b" }));
    for (var i = 0; i < 5; i++) {
      var yy = -26 + i * 13;
      g.appendChild(el("path", {
        d: "M -30 " + yy + " Q 0 " + (yy - 12) + " 30 " + yy,
        fill: "none", stroke: "#96673b", "stroke-width": 5, "stroke-linecap": "round"
      }));
    }
    g.appendChild(el("line", { x1: -30, y1: 8, x2: armUpp ? -44 : -38, y2: armUpp ? -22 : 26, stroke: "#b07d4b", "stroke-width": 9, "stroke-linecap": "round" }));
    g.appendChild(el("line", { x1: 30, y1: 8, x2: armUpp ? 44 : 38, y2: armUpp ? -22 : 26, stroke: "#b07d4b", "stroke-width": 9, "stroke-linecap": "round" }));
    var e = uttryck === "funderar" ? 4 : 9;
    g.appendChild(el("circle", { cx: -12, cy: -4, r: e + 5, fill: "#fff" }));
    g.appendChild(el("circle", { cx: 12, cy: -4, r: e + 5, fill: "#fff" }));
    g.appendChild(el("circle", { cx: -11, cy: -3, r: e - 3, fill: "#14181f" }));
    g.appendChild(el("circle", { cx: 13, cy: -3, r: e - 3, fill: "#14181f" }));
    g.appendChild(el("circle", { cx: -9, cy: -6, r: 2.4, fill: "#fff" }));
    g.appendChild(el("circle", { cx: 15, cy: -6, r: 2.4, fill: "#fff" }));
    if (uttryck === "funderar") {
      g.appendChild(el("ellipse", { cx: 0, cy: 18, rx: 5, ry: 6, fill: "#7a4f2a" }));
    } else if (glad) {
      g.appendChild(el("path", { d: "M -11 14 Q 0 26 11 14", fill: "none", stroke: "#7a4f2a", "stroke-width": 4, "stroke-linecap": "round" }));
    } else {
      g.appendChild(el("path", { d: "M -9 17 Q 0 22 9 17", fill: "none", stroke: "#7a4f2a", "stroke-width": 4, "stroke-linecap": "round" }));
    }
    if (uttryck === "firar") {
      g.appendChild(el("circle", { cx: -34, cy: -34, r: 5, fill: "#e8a33d" }));
      g.appendChild(el("circle", { cx: 0, cy: -48, r: 4, fill: "#c4452f" }));
      g.appendChild(el("circle", { cx: 34, cy: -30, r: 5, fill: "#2f7d5a" }));
    }
    return g;
  }

  /* Del 2 slut. *//* ================================================================ *
   * 3. SPELET – tillstånd, tavla, tryck, ljud och tal                 *
   * ================================================================ */

  var S = { niva: 1, plac: tomPlacering(), valt: null, klar: false,
            stjarnor: 0, startad: false, ljud: true, lage: "start", smal: false };

  var $ = function (id) { return document.getElementById(id); };
  var lagerRor, lagerPlats, lagerDel, lagerKotten, tavla;

  function arSmal() {
    var b = $("brada");
    if (!b) return false;
    var r = b.getBoundingClientRect();
    return r.height > r.width * 1.05;
  }

  /* ---------- ljud ---------- */
  var AC = null;
  function klang(frekvens, langd, typ) {
    if (!S.ljud) return;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = typ || "sine";
      o.frequency.value = frekvens;
      g.gain.value = 0.06;
      o.connect(g); g.connect(AC.destination);
      var t = AC.currentTime;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + (langd || 0.16));
      o.start(t); o.stop(t + (langd || 0.16) + 0.02);
    } catch (e) { /* ljud är aldrig ett krav */ }
  }
  function ljudSatt() { klang(660, 0.12, "triangle"); }
  function ljudFel() { klang(210, 0.22, "sine"); }
  function ljudTand() { klang(523, 0.14, "triangle"); setTimeout(function () { klang(784, 0.2, "triangle"); }, 130); }

  /* ---------- tal ---------- */
  var roster = null;
  function tala(text) {
    if (!S.ljud || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "sv-SE"; u.rate = 0.95; u.pitch = 1.02;
      if (roster) u.voice = roster;
      window.speechSynthesis.speak(u);
    } catch (e) { /* talsyntes är aldrig ett krav */ }
  }
  function valjRoster() {
    if (!("speechSynthesis" in window)) return;
    try {
      var alla = window.speechSynthesis.getVoices() || [];
      for (var i = 0; i < alla.length; i++) if (/sv[-_]SE/i.test(alla[i].lang)) { roster = alla[i]; break; }
    } catch (e) {}
  }
  if ("speechSynthesis" in window) {
    valjRoster();
    window.speechSynthesis.onvoiceschanged = valjRoster;
  }

  function kottensEvent(namn, varde) {
    try {
      if (window.skolappar && typeof window.skolappar.event === "function") {
        window.skolappar.event(namn, varde);
      }
    } catch (e) {}
  }

  /* ---------- HUD ---------- */
  function ritaHud() {
    var prickar = $("nivaPrickar");
    prickar.innerHTML = "";
    for (var i = 1; i <= NIVAA.length; i++) {
      var p = document.createElement("i");
      if (i < S.niva) p.className = "klar";
      else if (i === S.niva) p.className = "nu";
      prickar.appendChild(p);
    }
    $("nivaText").textContent = "Nivå " + S.niva + " av " + NIVAA.length;
    var st = "";
    for (var j = 0; j < NIVAA.length; j++) st += j < S.stjarnor ? "★" : "☆";
    $("stjarnor").textContent = st;
    $("stjarnor").setAttribute("aria-label", S.stjarnor + " av " + NIVAA.length + " stjärnor");
    $("mal").textContent = nivaData(S.niva).mal;
  }

  /* ---------- tavlan ---------- */
  function ritaTavla() {
    var p = nivaData(S.niva), i, id, plats, d;
    var smal = arSmal();
    S.smal = smal;
    var vb = smal ? VARLD_P : VARLD;
    tavla.setAttribute("viewBox", smal ? "0 0 500 830" : "0 0 1000 620");

    [lagerRor, lagerPlats, lagerDel, lagerKotten].forEach(function (l) { l.innerHTML = ""; });

    var blad = smal
      ? { cx: 250, cy: 405, rx: 118, ry: 168, kant: { x0: 250, x1: 250, y0: 237, y1: 573 } }
      : { cx: 500, cy: 305, rx: 132, ry: 196, kant: { x0: 368, x1: 632, y0: 109, y1: 501 } };
    lagerRor.appendChild(ritaBlad(blad.cx, blad.cy, blad.rx, blad.ry, S.klar));

    var ids = platserFor(S.niva);
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      plats = platsFor(id);
      lagerRor.appendChild(ritaRor(plats, blad.kant, smal));
    }

    /* etiketter IN och UT */
    if (smal) {
      lagerRor.appendChild(txt("IN – det växten tar upp", { x: 250, y: 38, "text-anchor": "middle", "font-size": 20, "font-weight": 700, fill: "#5d6470" }));
      lagerRor.appendChild(txt("UT – det som bildas", { x: 250, y: 800, "text-anchor": "middle", "font-size": 20, "font-weight": 700, fill: "#5d6470" }));
    } else {
      lagerRor.appendChild(txt("IN", { x: 165, y: 66, "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#5d6470" }));
      lagerRor.appendChild(txt("UT", { x: 835, y: 66, "text-anchor": "middle", "font-size": 22, "font-weight": 700, fill: "#5d6470" }));
    }

    var resultat = utvardera(S.plac, S.niva);

    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      plats = platsFor(id);
      var last = arLastPlats(S.niva, id);
      d = last ? p.ut[parseInt(id.slice(2), 10) - 1] : S.plac[id];

      var g = el("g", {});
      var ringKlass = "plats-ring" + (!d && !last && !S.klar ? " mal-puls" : "");
      if (resultat.fel.length && !last && !d && resultat.saknasIn.length + resultat.saknasUt.length > 0) ringKlass += " vanta";
      g.appendChild(el("rect", { class: ringKlass, x: plats.x, y: plats.y, width: plats.w, height: plats.h, rx: 20 }));
      if (last) g.appendChild(el("rect", { x: plats.x, y: plats.y, width: plats.w, height: plats.h, rx: 20, fill: "#e9f3ec", opacity: .7 }));

      var hit = el("rect", {
        class: "plats-hit", x: plats.x, y: plats.y, width: plats.w, height: plats.h, rx: 20,
        "data-plats": id, role: "button", tabindex: "0"
      });
      hit.setAttribute("aria-label", d ? DELAR[d].namn + " på platsen" : "tom plats, " + (plats.typ === "in" ? "in" : "ut"));
      g.appendChild(hit);
      lagerPlats.appendChild(g);

      if (d) {
        var sk = smal ? 0.78 : 0.95;
        lagerDel.appendChild(ritaDel(d, plats.x + plats.w / 2, plats.y + plats.h / 2 - (smal ? 6 : 4), sk));
        lagerDel.appendChild(txt(DELAR[d].namn, {
          x: plats.x + plats.w / 2, y: plats.y + plats.h - (smal ? 8 : 10),
          "text-anchor": "middle", "font-size": smal ? 17 : 19, "font-weight": 600, fill: "#3f4650"
        }));
      }
    }

    var uttryck = S.klar ? "firar" : (resultat.fel.length ? "funderar" : "glad");
    if (smal) lagerKotten.appendChild(ritaKotten(uttryck, 250, 618, 0.5));
    else lagerKotten.appendChild(ritaKotten(uttryck, 500, 584, 0.68));

    $("hjalp").textContent = S.klar ? resultat.text
      : (S.startad ? resultat.text : nivaData(S.niva).mal + " Tryck på en sak i brickan, sedan på en plats i bladet.");
  }

  /* ---------- brickan ---------- */
  function ritaBricka() {
    var p = nivaData(S.niva), b = $("bricka"), i;
    b.innerHTML = "";
    var satta = [];
    for (var key in S.plac) if (S.plac[key]) satta.push(S.plac[key]);
    for (i = 0; i < p.bricka.length; i++) {
      (function (typ) {
        var anvand = satta.indexOf(typ) >= 0;
        var kn = document.createElement("button");
        kn.className = "del-knapp" + (S.valt === typ ? " aktiv" : "") + (anvand ? " anvand" : "");
        kn.setAttribute("aria-pressed", S.valt === typ ? "true" : "false");
        kn.setAttribute("aria-label", DELAR[typ].namn + (anvand ? " (redan satt)" : ""));
        kn.disabled = anvand;
        var sv = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        sv.setAttribute("viewBox", "-56 -56 112 112");
        sv.setAttribute("aria-hidden", "true");
        sv.appendChild(ritaDel(typ, 0, 0, 0.95));
        kn.appendChild(sv);
        var sp = document.createElement("span");
        sp.textContent = DELAR[typ].namn;
        kn.appendChild(sp);
        kn.addEventListener("click", function () { valjDel(typ); });
        b.appendChild(kn);
      })(p.bricka[i]);
    }
  }

  function valjDel(typ) {
    if (S.klar) return;
    S.valt = S.valt === typ ? null : typ;
    ljudSatt();
    ritaBricka();
    ritaTavla();
    if (S.valt) $("hjalp").textContent = "Tryck på platsen där " + DELAR[typ].namn + " ska vara.";
  }

  /* ---------- tryck på en plats ---------- */
  function tryckPlats(id) {
    if (S.klar || S.lage !== "spel") return;
    var p = nivaData(S.niva);
    if (platserFor(S.niva).indexOf(id) < 0) return;
    if (arLastPlats(S.niva, id)) {
      tala("Den platsen är redan klar. Den visar vad som bildas.");
      return;
    }
    var har = S.plac[id];

    if (!S.valt) {
      if (har) {
        S.plac[id] = null;
        ljudSatt();
        ritaBricka();
        ritaTavla();
        $("hjalp").textContent = "Platsen är tom igen. Välj en sak i brickan.";
        return;
      }
      $("hjalp").textContent = "Välj först en sak i brickan nedanför.";
      tala("Välj först en sak i brickan.");
      return;
    }

    /* Sätt dit och låt modellen döma. */
    var valt = S.valt;
    S.plac[id] = valt;
    S.valt = null;
    S.startad = true;
    kottensEvent("hint");
    var ut = utvardera(S.plac, S.niva);
    if (ut.fel.length && ut.fel[0].del === valt) {
      /* fel sak – sätt tillbaka den i brickan, rita först och förklara sedan
         (ritaTavla skriver annars sin egen sammanfattning över förklaringen) */
      S.plac[id] = null;
      ljudFel();
      ritaBricka();
      ritaTavla();
      $("hjalp").textContent = ut.fel[0].text;
      tala(ut.fel[0].text);
      return;
    }
    ljudSatt();
    ritaBricka();
    ritaTavla();
    if (ut.klar) { klartNiva(); return; }
    $("hjalp").textContent = ut.text;
    tala(ut.text);
  }

  /* ---------- nivå klar ---------- */
  function klartNiva() {
    if (S.klar) return;
    var p = nivaData(S.niva);
    S.klar = true;
    S.lage = "ruta";
    S.stjarnor++;
    ljudTand();
    ritaHud();
    ritaTavla();
    kottensEvent("level", S.niva);
    tala(p.n === 4 ? "Cellandningen går. Socker och syre blir koldioxid, vatten och energi." : "Fotosyntesen går. Socker och syre bildas.");

    setTimeout(function () {
      var sista = S.niva >= NIVAA.length;
      $("rutaKotten").innerHTML = "";
      $("rutaKotten").appendChild(ritaKotten("firar", 100, 105, 1.35));
      $("rutaTitel").textContent = sista ? "Alla fabriker klara!" : (p.n === 4 ? "Cellandningen går!" : "Fabriken går!");
      $("rutaText").textContent = p.forklaring +
        (sista ? " Du har klarat alla fyra nivåer och fått " + S.stjarnor + " av " + NIVAA.length + " stjärnor." : "");
      $("rutaFormel").textContent = p.formel;
      $("rutaKnapp").textContent = sista ? "Spela igen" : "Nästa nivå";
      $("ruta").hidden = false;
      $("rutaKnapp").focus();
      kottensEvent("round_done", Math.round(100 * S.stjarnor / NIVAA.length));
    }, 1100);
  }

  /* ---------- start och omstart ---------- */
  function startaNiva(n) {
    S.niva = Math.max(1, Math.min(NIVAA.length, n || 1));
    S.plac = tomPlacering();
    S.valt = null;
    S.klar = false;
    S.lage = "spel";
    S.startad = false;
    $("ruta").hidden = true;
    ritaHud();
    ritaBricka();
    ritaTavla();
    setTimeout(function () { tala(nivaData(S.niva).mal); }, 260);
  }

  function koppla() {
    tavla = $("tavla");
    lagerRor = $("lager-ror");
    lagerPlats = $("lager-plats");
    lagerDel = $("lager-del");
    lagerKotten = $("lager-kotten");

    tavla.addEventListener("click", function (ev) {
      var t = ev.target;
      while (t && t !== tavla) {
        if (t.getAttribute && t.getAttribute("data-plats")) { tryckPlats(t.getAttribute("data-plats")); return; }
        t = t.parentNode;
      }
    });
    tavla.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var t = ev.target;
      if (t && t.getAttribute && t.getAttribute("data-plats")) {
        ev.preventDefault(); tryckPlats(t.getAttribute("data-plats"));
      }
    });

    $("spela").addEventListener("click", function () {
      $("startskarm").hidden = true;
      $("spelet").hidden = false;
      document.body.classList.add("spelar");
      kottensEvent("round_start");
      startaNiva(1);
    });

    $("rutaKnapp").addEventListener("click", function () {
      var sista = S.niva >= NIVAA.length;
      if (sista) { S.stjarnor = 0; kottensEvent("round_start"); startaNiva(1); }
      else startaNiva(S.niva + 1);
    });

    $("upprepa").addEventListener("click", function () {
      tala(nivaData(S.niva).mal);
      $("hjalp").textContent = nivaData(S.niva).mal;
    });

    $("ljud").addEventListener("click", function () {
      S.ljud = !S.ljud;
      this.setAttribute("aria-pressed", S.ljud ? "false" : "true");
      this.setAttribute("aria-label", S.ljud ? "Stäng av ljud" : "Sätt på ljud");
      if (!S.ljud) {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        kottensEvent("sound_off");
      } else klang(660, 0.1);
    });

    window.addEventListener("resize", function () { if (S.lage !== "start") ritaTavla(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", koppla);
  else koppla();

  /* Utvecklingshandtag: låter ett testprogram spela utan att spela. */
  window.__game = {
    S: S, NIVAA: NIVAA, PLATSER: PLATSER, PLATSER_P: PLATSER_P, DELAR: DELAR,
    startaNiva: startaNiva, tryckPlats: tryckPlats, valjDel: valjDel,
    utvardera: utvardera, platserFor: platserFor, nivaData: nivaData,
    tomPlacering: tomPlacering, ritaTavla: ritaTavla
  };
})();