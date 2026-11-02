import { MAIL_TPL } from './_mail.js';
/* Shared helpers for the Pages Functions: welcome mail + once-only guard.
   Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, BREVO_API_KEY, MAIL_FROM
   Optional: ADMIN_NOTIFY_EMAIL (comma-separated; default admin.alpha.nova@gmail.com) */

/* Emails the internal team the moment a new signup is stored. Fire-and-forget:
   any failure is swallowed so it can never block or fail the signup itself.
   Reuses the same Brevo key/sender as the welcome mail. */
export async function notifyAdmin(env, s) {
  if (!env.BREVO_API_KEY) return;
  const to = String(env.ADMIN_NOTIFY_EMAIL || 'admin.alpha.nova@gmail.com')
    .split(',').map(e => ({ email: e.trim() })).filter(x => x.email);
  if (!to.length) return;
  const esc = v => String(v == null || v === '' ? '—' : v).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const roleLabel = s.rol === 'boekhouder' ? 'Bookkeeper' : 'Entrepreneur';
  const subjectLabel = s.rol === 'boekhouder' ? 'New Boekhouder' : 'New Ondernemer';
  const rows = [
    ['Role', roleLabel], ['Name', s.naam], ['Email', s.email],
    ['Company type', s.bedrijfstype], ['Works with bookkeeper', s.boekhouder],
    ['Phone', s.telefoon], ['City', s.city || s.stad], ['Language', s.taal],
    ['Source', s.source], ['Referral code', s.ref_code], ['Referred by', s.referred_by]
  ].map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#64748B">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('');
  const html = `<div style="font-family:sans-serif;max-width:540px">
<h2 style="margin:0 0 6px">New Sum-IT signup — ${roleLabel}</h2>
<p style="color:#64748B;margin:0 0 14px">A new profile was just created on sum-it.eu.</p>
<table style="font-size:14px;border-collapse:collapse">${rows}</table>
<p style="margin-top:16px"><a href="https://sum-it.eu/beheer.html">Open the admin dashboard →</a></p></div>`;
  const from = env.MAIL_FROM || 'Sum-IT <hallo@sum-it.eu>';
  const fm = from.match(/^(.*)<(.+)>$/) || [null, 'Sum-IT', from];
  const body = {
    sender: { name: fm[1].trim(), email: fm[2].trim() }, to,
    subject: subjectLabel, htmlContent: html
  };
  if (s.email) body.replyTo = { email: s.email, name: s.naam || undefined };
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => {});
}

export function sbHeaders(env, extra = {}) {
  return { apikey: env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
           'Content-Type': 'application/json', ...extra };
}

/* Creates the auth user (e-mail pre-confirmed) and returns a one-click
   set-password link for the welcome mail. Null on any failure. */
export async function createPortalLink(env, email) {
  try {
    await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST', headers: sbHeaders(env),
      body: JSON.stringify({ email, email_confirm: true })
    }).catch(() => {}); // 422 'already exists' is fine
    const r = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST', headers: sbHeaders(env),
      body: JSON.stringify({ type: 'recovery', email })
    });
    if (!r.ok) return null;
    const j = await r.json();
    const hashed = j.hashed_token || (j.properties && j.properties.hashed_token) || null;
    if (!hashed) return null;
    // Link straight to our own page; the token is only redeemed there by JavaScript,
    // so inbox link-scanners cannot burn it and there is no Supabase redirect screen.
    return 'https://sum-it.eu/wachtwoord.html?token_hash=' + encodeURIComponent(hashed) + '&type=recovery';
  } catch { return null; }
}

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

/* Sends the welcome mail via Brevo (no-op without key).
   opts: { naam, refCode, taal, optin }. optin = the visitor ticked the separate mailing box:
   then the full sales mail, otherwise a short confirmation. No queue number is shown. */
export async function sendWelcome(env, email, opts = {}) {
  if (!env.BREVO_API_KEY || !opts.refCode) return;
  const lang = opts.taal === 'en' ? 'en' : 'nl';
  const tpl = MAIL_TPL[lang];
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const first = String(opts.naam || '').trim().split(/\s+/)[0] || (lang === 'en' ? 'there' : 'ondernemer');
  const link = 'https://sum-it.eu/?ref=' + opts.refCode;
  const wa = 'https://wa.me/?text=' + encodeURIComponent(tpl.wa.replace('{CODE}', opts.refCode).replace('{LINK}', link));
  const unsub = 'mailto:hallo@sum-it.eu?subject=' + encodeURIComponent(lang === 'en' ? 'Unsubscribe' : 'Afmelden');
  const html = (opts.optin ? tpl.full : tpl.short)
    .split('{{NAAM}}').join(esc(first)).split('{{CODE}}').join(esc(opts.refCode))
    .split('{{REFLINK}}').join(link).split('{{WA}}').join(esc(wa)).split('{{UNSUB}}').join(esc(unsub));
  const from = env.MAIL_FROM || 'Sum-IT <hallo@sum-it.eu>';
  const fm = from.match(/^(.*)<(.+)>$/) || [null, 'Sum-IT', from];
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: { name: fm[1].trim(), email: fm[2].trim() }, to: [{ email }], subject: tpl.subject, htmlContent: html })
  }).catch(() => {});
}
