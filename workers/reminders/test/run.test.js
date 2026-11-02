/* End-to-end dry run of the daily job with a fake fetch (no network). */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { runReminders } from '../index.js';
import { unsubToken } from '../token.js';
import { unsubToken as libToken } from '../../../functions/api/_lib.js';

const NOW = new Date('2026-03-15T08:17:00Z');
const DAY = 24 * 3600 * 1000;
const ago = d => new Date(NOW.getTime() - d * DAY).toISOString();
const ENV = {
  SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'svc', BREVO_API_KEY: 'brevo',
  WEBHOOK_SECRET: 's3cret', LAPOSTA_API_KEY: 'lp', LAPOSTA_LIST_ID: 'LIST1',
  MAIL_FROM: 'Ian van Sum-IT <ian.bouman@sum-it.eu>', API_BASE: 'https://api.test'
};
// 3 fake rows: A due for reminder 1, B due for reminder 2 (last), C stopped earlier but still in Laposta
const ROWS = {
  A: { id: 11, email: 'a@example.nl', naam: 'Anna Bakker', taal: 'nl', status: 'confirmed', mailing_optin: true,
       reminders_sent: 0, last_mail_at: ago(31), welcomed_at: ago(31), created_at: ago(31), mailing_stopped_at: null, laposta_removed_at: null,
       optin_confirmed_at: ago(31) },
  B: { id: 12, email: 'b@example.com', naam: 'Ben', taal: 'en', status: 'confirmed', mailing_optin: true,
       reminders_sent: 1, last_mail_at: ago(30), welcomed_at: ago(60), created_at: ago(60), mailing_stopped_at: null, laposta_removed_at: null,
       optin_confirmed_at: ago(60) },
  C: { id: 13, email: 'c@example.nl' }
};

let calls, realFetch, brevoStatus, lapostaStatus;
const res = (status, body) => new Response(body === undefined ? '' : JSON.stringify(body), { status });

