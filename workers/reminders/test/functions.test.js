/* Checks the Pages Functions changed for the reminders (signup opt-in/phone,
   /api/afmelden, Laposta webhook) with a fake fetch — no network. */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as signup } from '../../../functions/api/signup.js';
import { onRequestGet as afmeldenGet, onRequestPost as afmeldenPost } from '../../../functions/api/afmelden.js';
import { onRequestPost as webhook } from '../../../functions/api/laposta-webhook.js';
import { unsubToken } from '../token.js';

const ENV = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'svc', IP_SALT: 'x', BREVO_API_KEY: 'brevo',
  WEBHOOK_SECRET: 's3cret', LAPOSTA_API_KEY: 'lp', LAPOSTA_LIST_ID: 'LIST1' };
let calls, realFetch, rpcOk;
const res = (status, body) => new Response(body === undefined || status === 204 ? null : JSON.stringify(body), { status });

beforeEach(() => {
  calls = []; rpcOk = true; realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url), method = init.method || 'GET';
    calls.push({ url: u, method, body: init.body });
    if (u.includes('/rest/v1/signups?ip_hash')) return new Response('[]', { status: 200, headers: { 'content-range': '0-0/0' } });
    if (u.includes('/rest/v1/signups?on_conflict=email')) return res(201, [{ id: 1 }]);
    if (u.includes('/rpc/confirm_signup')) return res(200, [{ queue_pos: 7, ref_code: 'ABCDEF', taal: 'nl' }]);
    if (u.includes('/rpc/mark_welcomed')) return res(200, true);
    if (u.includes('/rpc/')) return res(rpcOk ? 204 : 500);
    if (u.includes('/auth/v1/')) return res(200, {});
    if (u.includes('/rest/v1/signups') && method === 'PATCH') return res(204);
    if (u.includes('brevo')) return res(201, {});
    if (u.includes('laposta')) return res(200, {});
    return res(500);
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const post = body => ({ request: new Request('https://api.test/api/signup', { method: 'POST',
  headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '1.2.3.4' }, body: JSON.stringify(body) }), env: ENV });
const inserted = () => JSON.parse(calls.find(c => c.url.includes('on_conflict=email')).body);

test('homepage-lead: herinneringen true -> mailing_optin true, phone stored', async () => {
  const r = await signup(post({ naam: 'Jan', email: 'jan@example.nl', telefoon: '06 12345678', source: 'homepage-lead', herinneringen: true }));
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(inserted().mailing_optin, true);
  assert.equal(inserted().telefoon, '06 12345678');
  assert.equal(inserted().source, 'homepage-lead');
});

test('homepage-lead: herinneringen false -> no reminders', async () => {
  await signup(post({ naam: 'Jan', email: 'jan2@example.nl', telefoon: '+31 6 1234 5678', source: 'homepage-lead', herinneringen: false }));
  assert.equal(inserted().mailing_optin, false);
});

test('homepage-lead without (enough) phone -> 400, nothing stored', async () => {
  for (const tel of [undefined, '', '12-34']) {
    calls = [];
    const r = await signup(post({ naam: 'Jan', email: 'jan3@example.nl', telefoon: tel, source: 'homepage-lead', herinneringen: true }));
    assert.equal(r.status, 400);
    assert.ok(!calls.some(c => c.url.includes('on_conflict')));
  }
});

test('existing founding form: mailing_optin box -> opt-in; unticked -> none; phone not required', async () => {
  await signup(post({ naam: 'A', email: 'a1@example.nl', source: 'site-founding500-v22', mailing_optin: true }));
  assert.equal(inserted().mailing_optin, true);
  calls = [];
  await signup(post({ naam: 'A', email: 'a2@example.nl', source: 'site-founding500-v22', mailing_optin: false }));
  assert.equal(inserted().mailing_optin, false);
  calls = [];
  await signup(post({ naam: 'A', email: 'a3@example.nl', source: 'site', mailing_optin: 'false' }));
  assert.equal(inserted().mailing_optin, false);
});

