# Sum-IT website v2: wijzigingen (1 nov 2026)

Basis: de Vercel-versie (sum-it-five.vercel.app), samengevoegd met de live repo (sum-it.eu).
Alles wat alleen op live stond (CNAME, aanmeld-API in `functions/`, Google-verificatie, logo's, SQL) is behouden.

## Feedback verwerkt
| Van | Punt | Wat er gedaan is |
|---|---|---|
| Payam | Losse pagina's i.p.v. één lange homepage | Homepage van ~12.700 px naar ~5.200 px. Details staan op de eigen pagina's, de homepage linkt ernaartoe met 6 kaarten |
| Payam | Visitekaartjesmaker weg | Uit de homepage, aanmeldvoordelen en de portal-tip gehaald |
| Payam | Promotie duidelijk op Prijzen en homepage | Groene balk "Straks €11 per maand. Meld je nu aan en gebruik het GRATIS!" op Prijzen, homepage-prijsblok, hero en aanmeldformulier. "Eerste 150" is overal weg |
| Payam | Facturensectie op homepage te druk | De volledige ontwerpkiezer staat niet meer op de homepage, alleen een kaart. Hij staat nog wel op /functies/facturen/ |
| Ian | Boekhouders als eigen tab | "Boekhouders" staat in het hoofdmenu op alle pagina's (→ /voor/boekhouders/) |
| Ian | Team hoger | Team staat direct onder de hero |
| Ian | Homepage te lang | Zie punt 1 |
| Ian | Handschriftlettertype op testimonials | Vervangen door het normale lettertype van de site (DM Sans) |

## Beslissingen (graag controleren)
1. **Promotietekst**: "Straks €11" in plaats van "Normaal €11". De €11 is nog nooit gerekend. Een "normaal"-prijs die nooit gegolden heeft, kan onder de Nederlandse regels voor prijsaanduiding als misleidend gelden. Veiligste optie gekozen.
2. **Blog-database**: de nieuwe site koppelde het blog aan de eigen Supabase-database van de ontwikkelaar, met beheerder chandan.advantech@gmail.com. Dat is losgekoppeld: het blog gebruikt nu jullie eigen Supabase. De vaste blogartikelen werken gewoon. Nieuwe CMS-artikelen schrijven werkt pas als de blogtabellen in jullie Supabase staan.
3. **Hoofdmenu**: Facturen en Projecten staan niet meer los in het menu (te vol, teksten liepen over elkaar). Ze zijn bereikbaar via Functies en blijven in het mobiele menu staan.
4. **Aanmelden**: het werkt precies zoals op de huidige live site (zelfde API en database). Doorsturen naar de app kan pas als er een definitieve URL voor de app-registratie is.
5. **Van de homepage gehaald** (staat op subpagina's of niet meer nodig): "De onmogelijke keuze", de projecten-demo, het btw-blok, het community-blok, het referral-blok en het boekhoudersblok.

---

# Ronde 2 (1 nov 2026, middag): feedback Ian

## Gedaan
- **Teamfoto's** (Ian, Sebastian, Abhishek) op homepage en /team/. Bron: de gedeelde teammap in Drive (zakelijke foto's). Abhishek's LinkedIn-foto (bergtop) is bewust niet gebruikt.
- **Eigen pictogrammen** (SVG, Sum-IT-stijl) in plaats van emoji in de 6 functiekaarten.
- **Functiepagina's opnieuw opgebouwd** met echte app-screenshots in een telefoonframe: /functies/, bonnetjes scannen, btw apart zetten, facturen & offertes, projecten, en /voor/boekhouders/. De oude SEO-teksten staan onderaan onder "Meer weten".
- **Facturen & offertes**: nu "één ontwerp + eigen logo"; meerdere ontwerpen en eigen kleur staan als **Binnenkort**. Uitleg over het verschil tussen offerte en factuur. De 21/32-ontwerpenkiezer is van de site gehaald.
- **Privacy** als eigen menu-item, met een nieuwe pagina /privacy-en-veiligheid/ (alleen claims uit de eigen specificaties: EU/Frankfurt, versleuteling, AVG-rechten, 72-uursmelding).
- **Mollie-eisen**: bedrijfsgegevens in elke footer, /contact/, /algemene-voorwaarden/ (concept), prijzen in EUR excl. btw, betaaltermijnen, en een vermelding van de 0,5% op betaallinks.
- **Aanmeldknoppen** gaan naar https://stg.sum-it.eu/register (instelbaar in config.js: APP_REGISTER_URL).

## Screenshots: hoe gemaakt
- Lokale Sum-it app (repo ~/Sum-it-dev, 22 okt + iOS-werk) in de iPhone 18 Pro-simulator, bediend met Maestro (~/Sum-it-dev/_import/demo/maestro).
- Demo-bedrijf "Timmerwerk Eikenhof" (fictief), gevuld met ~/Sum-it-dev/_import/demo/seed_eikenhof.py en fix*.py.
- Lokale S3-nabootsing (Docker-container `sumit-s3`, moto), zodat facturen lokaal bevestigd konden worden. Originele instellingen: local-dev/.env.local.bak-voor-s3-demo.
- Niet de APK van Ishan (31 okt): die praat met stg.sum-it.eu, en het testaccount daar bevat echte klantgegevens van IBM local.

## Beslissingen (graag checken)
1. Algemene voorwaarden zijn een **concept** voor Stefan (Baker Tilly). Bevoegde rechter: Rechtbank Zeeland-West-Brabant (Rijswijk NB valt in de gemeente Altena).
2. Aansprakelijkheid in de AV: max. wat in 12 maanden is betaald, met een plafond van €2.500 per gebeurtenis (gratis profiel: €100).
3. Prijsvermelding: €11 p/m **excl. btw** (€13,31 incl.).
4. De 0,5% platformfee + Mollie-kosten voor de gebruiker staan op Prijzen en in de AV.
5. Desktopmenu: Functies · Community · Prijzen · Boekhouders · Privacy · Team · Blog. Facturen en Projecten zitten onder Functies.

## Open punten
- **Btw-id** van Alpha Nova B.V. invullen (contactpagina toont "[btw-id INVULLEN]").
- Blog-CMS: de blogtabellen moeten in jullie eigen Supabase-project komen (zie ronde 1).
- Community-screenshots: lokaal is het netwerk leeg, dus de Community-pagina houdt zijn bestaande beelden.
