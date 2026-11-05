/* GET or POST /api/afmelden?e=<email>&t=<token>[&l=en] — one-click unsubscribe (v5).
   Used by the link + List-Unsubscribe header in every reminder mail.
   - token = HMAC(WEBHOOK_SECRET, e-mail), see unsubToken() in _lib.js; without
     a valid token nothing happens (nobody can unsubscribe someone else)
   - valid: unsubscribe_signup(email) -> status 'unsubscribed' + mailing_stopped_at,
     then delete from the Laposta list (if that fails, the reminder Worker retries daily)
   - the row and e-mail stay in Supabase; we just never mail them again
   - same page whether or not the e-mail exists (no enumeration)
   POST is supported for mail clients that do RFC 8058 one-click (List-Unsubscribe-Post).
   Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, WEBHOOK_SECRET, LAPOSTA_API_KEY, LAPOSTA_LIST_ID */

import { sbHeaders, unsubToken, lapostaRemove } from './_lib.js';

const TXT = {
  nl: { ok: 'Je bent afgemeld', okP: 'We sturen je geen herinneringsmails meer. Je hoeft verder niets te doen.',
        bad: 'Deze link werkt niet', badP: 'De afmeldlink is onvolledig of ongeldig. Mail ons gerust op <a href="mailto:ian.bouman@sum-it.eu">ian.bouman@sum-it.eu</a>, dan melden we je met de hand af.',
        home: 'Naar sum-it.eu' },
  en: { ok: 'You are unsubscribed', okP: 'We will not send you any more reminder mails. There is nothing else you need to do.',
        bad: 'This link does not work', badP: 'The unsubscribe link is incomplete or invalid. Just e-mail <a href="mailto:ian.bouman@sum-it.eu">ian.bouman@sum-it.eu</a> and we will unsubscribe you by hand.',
        home: 'Go to sum-it.eu' }
};

function page(lang, good) {
  const t = TXT[lang] || TXT.nl;
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Sum-IT</title></head>
<body style="margin:0;background:#eef0f5;font-family:Arial,Helvetica,sans-serif;color:#3a3a55">
<div style="max-width:520px;margin:48px auto;padding:0 16px">
<div style="background:#fff;border-radius:16px;padding:32px">
<h1 style="margin:0 0 12px;font-size:24px;color:#1b1b4a">${good ? t.ok : t.bad}</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.55">${good ? t.okP : t.badP}</p>
<a href="https://sum-it.eu/" style="color:#00BC7D;font-weight:bold;text-decoration:none">${t.home} &rarr;</a>
</div></div></body></html>`;
  return new Response(html, { status: good ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

async function handle({ request, env }) {
  const url = new URL(request.url);
  const lang = url.searchParams.get('l') === 'en' ? 'en' : 'nl';
  const email = String(url.searchParams.get('e') || '').trim().toLowerCase();
  const token = String(url.searchParams.get('t') || '');
  if (!env.WEBHOOK_SECRET || !email || !token) return page(lang, false);
  if (!safeEqual(token, await unsubToken(env.WEBHOOK_SECRET, email))) return page(lang, false);
  let saved = false;
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/unsubscribe_signup`, {
      method: 'POST', headers: sbHeaders(env), body: JSON.stringify({ p_email: email })
    });
    saved = r.ok;
  } catch { /* handled below */ }
  // Never claim success we could not store: ask them to mail us instead.
  if (!saved) return page(lang, false);
  await lapostaRemove(env, email); // best-effort; Worker retries if it failed
  return page(lang, true);
}

export const onRequestGet = handle;
export const onRequestPost = handle;
