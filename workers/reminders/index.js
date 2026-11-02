/* Sum-IT reminder mails — Cloudflare Worker (runs once a day on a cron).
   See README.md (Dutch, plain language) for what it does and how to deploy.

   Each run:
   1. DUE: people with opt-in whose last mail is >= REMINDER_INTERVAL_DAYS ago
      -> send reminder via Brevo -> ONLY after Brevo says OK: reminders_sent+1,
         last_mail_at=now (and mailing_stopped_at=now after the last reminder)
         -> after the last reminder: delete from Laposta, set laposta_removed_at
   2. STOP: people who already had every reminder but were never stopped -> stop
   3. CLEANUP: stopped/unsubscribed people still in Laposta -> delete from Laposta
      (this is the retry for any Laposta failure in step 1 or in /api/afmelden)

   Safety:
   - never mails status 'unsubscribed', mailing_stopped_at set, or no opt-in
     (checked in the database query AND again in logic.js)
   - row update uses a precondition (reminders_sent = old value), so a second
     run cannot count the same mail twice
   - Brevo fails -> row untouched -> tried again tomorrow
   - known gap: Brevo OK but the database update fails -> that person may get
     the same reminder again next run (logged loudly as DB_UPDATE_FAILED)

   Env (wrangler.toml [vars]): SUPABASE_URL, LAPOSTA_LIST_ID, MAIL_FROM, API_BASE
   Secrets: SUPABASE_SERVICE_KEY, BREVO_API_KEY, WEBHOOK_SECRET, LAPOSTA_API_KEY */

import { CONFIG } from './config.js';
import { nextAction, patchAfterSend, dueQuery, stopQuery, cleanupQuery } from './logic.js';
import { reminderMail } from './templates.js';
import { unsubUrl } from './token.js';

function sb(env, extra = {}) {
  return { apikey: env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
           'Content-Type': 'application/json', ...extra };
}

async function sbGet(env, path) {
  const r = await fetch(env.SUPABASE_URL.replace(/\/+$/, '') + path, { headers: sb(env) });
  if (!r.ok) throw new Error('Supabase read failed: ' + r.status + ' ' + (await r.text().catch(() => '')));
  return r.json();
}

