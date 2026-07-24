/* Shared helpers for the Pages Functions: welcome mail + once-only guard.
   Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, BREVO_API_KEY, MAIL_FROM */

export function sbHeaders(env, extra = {}) {
  return { apikey: env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
           'Content-Type': 'application/json', ...extra };
}

export const MAILS = {
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

/* Returns true exactly once per confirmed signup (guards double welcome mails). */
export async function markWelcomed(env, email) {
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mark_welcomed`, {
      method: 'POST', headers: sbHeaders(env), body: JSON.stringify({ p_email: email.toLowerCase() })
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch { return false; }
}

/* Sends the welcome mail via Brevo (no-op without key). */
export async function sendWelcome(env, email, pos, refCode, taal) {
  if (!env.BREVO_API_KEY || !pos) return;
  const offset = Number(env.DISPLAY_OFFSET ?? 143);
  const link = 'https://sum-it.eu/?ref=' + refCode;
  const m = (MAILS[taal] || MAILS.nl)(pos + offset, link);
  const from = env.MAIL_FROM || 'Sum-IT <hallo@sum-it.eu>';
  const fm = from.match(/^(.*)<(.+)>$/) || [null, 'Sum-IT', from];
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: { name: fm[1].trim(), email: fm[2].trim() }, to: [{ email }], subject: m.subject, htmlContent: m.html })
  }).catch(() => {});
}
