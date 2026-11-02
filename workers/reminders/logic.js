/* Pure "who is due / what happens next" logic. No network, no clock of its own:
   everything gets `now` passed in, so it can be tested exactly (test/logic.test.js). */
import { CONFIG } from './config.js';

const DAY_MS = 24 * 3600 * 1000;

/* The moment the reminder clock started: the last mail we sent, else the
   welcome mail, else the signup itself. */
export function anchorOf(row) {
  const v = row.last_mail_at || row.welcomed_at || row.created_at;
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

/* Returns what to do with one signup row:
   { type: 'none', reason }                              -> nothing
   { type: 'send', reminderNo, total, isLast }           -> send reminder #reminderNo
                                                            (isLast: stop mailing afterwards)
   { type: 'stop', reason }                              -> no mail, just stop + remove from Laposta */
export function nextAction(row, now, cfg = CONFIG) {
  if (!row || !row.email) return { type: 'none', reason: 'no e-mail' };
  if (row.mailing_stopped_at) return { type: 'none', reason: 'already stopped' };
  if (row.status === 'unsubscribed') return { type: 'none', reason: 'unsubscribed' };
  const sent = Number(row.reminders_sent) || 0;
  if (sent >= cfg.REMINDER_COUNT) return { type: 'stop', reason: 'all reminders already sent' };
  if (row.mailing_optin !== true) return { type: 'none', reason: 'no opt-in' };
  if (row.status !== 'confirmed') return { type: 'none', reason: 'not confirmed' };
  const anchor = anchorOf(row);
  if (!anchor) return { type: 'none', reason: 'no start date' };
  if (now.getTime() - anchor.getTime() < cfg.REMINDER_INTERVAL_DAYS * DAY_MS) {
    return { type: 'none', reason: 'not due yet' };
  }
  const reminderNo = sent + 1;
  return { type: 'send', reminderNo, total: cfg.REMINDER_COUNT, isLast: reminderNo >= cfg.REMINDER_COUNT };
}

/* Fields to write after Brevo accepted the reminder. */
export function patchAfterSend(row, action, now) {
  const p = { reminders_sent: action.reminderNo, last_mail_at: now.toISOString() };
  if (action.isLast) p.mailing_stopped_at = now.toISOString();
  return p;
}

const SELECT = 'id,email,naam,taal,status,mailing_optin,reminders_sent,last_mail_at,welcomed_at,created_at,mailing_stopped_at,laposta_removed_at';

/* Supabase REST (PostgREST) query for rows that are due. The or=() filter is
   exactly coalesce(last_mail_at, welcomed_at, created_at) <= cutoff.
   nextAction() re-checks every row, so the two must agree (tested). */
export function dueQuery(now, cfg = CONFIG) {
  const cutoff = new Date(now.getTime() - cfg.REMINDER_INTERVAL_DAYS * DAY_MS).toISOString();
  const q = `"${cutoff}"`;
  const or = `(last_mail_at.lte.${q},and(last_mail_at.is.null,welcomed_at.lte.${q}),` +
             `and(last_mail_at.is.null,welcomed_at.is.null,created_at.lte.${q}))`;
  return `/rest/v1/signups?select=${SELECT}` +
    `&mailing_optin=is.true&status=eq.confirmed&mailing_stopped_at=is.null` +
    `&reminders_sent=lt.${cfg.REMINDER_COUNT}&or=${encodeURIComponent(or)}` +
    `&order=id.asc&limit=${cfg.BATCH_LIMIT}`;
}

/* Rows that already had every reminder (e.g. REMINDER_COUNT was lowered) but
   were never stopped. */
export function stopQuery(cfg = CONFIG) {
  return `/rest/v1/signups?select=${SELECT}&mailing_stopped_at=is.null` +
    `&reminders_sent=gte.${cfg.REMINDER_COUNT}&order=id.asc&limit=${cfg.BATCH_LIMIT}`;
}

/* Stopped or unsubscribed people that are not yet removed from Laposta
   (removal failed earlier, or they unsubscribed via another route). */
export function cleanupQuery(cfg = CONFIG) {
  return `/rest/v1/signups?select=id,email&laposta_removed_at=is.null` +
    `&or=${encodeURIComponent('(mailing_stopped_at.not.is.null,status.eq.unsubscribed)')}` +
    `&order=id.asc&limit=${cfg.BATCH_LIMIT}`;
}