/* PATCH one row; `where` is extra PostgREST filters. Returns number of rows changed. */
async function sbPatch(env, id, body, where = '') {
  const r = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/signups?id=eq.${id}${where}`, {
    method: 'PATCH', headers: sb(env, { Prefer: 'return=representation' }), body: JSON.stringify(body)
  });
  if (!r.ok) return 0;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

function sender(env) {
  const from = env.MAIL_FROM || CONFIG.MAIL_FROM;
  const m = from.match(/^(.*)<(.+)>$/);
  return m ? { name: m[1].trim() || 'Sum-IT', email: m[2].trim() } : { name: 'Sum-IT', email: from.trim() };
}

async function sendBrevo(env, row, mail, unsubscribeUrl, reminderNo) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: sender(env),
      replyTo: { email: CONFIG.REPLY_TO, name: CONFIG.REPLY_TO_NAME },
      to: [{ email: row.email, ...(row.naam ? { name: String(row.naam).slice(0, 120) } : {}) }],
      subject: mail.subject, htmlContent: mail.html, textContent: mail.text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${CONFIG.REPLY_TO}?subject=afmelden>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      tags: ['sumit-reminder', 'reminder-' + reminderNo]
    })
  }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
  return r;
}

/* Deletes from Laposta (404 = already gone = fine), then marks laposta_removed_at. */
async function lapostaRemove(env, row) {
  if (!env.LAPOSTA_API_KEY || !env.LAPOSTA_LIST_ID) return false;
  try {
    const r = await fetch('https://api.laposta.nl/v2/member/' + encodeURIComponent(row.email) +
      '?list_id=' + encodeURIComponent(env.LAPOSTA_LIST_ID), {
      method: 'DELETE', headers: { Authorization: 'Basic ' + btoa(env.LAPOSTA_API_KEY + ':') }
    });
    if (!r.ok && r.status !== 404) return false;
    return (await sbPatch(env, row.id, { laposta_removed_at: new Date().toISOString() })) > 0;
  } catch { return false; }
}

export async function runReminders(env, opts = {}) {
  const now = opts.now || new Date();
  const dry = !!opts.dryRun;
  const log = opts.log || ((...a) => console.log(...a));
  for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'BREVO_API_KEY', 'WEBHOOK_SECRET']) {
    if (!env[k]) throw new Error('Missing setting: ' + k);
  }
  const apiBase = env.API_BASE || CONFIG.API_BASE;
  const s = { dryRun: dry, checked: 0, sent: 0, sendFailed: 0, dbUpdateFailed: 0, stopped: 0,
              lapostaRemoved: 0, lapostaFailed: 0, planned: [] };

  // Safety: REMINDER_COUNT 0 would otherwise 'stop' everybody and empty the Laposta list.
  if (!(CONFIG.REMINDER_COUNT >= 1)) { log('REMINDER_COUNT < 1: nothing to do'); return s; }

  // 1) DUE
  const due = await sbGet(env, dueQuery(now));
  for (const row of due) {
    s.checked++;
    const act = nextAction(row, now);
    if (act.type !== 'send') continue;              // double check of the DB filter
    const unsub = await unsubUrl(apiBase, env.WEBHOOK_SECRET, row.email, row.taal);
    const mail = reminderMail({ naam: row.naam, taal: row.taal, reminderNo: act.reminderNo,
      total: act.total, unsubscribeUrl: unsub, registerUrl: CONFIG.APP_REGISTER_URL });
    if (dry) { s.planned.push({ id: row.id, reminder: act.reminderNo, last: act.isLast }); continue; }

    const r = await sendBrevo(env, row, mail, unsub, act.reminderNo);
    if (!r.ok) {
      s.sendFailed++;
      log('SEND_FAILED', row.id, r.status, await r.text().catch(() => ''));
      continue;                                       // row untouched -> retried next run
    }
    s.sent++;
    const changed = await sbPatch(env, row.id, patchAfterSend(row, act, now),
      `&reminders_sent=eq.${Number(row.reminders_sent) || 0}&mailing_stopped_at=is.null`);
    if (!changed) { s.dbUpdateFailed++; log('DB_UPDATE_FAILED', row.id, 'reminder', act.reminderNo); continue; }
    if (act.isLast) {
      s.stopped++;
      if (await lapostaRemove(env, row)) s.lapostaRemoved++;
      else { s.lapostaFailed++; log('LAPOSTA_REMOVE_FAILED', row.id, '(retried next run)'); }
    }
  }

  // 2) STOP (had all reminders already, never stopped)
  const toStop = await sbGet(env, stopQuery());
  for (const row of toStop) {
    if (nextAction(row, now).type !== 'stop') continue;
    if (dry) { s.planned.push({ id: row.id, stop: true }); continue; }
    if (await sbPatch(env, row.id, { mailing_stopped_at: now.toISOString() }, '&mailing_stopped_at=is.null')) s.stopped++;
  }

  // 3) CLEANUP Laposta (retry + people who unsubscribed elsewhere)
  if (env.LAPOSTA_API_KEY && env.LAPOSTA_LIST_ID) {
    const left = await sbGet(env, cleanupQuery());
    for (const row of left) {
      if (dry) { s.planned.push({ id: row.id, lapostaRemove: true }); continue; }
      if (await lapostaRemove(env, row)) s.lapostaRemoved++;
      else { s.lapostaFailed++; log('LAPOSTA_REMOVE_FAILED', row.id, '(retried next run)'); }
    }
  } else {
    log('Laposta not configured: skipping removal from the list');
  }

  log('REMINDERS_DONE', JSON.stringify({ ...s, planned: s.planned.length }));
  return s;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env).catch(e => console.error('REMINDERS_ERROR', e && e.message)));
  },
  // Manual run for testing: https://<worker>/?secret=WEBHOOK_SECRET[&dry=1]
  // dry=1 only lists what WOULD happen (no mails, no database changes).
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.WEBHOOK_SECRET || !safeEqual(url.searchParams.get('secret') || '', env.WEBHOOK_SECRET)) {
      return new Response('Not found', { status: 404 });
    }
    try {
      const s = await runReminders(env, { dryRun: url.searchParams.get('dry') === '1' });
      return new Response(JSON.stringify(s, null, 2), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500,
        headers: { 'Content-Type': 'application/json' } });
    }
  }
};