test('existing balie form (mandatory consent box, not sent) -> opt-in', async () => {
  await signup(post({ naam: 'B', email: 'b1@example.nl', telefoon: '', source: 'balie-tu-breda' }));
  assert.equal(inserted().mailing_optin, true);
});

test('welcome mail sent -> last_mail_at recorded', async () => {
  await signup(post({ naam: 'C', email: 'c1@example.nl', source: 'site', mailing_optin: true }));
  const p = calls.find(c => c.method === 'PATCH' && c.url.includes('email=eq.c1%40example.nl'));
  assert.ok(p && 'last_mail_at' in JSON.parse(p.body));
});

test('honeypot still silently OK and stores nothing', async () => {
  const r = await signup(post({ naam: 'X', email: 'x@example.nl', website: 'spam', source: 'homepage-lead' }));
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(calls.length, 0);
});

const unsubReq = (e, t, method = 'GET') => ({ request: new Request(
  `https://api.test/api/afmelden?e=${encodeURIComponent(e)}&t=${t}`, { method }), env: ENV });

test('/api/afmelden: valid token -> unsubscribe + Laposta delete + laposta_removed_at', async () => {
  const t = await unsubToken('s3cret', 'jan@example.nl');
  const r = await afmeldenGet(unsubReq('jan@example.nl', t));
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Je bent afgemeld/);
  assert.ok(calls.some(c => c.url.endsWith('/rpc/unsubscribe_signup') && JSON.parse(c.body).p_email === 'jan@example.nl'));
  assert.ok(calls.some(c => c.method === 'DELETE' && c.url.includes('jan%40example.nl')));
  assert.ok(calls.some(c => c.method === 'PATCH' && c.body.includes('laposta_removed_at')));
});

test('/api/afmelden: POST (one-click from mail client) works too, other e-mail', async () => {
  const t = await unsubToken('s3cret', 'eva@example.com');
  const r = await afmeldenPost(unsubReq('eva@example.com', t, 'POST'));
  assert.equal(r.status, 200);
});

test('/api/afmelden: wrong token or token of someone else -> nothing happens', async () => {
  const other = await unsubToken('s3cret', 'someone@else.nl');
  for (const t of ['bad', other, '']) {
    calls = [];
    const r = await afmeldenGet(unsubReq('jan@example.nl', t));
    assert.equal(r.status, 400);
    assert.equal(calls.length, 0);
  }
});

test('/api/afmelden: database down -> no false "you are unsubscribed"', async () => {
  rpcOk = false;
  const t = await unsubToken('s3cret', 'jan@example.nl');
  const r = await afmeldenGet(unsubReq('jan@example.nl', t));
  assert.equal(r.status, 400);
  assert.match(await r.text(), /ian\.bouman@sum-it\.eu/);
});

const hook = events => ({ request: new Request('https://api.test/api/laposta-webhook?secret=s3cret', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: events }) }), env: ENV });

test('Laposta webhook: deleted -> stop_mailing (status kept); unsubscribed -> unsubscribe_signup', async () => {
  await webhook(hook([{ type: 'member', event: 'deactivated', data: { email: 'D@example.nl' }, info: { action: 'deleted' } }]));
  assert.ok(calls.some(c => c.url.endsWith('/rpc/stop_mailing') && JSON.parse(c.body).p_email === 'd@example.nl'));
  assert.ok(!calls.some(c => c.url.endsWith('/rpc/unsubscribe_signup')));
  calls = [];
  await webhook(hook([{ type: 'member', event: 'deactivated', data: { email: 'e@example.nl' }, info: { action: 'unsubscribed' } }]));
  assert.ok(calls.some(c => c.url.endsWith('/rpc/unsubscribe_signup')));
  calls = [];
  await webhook(hook([{ type: 'member', event: 'deactivated', data: { email: 'f@example.nl' } }])); // unknown reason -> safe side
  assert.ok(calls.some(c => c.url.endsWith('/rpc/unsubscribe_signup')));
});
