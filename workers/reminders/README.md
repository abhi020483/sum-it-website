# Herinneringsmails Sum-IT (Cloudflare Worker)

## Wat doet dit?

Een klein programmaatje dat **elke dag om 08:17 UTC** (09:17 of 10:17 Nederlandse tijd) vanzelf draait:

1. Het zoekt mensen die:
   - **zelf hebben aangevinkt** dat ze mails willen (`mailing_optin` = ja),
   - zich niet hebben afgemeld,
   - en wiens laatste mail van ons **30 dagen of langer** geleden is.
2. Die mensen krijgen een herinneringsmail van "Ian" (via Brevo). Antwoorden komen bij ian.bouman@sum-it.eu.
3. Iedereen krijgt **maximaal 2 herinneringen**: de eerste 30 dagen na de welkomstmail, de tweede 30 dagen daarna.
4. Na de laatste herinnering (of als iemand zich afmeldt) wordt de persoon **uit de Laposta-lijst gehaald**. In Supabase blijft de aanmelding met het e-mailadres gewoon staan, met een datum in `mailing_stopped_at`. Die persoon krijgt daarna nooit meer mail.
5. Elke mail heeft een **afmeldlink**. Eén klik is genoeg.

Maximaal 50 mails per dag. De rest komt de dag erna aan de beurt.

## Wat kun je zelf aanpassen?

| Wat | Waar |
|---|---|
| Aantal herinneringen (nu 2) | `config.js` → `REMINDER_COUNT` |
| Dagen ertussen (nu 30) | `config.js` → `REMINDER_INTERVAL_DAYS` |
| Max. mails per dag (nu 50) | `config.js` → `BATCH_LIMIT` |
| Link van de knop "Maak je account aan" | `config.js` → `APP_REGISTER_URL` |
| Teksten van de mail (NL en EN) | `templates.js` → bovenaan, het blok `TEXTS` |
| Tijdstip | `wrangler.toml` → `crons` |

Na een wijziging: test draaien (zie onder) en opnieuw deployen.

## Eenmalig instellen

Volgorde is belangrijk: **eerst de database, dan deze worker, dan de website-functies.**

1. **Database:** draai `supabase-setup-v5.sql` in Supabase (SQL Editor → plakken → Run).
2. Open `wrangler.toml` en vul in:
   - `SUPABASE_URL` = dezelfde als in het Cloudflare Pages-project (bijv. `https://xxxx.supabase.co`)
   - `LAPOSTA_LIST_ID` = dezelfde als in het Pages-project
3. Open een terminal in deze map (`workers/reminders`) en log in bij Cloudflare:
   ```
   npx wrangler login
   ```
4. Zet de geheime sleutels (je krijgt telkens een vraag om de waarde te plakken). Gebruik **dezelfde waarden** als in het Pages-project `sum-it-app`:
   ```
   npx wrangler secret put SUPABASE_SERVICE_KEY
   npx wrangler secret put BREVO_API_KEY
   npx wrangler secret put WEBHOOK_SECRET
   npx wrangler secret put LAPOSTA_API_KEY
   ```
   Let op: `WEBHOOK_SECRET` moet echt hetzelfde zijn als in Pages, anders werkt de afmeldlink niet.
5. Deployen:
   ```
   npx wrangler deploy
   ```
   Je krijgt een adres terug, zoiets als `https://sum-it-reminders.<jouw-naam>.workers.dev`.

## Testen

**Zonder internet, op je eigen computer** (controleert de rekenregels en de mails):
```
node --test
```
Alles moet `pass` zijn.

**Proefrun op de echte database, zonder iets te versturen:**
open in je browser
```
https://sum-it-reminders.<jouw-naam>.workers.dev/?secret=JOUW_WEBHOOK_SECRET&dry=1
```
Je ziet dan hoeveel mensen een mail **zouden** krijgen (`planned`). Er wordt niets verstuurd en niets veranderd.

**Echte run met de hand** (verstuurt wél mails, alleen naar wie aan de beurt is):
zelfde adres zonder `&dry=1`.

**Mail zelf bekijken:** zet in Supabase bij je eigen testaanmelding `mailing_optin` op true en `last_mail_at` op een datum van meer dan 30 dagen geleden, en doe een echte run.

**Logboek:** Cloudflare dashboard → Workers → sum-it-reminders → Logs. Zoek op `SEND_FAILED`, `DB_UPDATE_FAILED` of `LAPOSTA_REMOVE_FAILED`.

## Wat als er iets misgaat?

- **Brevo doet het niet:** er verandert niets in de database; de persoon komt de volgende dag opnieuw aan de beurt.
- **Laposta doet het niet:** de persoon krijgt toch geen mails meer (staat op "gestopt"); het weghalen uit Laposta wordt elke dag opnieuw geprobeerd.
- **Mail verstuurd, maar database-update mislukt (`DB_UPDATE_FAILED`):** dan kan die persoon dezelfde herinnering morgen nog een keer krijgen. Zeldzaam; check dan even die rij in Supabase.
- **Stoppen met alles:** Cloudflare dashboard → Workers → sum-it-reminders → Settings → Triggers → de cron-trigger verwijderen. (`REMINDER_COUNT` op 0 zetten kan ook: dan doet de worker niets meer.)