beforeEach(() => {
  calls = []; brevoStatus = 201; lapostaStatus = 200;
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url); const method = init.method || 'GET';
    calls.push({ url: u, method, body: init.body, headers: init.headers });
    if (u.startsWith('https://db.test/rest/v1/signups') && method === 'GET') {
      const q = decodeURIComponent(u);
      if (q.includes('reminders_sent=lt.')) return res(200, [ROWS.A, ROWS.B]);
      if (q.includes('reminders_sent=gte.')) return res(200, []);
      if (q.includes('laposta_removed_at=is.null')) {
        // B is removed during this run already, so only C is left
        return res(200, [ROWS.C]);
      }
    }
    if (u.startsWith('https://db.test/rest/v1/signups') && method === 'PATCH') return res(200, [{ id: 1 }]);
    if (u === 'https://api.brevo.com/v3/smtp/email') return res(brevoStatus, { messageId: 'x' });
    if (u.startsWith('https://api.laposta.nl/v2/member/')) return res(lapostaStatus, {});
    return res(500, { unexpected: u });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const quiet = () => {};

test('token in the Worker equals the token checked by /api/afmelden', async () => {
  for (const e of ['a@example.nl', 'Mixed.Case+tag@Example.COM']) {
    assert.equal(await unsubToken('s3cret', e), await libToken('s3cret', e));
  }
  assert.notEqual(await unsubToken('s3cret', 'a@example.nl'), await unsubToken('other', 'a@example.nl'));
});

test('daily run with 3 rows: 2 mails, correct DB updates, 2 Laposta removals', async () => {
  const s = await runReminders(ENV, { now: NOW, log: quiet });
  assert.equal(s.sent, 2); assert.equal(s.sendFailed, 0); assert.equal(s.stopped, 1);
  assert.equal(s.lapostaRemoved, 2); assert.equal(s.lapostaFailed, 0);

  const brevo = calls.filter(c => c.url.includes('brevo'));
  assert.equal(brevo.length, 2);
  const mA = JSON.parse(brevo[0].body), mB = JSON.parse(brevo[1].body);
  assert.deepEqual(mA.to, [{ email: 'a@example.nl', name: 'Anna Bakker' }]);
  assert.equal(mA.replyTo.email, 'ian.bouman@sum-it.eu');
  assert.match(mA.textContent, /Hoi Anna,/);
  assert.match(mA.textContent, /Dit is herinnering 1 van 2\./);
  const tokA = await unsubToken('s3cret', 'a@example.nl');
  assert.ok(mA.textContent.includes(`https://api.test/api/afmelden?e=a%40example.nl&t=${tokA}`));
  assert.ok(mA.headers['List-Unsubscribe'].includes('https://api.test/api/afmelden'));
  assert.equal(mA.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  assert.match(mB.textContent, /Hi Ben,/);
  assert.match(mB.textContent, /This is reminder 2 of 2\. After this we will not e-mail you again\./);
  assert.ok(mB.textContent.includes('&l=en'));

  const patches = calls.filter(c => c.method === 'PATCH');
  const pA = patches.find(p => p.url.includes('id=eq.11'));
  assert.ok(pA.url.includes('reminders_sent=eq.0') && pA.url.includes('mailing_stopped_at=is.null'));
  assert.deepEqual(JSON.parse(pA.body), { reminders_sent: 1, last_mail_at: NOW.toISOString() });
  const pB = patches.filter(p => p.url.includes('id=eq.12'));
  assert.deepEqual(JSON.parse(pB[0].body), { reminders_sent: 2, last_mail_at: NOW.toISOString(), mailing_stopped_at: NOW.toISOString() });
  assert.ok('laposta_removed_at' in JSON.parse(pB[1].body));
  const pC = patches.find(p => p.url.includes('id=eq.13'));
  assert.ok('laposta_removed_at' in JSON.parse(pC.body));

  const lap = calls.filter(c => c.url.startsWith('https://api.laposta.nl'));
  assert.deepEqual(lap.map(c => [c.method, c.url]), [
    ['DELETE', 'https://api.laposta.nl/v2/member/b%40example.com?list_id=LIST1'],
    ['DELETE', 'https://api.laposta.nl/v2/member/c%40example.nl?list_id=LIST1']
  ]);
  // A (reminder 1) is NOT removed from Laposta
  assert.ok(!lap.some(c => c.url.includes('a%40example.nl')));
});

test('Brevo fails -> no database update, no Laposta removal for that mail', async () => {
  brevoStatus = 500;
  const s = await runReminders(ENV, { now: NOW, log: quiet });
  assert.equal(s.sent, 0); assert.equal(s.sendFailed, 2);
  assert.ok(!calls.some(c => c.method === 'PATCH' && (c.url.includes('id=eq.11') || c.url.includes('id=eq.12'))));
  assert.ok(!calls.some(c => c.url.includes('b%40example.com')));
});

test('Laposta fails -> row stays stopped, laposta_removed_at not set (retried next run)', async () => {
  lapostaStatus = 503;
  const s = await runReminders(ENV, { now: NOW, log: quiet });
  assert.equal(s.sent, 2); assert.equal(s.lapostaFailed, 2); assert.equal(s.lapostaRemoved, 0);
  assert.ok(!calls.some(c => c.method === 'PATCH' && c.body.includes('laposta_removed_at')));
});

test('Laposta 404 (already gone) counts as removed', async () => {
  lapostaStatus = 404;
  const s = await runReminders(ENV, { now: NOW, log: quiet });
  assert.equal(s.lapostaRemoved, 2);
});

test('dry run sends nothing and changes nothing', async () => {
  const s = await runReminders(ENV, { now: NOW, dryRun: true, log: quiet });
  assert.equal(s.planned.length, 3);
  assert.ok(!calls.some(c => c.method !== 'GET'));
});

test('a row that is not opted in never gets mailed, even if the DB returned it', async () => {
  const saved = ROWS.A.mailing_optin; ROWS.A.mailing_optin = false;
  try {
    const s = await runReminders(ENV, { now: NOW, log: quiet });
    assert.equal(s.sent, 1);
    assert.ok(!calls.some(c => c.url.includes('brevo') && c.body.includes('a@example.nl')));
  } finally { ROWS.A.mailing_optin = saved; }
});

test('manual trigger: wrong secret -> 404, right secret + dry=1 -> summary', async () => {
  const bad = await worker.fetch(new Request('https://w.test/?secret=nope'), ENV);
  assert.equal(bad.status, 404);
  const ok = await worker.fetch(new Request('https://w.test/?secret=s3cret&dry=1'), ENV);
  assert.equal(ok.status, 200);
  const j = await ok.json();
  assert.equal(j.dryRun, true);
  assert.ok(!calls.some(c => c.method !== 'GET'));
});

test('missing settings -> clear error, nothing sent', async () => {
  await assert.rejects(runReminders({ ...ENV, BREVO_API_KEY: '' }, { now: NOW, log: quiet }), /BREVO_API_KEY/);
  assert.equal(calls.length, 0);
});

test('REMINDER_COUNT 0 (emergency stop) -> no mails, nobody stopped or removed', async () => {
  const { CONFIG } = await import('../config.js');
  const saved = CONFIG.REMINDER_COUNT; CONFIG.REMINDER_COUNT = 0;
  try {
    const s = await runReminders(ENV, { now: NOW, log: quiet });
    assert.equal(s.sent, 0);
    assert.equal(calls.length, 0);
  } finally { CONFIG.REMINDER_COUNT = saved; }
});

test('REVIEW: a row without double opt-in is never mailed, even if the DB returned it', async () => {
  const saved = ROWS.B.optin_confirmed_at; ROWS.B.optin_confirmed_at = null;
  try {
    const s = await runReminders(ENV, { now: NOW, log: quiet });
    assert.equal(s.sent, 1);
    assert.ok(!calls.some(c => c.url.includes('brevo') && c.body.includes('b@example.com')));
  } finally { ROWS.B.optin_confirmed_at = saved; }
});

test('REVIEW: Brevo payload shape + no secrets in logs', async () => {
  const logs = [];
  await runReminders(ENV, { now: NOW, log: (...a) => logs.push(a.join(' ')) });
  const m = JSON.parse(calls.find(c => c.url.includes('brevo')).body);
  assert.deepEqual(m.sender, { name: 'Ian van Sum-IT', email: 'ian.bouman@sum-it.eu' });
  assert.equal(m.replyTo.email, 'ian.bouman@sum-it.eu');
  assert.equal(m.to[0].email, 'a@example.nl');
  for (const k of ['subject', 'htmlContent', 'textContent']) assert.ok(m[k] && m[k].length > 5, k);
  assert.match(m.headers['List-Unsubscribe'], /^<https:\/\/api\.test\/api\/afmelden\?e=a%40example\.nl&t=[\w-]{43}>/);
  assert.equal(m.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  assert.match(m.textContent, /herinnering 1 van 2/);
  assert.doesNotMatch(m.htmlContent + m.textContent, /€\s?11/);
  for (const l of logs) for (const sec of ['svc', 'brevo', 's3cret', 'lp']) assert.ok(!l.includes('"' + sec) && !l.includes(' ' + sec + ' '), l);
});
