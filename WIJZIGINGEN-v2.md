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
