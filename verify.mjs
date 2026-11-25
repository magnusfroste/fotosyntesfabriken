// Kontrollerar Fotosyntesfabrikens data och reaktionsmodell i public/app.js.
// Reglerna räknas om här, oberoende av appens egen kod:
//   en nivå är klar exakt när varje sak som ska in ligger på in-sidan och varje sak
//   som bildas ligger på ut-sidan (eller är förifylld), utan dubbletter och utan
//   något som inte hör dit. Varje lockbete måste avvisas på båda sidorna.
// Dessutom: geometrin ryms i båda viewBoxarna och platserna överlappar inte.
//   node verify.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./public/app.js", import.meta.url), "utf8");
const start = src.indexOf("var VARLD =");
const end = src.indexOf("/* Del 1 slut.");
if (start < 0 || end < 0) throw new Error("hittar inte datadelen i app.js");
const ren = src.slice(start, end);
const G = eval("(function(){" + ren +
  "\nreturn {VARLD, VARLD_P, PLATSER, PLATSER_P, DELAR, NIVAA, nivaData, tomPlacering, utvardera, platserFor, arLastPlats};})()");

let fel = 0;
const kolla = (c, m, p) => { if (!c) { fel++; if (fel <= 25) console.log("FEL", m, p === undefined ? "" : JSON.stringify(p)); } };

// --- 1. delar ---
const namn = new Set();
for (const [id, d] of Object.entries(G.DELAR)) {
  kolla(typeof d.namn === "string" && d.namn.length > 1, "delen saknar namn", id);
  kolla(typeof d.formel === "string" && d.formel.length > 0, "delen saknar formel", id);
  kolla(typeof d.fel === "string" && d.fel.length > 25, "delen saknar förklaring", id);
  kolla(!namn.has(d.namn), "dubbelt namn", d.namn); namn.add(d.namn);
}

// --- 2. nivåerna ---
kolla(G.NIVAA.length === 4, "fyra nivåer", G.NIVAA.length);
G.NIVAA.forEach((p, i) => {
  kolla(p.n === i + 1, "fel nivånummer", p.n);
  kolla(p.in.length >= 2 && p.in.length <= 3, "in-sidan har fel antal", p.in);
  kolla(p.ut.length >= 2 && p.ut.length <= 3, "ut-sidan har fel antal", p.ut);
  kolla(typeof p.mal === "string" && p.mal.length > 10, "målet saknas", p.n);
  kolla(typeof p.forklaring === "string" && p.forklaring.length > 40, "förklaringen saknas", p.n);
  kolla(typeof p.formel === "string" && /→/.test(p.formel), "formeln saknas", p.n);
  for (const id of [...p.in, ...p.ut]) kolla(!!G.DELAR[id], "okänd del i nivån", id);
  for (const id of p.bricka) kolla(!!G.DELAR[id], "okänd del i brickan", id);
  // varje byggsten måste finnas i brickan eller vara förifylld
  for (const id of p.in) kolla(p.bricka.includes(id), "in-delen finns inte i brickan", id);
  for (const id of p.ut) kolla(p.visaUt || p.bricka.includes(id), "ut-delen finns inte i brickan", id);
  // inga dubbletter inom en sida, ingen del på båda sidorna
  kolla(new Set(p.in).size === p.in.length, "dubblett på in-sidan", p.n);
  kolla(new Set(p.ut).size === p.ut.length, "dubblett på ut-sidan", p.n);
  for (const id of p.in) kolla(!p.ut.includes(id), "samma del in och ut", p.n + " " + id);
});

// --- 3. modellen: varje nivå går att lösa, i vilken ordning som helst ---
const inIds = n => G.platserFor(n).filter(x => x.startsWith("in"));
const utIds = n => G.platserFor(n).filter(x => x.startsWith("ut"));

function spela(n, inOrdning, utOrdning, extra) {
  const plac = G.tomPlacering();
  inOrdning.forEach((d, i) => { plac[inIds(n)[i]] = d; });
  (utOrdning || []).forEach((d, i) => { plac[utIds(n)[i]] = d; });
  if (extra) for (const k of Object.keys(extra)) plac[k] = extra[k];
  return G.utvardera(plac, n);
}

