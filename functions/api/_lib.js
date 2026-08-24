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

const BTN = 'display:inline-block;background:#00BC7D;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:99px;margin:6px 0';
export const MAILS = {
  nl: (pos, link, setup) => ({
    subject: `Je staat op plek #${pos} — welkom bij de Founding 500`,
    html: `<div style="font-family:sans-serif;max-width:520px"><h2>Welkom bij Sum-IT!</h2>
<p>Je aanmelding is bevestigd. Jouw plek in de rij: <b style="font-size:22px">#${pos}</b></p>
${setup ? `<p><a href="${setup}" style="${BTN}">Stel je wachtwoord in &amp; open je member-portal →</a><br>
<span style="font-size:12px;color:#64748B">Eén klik: je e-mailadres is daarmee meteen bevestigd. Link verlopen? Gebruik "wachtwoord vergeten" op <a href="https://sum-it.eu/login.html">de loginpagina</a>.</span></p>` : `<p>Bekijk je plek in je <a href="https://sum-it.eu/portal.html">member-portal</a>.</p>`}
<p>Dit is jouw persoonlijke link, elke vriend die via jou meedoet telt:</p>
<p><a href="${link}" style="font-size:16px">${link}</a></p>
<p>Samen naar de top,<br>Team Sum-IT</p></div>` }),
  en: (pos, link, setup) => ({
    subject: `You're #${pos} in the queue — welcome to the Founding 500`,
    html: `<div style="font-family:sans-serif;max-width:520px"><h2>Welcome to Sum-IT!</h2>
<p>Your signup is confirmed. Your spot in the queue: <b style="font-size:22px">#${pos}</b></p>
${setup ? `<p><a href="${setup}" style="${BTN}">Set your password &amp; open your member portal →</a><br>
<span style="font-size:12px;color:#64748B">One click: this also confirms your e-mail address. Link expired? Use "forgot password" on <a href="https://sum-it.eu/login.html">the login page</a>.</span></p>` : `<p>See your spot in your <a href="https://sum-it.eu/portal.html">member portal</a>.</p>`}
<p>This is your personal link, every friend who joins through it counts:</p>
<p><a href="${link}" style="font-size:16px">${link}</a></p>
<p>Together to the top,<br>Team Sum-IT</p></div>` })
};

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

/* Sends the welcome mail via Brevo (no-op without key). */
export async function sendWelcome(env, email, pos, refCode, taal) {
  if (!env.BREVO_API_KEY || !pos) return;
  const offset = Number(env.DISPLAY_OFFSET ?? 143);
  const link = 'https://sum-it.eu/?ref=' + refCode;
  const setup = await createPortalLink(env, email);
  const m = (MAILS[taal] || MAILS.nl)(pos + offset, link, setup);
  const from = env.MAIL_FROM || 'Sum-IT <hallo@sum-it.eu>';
  const fm = from.match(/^(.*)<(.+)>$/) || [null, 'Sum-IT', from];
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: { name: fm[1].trim(), email: fm[2].trim() }, to: [{ email }], subject: m.subject, htmlContent: m.html })
  }).catch(() => {});
}
