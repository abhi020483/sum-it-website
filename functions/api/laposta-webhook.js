/* POST /api/laposta-webhook?secret=... — Laposta event webhook.
   Configure in Laposta: list -> webhooks -> subscribed + unsubscribed events
   to https://sum-it.eu/api/laposta-webhook?secret=YOUR_WEBHOOK_SECRET
   On 'subscribed' (double opt-in confirmed):
     1. confirm_signup(email) -> sets status confirmed + assigns queue position
     2. welcome e-mail via Brevo (position + personal link + portal) if key present
     3. pushes queue_pos + ref_link back into the Laposta member's custom fields
   Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, WEBHOOK_SECRET,
        BREVO_API_KEY (optional), MAIL_FROM (e.g. "Sum-IT <hallo@sum-it.eu>"),
        LAPOSTA_API_KEY, LAPOSTA_LIST_ID */

function sbHeaders(env) {
  return { apikey: env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' };
}

async function parseEvents(request) {
  // Laposta posts either JSON or form-encoded {data: <json>}
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('json')) { const j = await request.json(); return Array.isArray(j) ? j : (j.data || [j]); }
    const form = await request.formData();
    const raw = form.get('data');
    if (raw) { const j = JSON.parse(raw); return Array.isArray(j) ? j : [j]; }
  } catch { /* fall through */ }
  return [];
}

const MAILS = {
  nl: (pos, link) => ({
    subject: `Je staat op plek #${pos} — welkom bij de Founding 500`,
    html: `<div style="font-family:sans-serif;max-width:520px"><h2>Welkom bij Sum-IT!</h2>
<p>Je aanmelding is bevestigd. Jouw plek in de rij: <b style="font-size:22px">#${pos}</b></p>
<p>Dit is jouw persoonlijke link, elke vriend die via jou meedoet telt:</p>
<p><a href="${link}" style="font-size:16px">${link}</a></p>
<p>Bekijk je plek, deel je link en claim je Founding-medaille in je <a href="https://sum-it.eu/portal.html">member-portal</a>.</p>
<p>Samen naar de top,<br>Team Sum-IT</p></div>` }),
  en: (pos, link) => ({
    subject: `You're #${pos} in the queue — welcome to the Founding 500`,
    html: `<div style="font-family:sans-serif;max-width:520px"><h2>Welcome to Sum-IT!</h2>
<p>Your signup is confirmed. Your spot in the queue: <b style="font-size:22px">#${pos}</b></p>
<p>This is your personal link, every friend who joins through it counts:</p>
<p><a href="${link}" style="font-size:16px">${link}</a></p>
<p>See your spot, share your link and claim your Founding medal in your <a href="https://sum-it.eu/portal.html">member portal</a>.</p>
<p>Together to the top,<br>Team Sum-IT</p></div>` })
};

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (!env.WEBHOOK_SECRET || url.searchParams.get('secret') !== env.WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const events = await parseEvents(request);
  for (const ev of events) {
    const type = ev.event || ev.type || '';
    const m = (ev.data && (ev.data.member || ev.data)) || ev.member || {};
    const email = m.email || ev.email || '';
    if (!email) continue;

    if (type === 'subscribed') {
      // 1) confirm + queue position
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/confirm_signup`, {
        method: 'POST', headers: sbHeaders(env), body: JSON.stringify({ p_email: email.toLowerCase() })
      });
      const row = r.ok ? await r.json().catch(() => null) : null; // {queue_pos, ref_code, taal}
      if (row && row.queue_pos) {
        const link = 'https://sum-it.eu/?ref=' + row.ref_code;
        // 2) welcome mail (Brevo)
        if (env.BREVO_API_KEY) {
          const m = (MAILS[row.taal] || MAILS.nl)(row.queue_pos, link);
          const from = env.MAIL_FROM || 'Sum-IT <hallo@sum-it.eu>';
          const fm = from.match(/^(.*)<(.+)>$/) || [null, 'Sum-IT', from];
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: { name: fm[1].trim(), email: fm[2].trim() }, to: [{ email }], subject: m.subject, htmlContent: m.html })
          }).catch(() => {});
        }
        // 3) write position + link back to Laposta custom fields
        if (env.LAPOSTA_API_KEY && env.LAPOSTA_LIST_ID) {
          const body = new URLSearchParams({
            list_id: env.LAPOSTA_LIST_ID,
            'custom_fields[queuepos]': String(row.queue_pos),
            'custom_fields[reflink]': link
          });
          await fetch('https://api.laposta.nl/v2/member/' + encodeURIComponent(email) + '?list_id=' + env.LAPOSTA_LIST_ID, {
            method: 'POST',
            headers: { Authorization: 'Basic ' + btoa(env.LAPOSTA_API_KEY + ':'), 'Content-Type': 'application/x-www-form-urlencoded' },
            body
          }).catch(() => {});
        }
      }
    } else if (type === 'deactivated' || type === 'unsubscribed') {
      await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/unsubscribe_signup`, {
        method: 'POST', headers: sbHeaders(env), body: JSON.stringify({ p_email: email.toLowerCase() })
      }).catch(() => {});
    }
  }
  return new Response('ok');
}