for (const p of G.NIVAA) {
  const n = p.n;
  const rakt = spela(n, p.in.slice(), p.visaUt ? [] : p.ut.slice());
  kolla(rakt.klar, "nivån går inte att lösa", n);
  const baklanges = spela(n, p.in.slice().reverse(), p.visaUt ? [] : p.ut.slice().reverse());
  kolla(baklanges.klar, "nivån går inte att lösa i omvänd ordning (in-platserna är utbytbara)", n);
  kolla(inIds(n).length === p.in.length, "fel antal in-platser", n);
  kolla(utIds(n).length === p.ut.length, "fel antal ut-platser", n);

  // halvfärdig nivå är inte klar och säger vad som fattas
  const halv = spela(n, p.in.slice(0, -1), p.visaUt ? [] : p.ut.slice(0, -1));
  kolla(!halv.klar, "halvfärdig nivå räknas som klar", n);
  kolla(halv.saknasIn.length === 1, "saknar inte exakt en in-del", { n, s: halv.saknasIn });

  // varje del i brickan som inte hör till nivån måste avvisas på båda sidorna
  const tillatna = new Set([...p.in, ...p.ut]);
  for (const d of p.bricka) {
    if (tillatna.has(d)) continue;
    const somIn = spela(n, p.in.slice(0, -1).concat([d]), p.visaUt ? [] : p.ut.slice());
    const somUt = p.visaUt ? null : spela(n, p.in.slice(), p.ut.slice(0, -1).concat([d]).slice(0, utIds(n).length));
    kolla(!somIn.klar, "lockbete godtas på in-sidan", { n, d });
    kolla(somIn.fel.length > 0, "lockbete på in-sidan ger ingen förklaring", { n, d });
    if (somUt) {
      kolla(!somUt.klar, "lockbete godtas på ut-sidan", { n, d });
      kolla(somUt.fel.length > 0 || somUt.saknasUt.length > 0, "lockbete på ut-sidan ger ingen förklaring", { n, d });
    }
  }

  // dubblett av en riktig del avvisas
  if (p.in.length >= 2) {
    const dubbel = spela(n, [p.in[0], p.in[0]].concat(p.in.slice(1, inIds(n).length)), p.visaUt ? [] : p.ut.slice());
    kolla(!dubbel.klar, "dubblett godtas", n);
    kolla(dubbel.fel.length > 0 && /redan/.test(dubbel.fel[0].text), "dubblett ger ingen förklaring", n);
  }
}

// --- 4. geometrin ---
function rects(upps, vb, namnPå) {
  const sedda = [];
  for (const s of upps) {
    kolla(s.x >= 0 && s.y >= 0 && s.x + s.w <= vb.b && s.y + s.h <= vb.h, "plats utanför " + namnPå, s.id);
    kolla(s.w >= 120, "platsen är för smal för ett finger", s.id);
    for (const t of sedda) {
      const överlapp = s.x < t.x + t.w && t.x < s.x + s.w && s.y < t.y + t.h && t.y < s.y + s.h;
      kolla(!överlapp, "platser överlappar i " + namnPå, s.id + " / " + t.id);
    }
    sedda.push(s);
    kolla(s.typ === "in" || s.typ === "ut", "okänd plats-typ", s.id);
  }
}
rects(G.PLATSER, G.VARLD, "liggande");
rects(G.PLATSER_P, G.VARLD_P, "stående");
for (const id of ["in1", "in2", "in3", "ut1", "ut2", "ut3"]) {
  kolla(G.PLATSER.some(p => p.id === id), "plats saknas i liggande", id);
  kolla(G.PLATSER_P.some(p => p.id === id), "plats saknas i stående", id);
}

// --- 5. sisådär 20 000 slumpade tillstånd: klar får bara bli sant på rätt sätt ---
let klarRaknat = 0;
for (let t = 0; t < 20000; t++) {
  const p = G.NIVAA[t % G.NIVAA.length], n = p.n;
  const plac = G.tomPlacering();
  const alla = [...p.bricka];
  for (const id of G.platserFor(n)) {
    if (G.arLastPlats(n, id)) continue;
    if (Math.random() < 0.6) plac[id] = alla[Math.floor(Math.random() * alla.length)];
  }
  const r = G.utvardera(plac, n);
  if (!r.klar) continue;
  klarRaknat++;
  const sattaIn = inIds(n).map(i => plac[i]).filter(Boolean).sort().join(",");
  const sattaUt = utIds(n).map(i => plac[i]).filter(Boolean).sort().join(",");
  kolla(sattaIn === p.in.slice().sort().join(","), "klar trots fel in-sida", { n, plac });
  kolla(p.visaUt || sattaUt === p.ut.slice().sort().join(","), "klar trots fel ut-sida", { n, plac });
}

console.log(fel === 0
  ? "OK: 4 nivåer, alla lösbara, alla lockbeten avvisade, geometrin ryms, " + klarRaknat + " klar-tillstånd kontrollerade."
  : fel + " fel");
process.exit(fel ? 1 : 0);