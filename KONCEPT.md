# Fotosyntesfabriken – koncept och testplan

**Mål (en sak):** fotosyntesen och cellandning som en reaktion med in- och utsida.
**Målgrupp:** biologi åk 4–6 (10–12 år). Katalogen hade **noll** biologiappar (74 rader: Matte 34,
Språk 14, STEM 13, Kreativt 8, Samhälle 5 – ingen med BI-punkt). Tom cell.
**Kärnmekanik (touch):** bladet är en fabrik. Tre in-platser till vänster, tre ut-platser till
höger. Tryck på en sak i brickan (den blir aktiv), tryck på en plats – modellen räknar direkt ut om
reaktionen går ihop. Fel sak studsar tillbaka med en förklaring, inget går förlorat.
**Nivåer:** 1) fotosyntesens tre byggstenar (ut-sidan förifylld), 2) samma med jord och kväve som
lockbeten, 3) hela reaktionen – barnet sätter även socker och syre, 4) cellandning: socker och syre
in, koldioxid, vatten och energi ut (ljus som lockbete).
**5-minuterssession:** fyra nivåer, en stjärna per nivå, "Spela igen" på slutet.
**Belöning att berätta om:** "Bladet gör socker av luft och vatten – och på natten andas det."
**Vad barnet lär:** byggstenarna i fotosyntesen, att syre bildas och socker är växtens näring,
samt att cellandning är samma reaktion baklänges.
**Lgr22:** BI.4-6.1.2 – "Näringskedjor och kretslopp i närmiljön. Djurs, växters och svampars
samspel med varandra och hur några miljöfaktorer påverkar dem. Fotosyntes och cellandning."
**iPad:** allt ritas i SVG, inga bildfiler, inget nätverk utöver kodsnutten, tal på svenska,
ljudreglage, `prefers-reduced-motion`.

## Testplan (mätbara krav)
- `node verify.mjs`: varje nivå lösbar i valfri ordning, varje lockbete avvisas på båda sidorna,
  dubbletter avvisas, 20 000 slumpade tillstånd – `klar` bara när båda sidorna stämmer, geometrin
  ryms i båda viewBoxarna utan överlapp. **Krav: 0 fel.**
- Spela alla fyra nivåer med `Input.dispatchTouchEvent` (touch, inte klick); kontrollera stjärnor,
  dialogtexter och att fel sak ger förklaring utan att nivån flyttas vidare.
- 0 px scroll (`scrollHeight-innerHeight`, `scrollWidth-innerWidth`) i 1024×768, 768×1024,
  390×844, 1440×900 – både på startskärmen och i spelet.
- Tryckyta ≥ 56 px (åk 4–6) på alla platser; mätt minsta plats per storlek.
- Ingen text som måste läsas för att spela: målet läses upp, delarna har bild + namn.
