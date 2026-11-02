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

---

# Ronde 3 (1 nov 2026, avond): feedback Ian

## Gedaan
- **Homepage**: jouw foto is je huidige LinkedIn-foto. Titel "CEO & medeoprichter" met een nieuwe intro. De ingebouwde demo-telefoon is vervangen door een slideshow van 6 echte app-schermen. De kaart "Samen sterker" vervangt "Netwerk van vakmensen".
- **Functies-overzicht**: kaarten met eigen pictogrammen, geen telefoons.
- **Functiepagina's**: de telefoon in de kop staat recht. Per pagina hooguit één extra scherm, verder grote pictogrammen.
- **Btw**: overal eerlijk. Sum-IT rekent uit hoeveel je opzij zet, de ondernemer zet het zelf apart, en Sum-IT houdt geen geld vast. De **Acties-flow** staat erin als verkooppunt. Een agent herschreef ~25 oude zinnen op 17 pagina's (NL en EN).
- **Community**: opnieuw opgebouwd. Kop "Alleen ga je sneller. Samen kom je verder." Eigen illustratie van vakmensen die samen een balk dragen. Een blok "Waarom we dit bouwen" (moed om te ondernemen, sociaal aspect). Pensioen en verzekering staan er licht in, als "Later". Ook staat de 0,5% erin, met een link naar Prijzen.
- **Prijzen**: blok "0,5% voor boeken die vanzelf kloppen" met een rekenhulp (€70.000 omzet geeft €350 per jaar, plus €132 abonnement). Verder "begin je net, betaal je minder" en een link naar Community.
- **Boekhouders en Privacy**: emoji's vervangen door eigen pictogrammen.
- **Privacy**: echte Europakaart met 6 datacenter-puntjes zonder plaatsnamen. "Frankfurt" is overal weg, ook uit de privacyverklaring.
- **Pictogrammen**: een aparte reviewagent keurde de hele set. 9 iconen zijn verbeterd, 4 nieuw (prullenbak, kluis, sleutel, oog-doorgestreept), en verkeerde iconen op 3 plekken zijn vervangen.

## Beslissingen
- 0,5% geldt voor betalingen via de Sum-IT-betaallink (automatisch gekoppeld en geboekt), zoals in de AV. Wie de betaallink niet gebruikt, betaalt geen 0,5%. De Mollie-kosten komen erbij (staat in de kleine lettertjes).
- "Goedkoper dan een boekhouder" staat er als "voor veel ondernemers minder dan een boekhouder per jaar kost". Zonder een concreet boekhoudersbedrag, om een misleidende vergelijking te voorkomen.

---

# Ronde 4 (1 nov 2026, avond): feedback Ian

## Gedaan
- **Homepage**: achtergrond uit de foto's van Ian en Sebastian gehaald (nu wit). Het privacyblok is klikbaar en leidt naar /privacy-en-veiligheid/.
- **Team** (homepage en /team/): drie naast elkaar in de volgorde Abhishek, Ian, Sebastian, elk met een kort verhaal op basis van hun LinkedIn. Rollen: Abhishek "Medeoprichter · Commercie & groei", Ian "CEO & medeoprichter", Sebastian "CFO & medeoprichter".
- **Functies**: groot Acties-blok op /functies/ en een eigen pagina /functies/acties/, met pictogrammen en een live mini-demo: 4 taken afvinken tot "Alles bijgewerkt". Automatisch afspelen of zelf klikken. De link "Acties-flow" in het overzicht gaat nu naar /functies/acties/.
- **Prijzen**: de rekenhulp toont een rode lijn (gemiddelde boekhouder, €1.200 per jaar) en een groene lijn (Sum-IT, €132 + 0,5%), met het omslagpunt rond €213.600 omzet en een eerlijke uitslag ("dan is een boekhouder voordeliger"). Nieuw blok "Heb ik nog een boekhouder nodig?". Dezelfde vraag staat bovenaan de veelgestelde vragen op Prijzen en op Boekhouders.
- **Privacy**: blok "Alles laten verwijderen? Dat kan, volledig." in drie stappen (downloaden, bewaren, wij verwijderen). De FAQ en kaart zijn aangepast, en ook artikel 11.4 van de algemene voorwaarden.
- Mobiel: de rekenhulp op Prijzen en Community stond op telefoons in twee smalle kolommen. Dat is opgelost.

