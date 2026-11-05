import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAction, anchorOf, patchAfterSend, dueQuery, stopQuery, cleanupQuery } from '../logic.js';
import { CONFIG } from '../config.js';
import { reminderMail, firstName } from '../templates.js';

const DAY = 24 * 3600 * 1000;
const T0 = new Date('2026-01-10T09:00:00Z');                 // welcome mail moment
const at = days => new Date(T0.getTime() + days * DAY);
const base = (o = {}) => ({
  id: 1, email: 'jan@example.nl', naam: 'Jan de Vries', taal: 'nl', status: 'confirmed',
  mailing_optin: true, reminders_sent: 0, last_mail_at: T0.toISOString(),
  welcomed_at: T0.toISOString(), created_at: T0.toISOString(), mailing_stopped_at: null,
  optin_confirmed_at: T0.toISOString(), ...o
});

test('config: 2 reminders, 30 days apart (the decided values)', () => {
  assert.equal(CONFIG.REMINDER_COUNT, 2);
  assert.equal(CONFIG.REMINDER_INTERVAL_DAYS, 30);
  assert.equal(CONFIG.BATCH_LIMIT, 50);
});

test('not opted in -> nothing, even long overdue', () => {
  assert.equal(nextAction(base({ mailing_optin: false }), at(400)).type, 'none');
  assert.equal(nextAction(base({ mailing_optin: null }), at(400)).type, 'none');
});

test('opted in, day 29 -> nothing', () => {
  assert.deepEqual(nextAction(base(), at(29)), { type: 'none', reason: 'not due yet' });
  // one second before the 30 days are over: still nothing
  assert.equal(nextAction(base(), new Date(at(30).getTime() - 1000)).type, 'none');
});

test('opted in, day 30 -> reminder 1 (not the last)', () => {
  assert.deepEqual(nextAction(base(), at(30)), { type: 'send', reminderNo: 1, total: 2, isLast: false });
});

test('after reminder 1: +29 days nothing, +30 days reminder 2 and stop', () => {
  const now1 = at(30);
  const after1 = base({ ...patchAfterSend(base(), nextAction(base(), now1), now1) });
  assert.equal(after1.reminders_sent, 1);
  assert.equal(after1.mailing_stopped_at, null);
  assert.equal(nextAction(after1, at(59)).type, 'none');
  const a2 = nextAction(after1, at(60));
  assert.deepEqual(a2, { type: 'send', reminderNo: 2, total: 2, isLast: true });
  const p2 = patchAfterSend(after1, a2, at(60));
  assert.equal(p2.reminders_sent, 2);
  assert.equal(p2.mailing_stopped_at, at(60).toISOString());
  // and after that: never again
  assert.equal(nextAction({ ...after1, ...p2 }, at(400)).type, 'none');
});

test('unsubscribed -> nothing', () => {
  assert.equal(nextAction(base({ status: 'unsubscribed' }), at(100)).type, 'none');
});

test('already stopped -> nothing', () => {
  assert.equal(nextAction(base({ mailing_stopped_at: at(5).toISOString() }), at(100)).type, 'none');
});

test('extra: welcomed_at and last_mail_at empty -> clock starts at created_at', () => {
  const r = base({ last_mail_at: null, welcomed_at: null, created_at: at(-10).toISOString() });
  assert.equal(anchorOf(r).toISOString(), at(-10).toISOString());
  assert.equal(nextAction(r, at(19)).type, 'none');
  assert.equal(nextAction(r, at(20)).type, 'send');
});

test('extra: last_mail_at empty (welcome mail failed) -> clock starts at welcomed_at', () => {
  const r = base({ last_mail_at: null, welcomed_at: at(3).toISOString(), created_at: at(0).toISOString() });
  assert.equal(nextAction(r, at(32)).type, 'none');
  assert.equal(nextAction(r, at(33)).type, 'send');
});

test('extra: reminders_sent already 2 but not stopped -> stop, no mail', () => {
  assert.equal(nextAction(base({ reminders_sent: 2 }), at(400)).type, 'stop');
  assert.equal(nextAction(base({ reminders_sent: 5, mailing_optin: false }), at(1)).type, 'stop');
});

test('extra: pending (never confirmed) -> nothing; no e-mail -> nothing; no dates -> nothing', () => {
  assert.equal(nextAction(base({ status: 'pending' }), at(100)).type, 'none');
  assert.equal(nextAction(base({ email: '' }), at(100)).type, 'none');
  assert.equal(nextAction(base({ last_mail_at: null, welcomed_at: null, created_at: null }), at(100)).type, 'none');
});