## Beslissingen (graag checken)
1. **"9 van de 10 zzp'ers"** staat er als "naar onze inschatting". Een harde bron (CBS-omzetverdeling) heb ik niet gevonden. Een cijfer zonder bron in reclame is riskant onder de regels tegen misleidende reclame. Heb je een bron, dan kan "naar onze inschatting" eraf.
2. **€1.200 voor een boekhouder** staat er als gemiddelde ter vergelijking, met de kanttekening "jouw boekhouder kan meer of minder rekenen".
3. **Verwijderen pas na download**: de fiscale bewaarplicht (7 jaar, art. 52 AWR) ligt bij de ondernemer. Daarom verwijdert Sum-IT de administratie pas als de gebruiker bevestigt dat hij een download heeft. Sum-IT bewaart alleen zijn eigen facturen aan de gebruiker 7 jaar (eigen bewaarplicht). Een AVG-verzoek mag je niet zomaar weigeren, dus laat Stefan dit toetsen. Een tussenvorm kan ook: persoonsgegevens (profiel, contact) direct wissen, en de administratie na bevestiging.
4. **Mini-demo** is gemarkeerd als "Voorbeeld". De app kent nu: te late facturen, langer dan 30 dagen onbetaald, en concepten te controleren. Een melding "bonnetje ontbreekt" en een btw-herinnering staan erin omdat je ze vroeg. Bouw ze in de app, of laat het weten, dan haal ik ze uit de demo.
5. Downloaden met "één knop in de app" (privacy-stap 1): graag checken of de export in de app er al is.

---

# Ronde 5 (1 nov 2026, avond): feedback Ian

## Gedaan
- **Team** (homepage en /team/): de kop is nu "Van ondernemers, voor ondernemers" (EN: "By entrepreneurs, for entrepreneurs").
- **Telefoon in de kop** (Functies, alle functiepagina's, Acties, Boekhouders): kleiner en helemaal in beeld, niet meer afgesneden aan de onderkant.
- **Acties-demo** opnieuw gebouwd naar het eigen app-prototype `sumitapp_64_2.html` (mail "reconcilltion flow", 21 aug 2026). Bewaard in ~/Sum-it-dev/_import/actie-proto/. De demo loopt zo:
  - Dashboard-kaart "Acties" met gekleurde chips en Start.
  - Daarna stap voor stap: Inkomsten (betaling koppelen), Geld uit (geen bon, scan), Te laat (herinnering), Belasting (btw klaarzetten).
  - Samenvatting "Klaar." en daarna de dashboard-kaart "Alles bij. Niets te doen."
  - Zelfde kleuren, knoppen, stappenbalk en melding "Ongedaan" als in de app.
- **Community**: op de plank van de poppetjes staat nu een dorpje als silhouet (kerk, huisjes, bomen, molen die draait), met het onderschrift "Zzp’ers houden samen de samenleving overeind." Het pensioen- en verzekeringsblok is weg.

## Ronde 5b
- Acties-demo speelt langzamer af (4 seconden per stap).
- Community-dorpje opnieuw getekend:
  - Geen ramen en geen bomen meer.
  - Kleiner, en alles past op de plank.
  - Meer variatie, zodat het een echte dorpskyline is: trapgevels, halsgevels, platte daken en een schuur.
  - De haan staat op de kerk en de molen draait nog.
- Abhishek: "in de marketing in de farmaceutische wereld", zonder bedrijfsnamen.
- Team-pagina: drie even grote blokken met "1 doel" in het midden. Op de homepage staat "1 doel" ook in het midden.

## Ronde 5c
- Haan van de kerk gehaald. Er staat nu een eenvoudige spits met bolletje.
- **Prijzen: nieuwe, grote vergelijkingsgrafiek** "Sum-IT of een boekhouder":
  - Schuifbalk voor de jaaromzet, met drie tegels: Sum-IT per jaar, gemiddelde boekhouder en "Je bespaart" (of "Boekhouder voordeliger").
  - Groene lijn (Sum-IT: €132 + 0,5% van de omzet) en rode lijn (boekhouder: €1.200 per jaar).
  - Het besparingsgebied is groen, het gebied waar een boekhouder goedkoper is licht rood.
  - Omslagpunt bij €213.600, en een stippellijn voor "zonder betaallinks: €132".
  - Rekening gecontroleerd: (1200 − 132) / 0,005 = €213.600.

## Ronde 5d
- **Boekhouderlijn stijgt mee met de omzet** (indicatie, excl. btw): €500 onder €20k (KOR), €900 vanaf €20k, €1.200 vanaf €50k, €1.600 vanaf €100k en €2.000 vanaf €200k. Dat valt binnen de gangbare zzp-tarieven van €450 tot €2.500 per jaar (bron: Qonto 2026). De grafiek loopt nu tot €400k omzet. Het omslagpunt ligt bij ±€373.600: (2.000 − 132) / 0,5%.
- **0,5% platformvergoeding** geldt nu over alle omzet die via Sum-IT wordt gefactureerd, ongeacht hoe de klant betaalt. Bij betaling via een betaallink wordt die automatisch verrekend. De site noemt de betaallink-uitzondering niet meer, en de stippellijn "zonder betaallinks: €132" is weg.
- **Algemene voorwaarden, art. 7** herschreven: "Platformvergoeding en betaallinks". 0,5% over gefactureerde omzet excl. btw, een creditfactuur wordt naar rato verrekend, automatische verrekening bij een betaallink, anders maandelijks achteraf gefactureerd. **Beslissing voor Stefan:** de 0,5% wordt berekend over de gefactureerde omzet, niet over de ontvangen betaling.

## Ronde 5e
- **0,5% alleen over wat binnenkomt**: de vergoeding geldt over ontvangen betalingen op facturen die via Sum-IT zijn uitgegeven, via betaallink of overboeking. Over onbetaalde facturen betaal je niets, en bij een terugbetaling of terugboeking wordt de vergoeding verrekend. Aangepast op de site en in art. 7.1 van de algemene voorwaarden.
- **Grafiek rustig gemaakt**: de lay-out verspringt niet meer tijdens het schuiven. De omzet heeft een vaste breedte, de tegels en de uitslagtekst een vaste hoogte, en alle cijfers zijn even breed.

## Beveiliging (1 nov 2026)
- **PHP2Shell (CVE-2026-109618/109619, gepatcht 21 okt 2026):** de website gebruikt geen PHP: het zijn statische pagina's op GitHub Pages, met de aanmeldfunctie op Cloudflare Pages Functions (JavaScript). Ze is dus niet kwetsbaar. De Sum-IT-app draait op Python, ook niet geraakt.
- **Supabase-bibliotheek vastgezet** op versie 2.117.3, met een integriteitscontrole (SRI) op 7 pagina's (login, portal, wachtwoord, beheer, admin). Eerder laadde de site altijd "de nieuwste 2.x". Werd die bij het CDN aangepast, dan draaide er zonder controle andere code op de loginpagina's.
- **QR-bibliotheek** op /portal kreeg ook een SRI-controle.
- Gecontroleerd: in de site staat alleen de publieke (publishable) Supabase-sleutel en geen geheime sleutels. De beheerpagina's staan op noindex. Blogteksten uit het CMS gaan door een sanitizer.
- **Advies (buiten de website):** zorg dat Row Level Security in Supabase aan staat op alle tabellen, want de publieke sleutel geeft verder alleen wat RLS toestaat. Laat ook de mail- en hostingproviders bevestigen dat ze voor PHP2Shell gepatcht zijn, als daar PHP draait.

---

# Ronde 6 (2 nov 2026): projectbeheer en cookies

## Projectbeheer (/functies/projecten/)
- Nieuw blok "Van offerte tot eindafrekening, in één project", met een demo van de stappen offerte → project → bonnetjes → betalingen → eindfactuur → winst. Daarna 5 stappen. "Mensen toevoegen" staat als **Binnenkort**, omdat de app het nog niet kan.
- Echte app-screenshots van het demoproject "Dakkapel De Vries" (fictief, Timmerwerk Eikenhof). Het project bevat:
  - verschillende soorten uitgaven: hout, dakbeschot, goot, steigerhuur, afvalcontainer, dakraam, onderaannemer dakdekker
  - een geaccepteerde offerte
  - twee termijnfacturen, waarvan één betaald

## Cookies en privacy
- **Onderzoek:**
  - De site plaatst geen tracking- of marketingcookies.
  - In de browser staat alleen functionele opslag: taalkeuze, cookiekeuze, inlogsessie (Supabase) en het e-mailadres tijdens een wachtwoordherstel. Daarvoor is geen toestemming nodig (art. 11.7a Tw).
  - Plausible stond in de code als koppeling, maar wordt nooit geladen.
- **Opgelost:** lettertypes (DM Sans, Poppins), iconen (Flaticon) en de bibliotheken voor login en QR (supabase-js, qrcodejs) staan nu op de eigen server. Bezoekers maken dus geen verbinding meer met Google Fonts, Flaticon, jsDelivr of cdnjs. Ongebruikte lettertypes zijn van de homepage gehaald.
- **Cookiemelding** (js/consent.js) op alle publieke pagina's:
  - knoppen "Alleen noodzakelijk", "Instellingen" en "Alles accepteren", even prominent
  - categorieën Statistieken en Marketing staan standaard uit en zijn gemarkeerd als "nu niet in gebruik"
  - de keuze geldt 12 maanden
  - scripts die toestemming nodig hebben, laden pas na een opt-in (`type="text/plain" data-consent="stats"`)
- **Nieuwe pagina /cookies/** (cookieverklaring), met in elke footer de links "Cookies" en "Cookie-instellingen".
- **Beslissing:** een cookiemelding is nu wettelijk niet verplicht, want er zijn geen niet-functionele cookies. Hij staat er toch, op verzoek van Ian, en is klaar voor toekomstige statistieken. Hij zegt eerlijk dat er nu niets gevolgd wordt.
- **Privacyverklaring:** Plausible is eruit gehaald, want het draaide niet (keuze Ian). Er is een nieuw artikel 8 "Cookies" met een verwijzing naar /cookies/.