test('extra: other settings work (3 reminders, 14 days)', () => {
  const cfg = { ...CONFIG, REMINDER_COUNT: 3, REMINDER_INTERVAL_DAYS: 14 };
  assert.equal(nextAction(base(), at(13), cfg).type, 'none');
  assert.deepEqual(nextAction(base({ reminders_sent: 1 }), at(14), cfg), { type: 'send', reminderNo: 2, total: 3, isLast: false });
  assert.deepEqual(nextAction(base({ reminders_sent: 2 }), at(14), cfg), { type: 'send', reminderNo: 3, total: 3, isLast: true });
});

test('database query matches the rules', () => {
  const q = decodeURIComponent(dueQuery(at(30)));
  const cutoff = T0.toISOString();
  assert.match(q, /mailing_optin=is\.true/);
  assert.match(q, /status=eq\.confirmed/);
  assert.match(q, /mailing_stopped_at=is\.null/);
  assert.match(q, /reminders_sent=lt\.2/);
  assert.ok(q.includes(`last_mail_at.lte."${cutoff}"`));
  assert.ok(q.includes(`and(last_mail_at.is.null,welcomed_at.is.null,created_at.lte."${cutoff}")`));
  assert.match(q, /limit=50$/);
  assert.match(stopQuery(), /reminders_sent=gte\.2/);
  assert.match(decodeURIComponent(cleanupQuery()), /laposta_removed_at=is\.null.*mailing_stopped_at\.not\.is\.null,status\.eq\.unsubscribed/);
});

test('mail template: NL + EN, first name, free months, button, unsubscribe, counter', () => {
  const args = { naam: 'Jan de Vries', reminderNo: 1, total: 2, unsubscribeUrl: 'https://x/api/afmelden?e=a&t=b', registerUrl: '/#pricing' };
  const nl = reminderMail({ ...args, taal: 'nl' });
  assert.match(nl.text, /^Hoi Jan,/);
  assert.match(nl.text, /De eerste 3 maanden zijn gratis\./);
  assert.match(nl.text, /Groet,\nIan/);
  assert.match(nl.text, /Dit is herinnering 1 van 2\./);
  assert.ok(nl.html.includes('/#pricing'));
  assert.ok(nl.html.includes('https://x/api/afmelden?e=a&amp;t=b'));
  const last = reminderMail({ ...args, taal: 'nl', reminderNo: 2 });
  assert.match(last.text, /Dit is herinnering 2 van 2\. Hierna mailen we je niet meer\./);
  assert.match(last.subject, /^Laatste herinnering/);
  const en = reminderMail({ ...args, taal: 'en' });
  assert.match(en.text, /^Hi Jan,/);
  assert.match(en.text, /The first 3 months are free\./);
  // unknown language falls back to Dutch; HTML in names is escaped
  const x = reminderMail({ ...args, taal: 'de', naam: '<b>Eva</b> X' });
  assert.ok(!x.html.includes('<b>Eva</b>'));
  assert.match(x.text, /^Hoi/);
  assert.equal(firstName(''), '');
  assert.match(reminderMail({ ...args, taal: 'nl', naam: '' }).text, /^Hoi,/);
});

// ---- REVIEW tests (independent reviewer, 2 nov 2026) ----
test('REVIEW: opted in + confirmed but NO double opt-in (single opt-in) -> never a reminder', () => {
  for (const d of [30, 60, 400]) assert.deepEqual(nextAction(base({ optin_confirmed_at: null }), at(d)), { type: 'none', reason: 'no double opt-in' });
  assert.match(decodeURIComponent(dueQuery(at(30))), /optin_confirmed_at=not\.is\.null/);
});

test('REVIEW: simulate 1 year of daily runs -> exactly 2 reminders, on day 30 and day 60, then stopped', () => {
  let row = base({ last_mail_at: '2026-01-10T15:42:00Z' });   // welcome mail in the afternoon
  const runAt = d => new Date(Date.UTC(2026, 0, 10 + d, 8, 17)); // cron 08:17 UTC every day
  const sends = [];
  for (let d = 0; d <= 365; d++) {
    const now = runAt(d), act = nextAction(row, now);
    if (act.type === 'send') { sends.push({ d, n: act.reminderNo, last: act.isLast }); row = { ...row, ...patchAfterSend(row, act, now) }; }
    else if (act.type === 'stop') row = { ...row, mailing_stopped_at: now.toISOString() };
  }
  // welcome 15:42 -> day 30 08:17 is 29.7 days -> first reminder on day 31 (never early)
  assert.deepEqual(sends, [{ d: 31, n: 1, last: false }, { d: 61, n: 2, last: true }]);
  assert.ok(row.mailing_stopped_at);
  assert.equal(row.reminders_sent, 2);
});
