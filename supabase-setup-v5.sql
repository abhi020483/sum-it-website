-- ============================================================
-- Sum-IT — Supabase migration v5 (herinneringsmails / reminder mails)
-- Run ONCE in: Supabase Dashboard -> SQL Editor (after v1, v2, v3 and v4).
-- Safe to re-run (idempotent).
--
-- What it adds:
--   * consent + bookkeeping columns for the automatic reminder mails
--     (sent by the separate Cloudflare Worker in workers/reminders/)
--   * an index so the daily "who is due" query stays fast
--   * unsubscribe_signup() now also stops all mailings (mailing_stopped_at)
--   * stop_mailing(): stops mailings WITHOUT marking someone as unsubscribed
--     (used when the Worker itself deletes a finished person from Laposta)
--   * admin_signups() shows the new columns in beheer.html
--
-- BACKFILL / LEGAL NOTE:
--   Existing rows get mailing_optin = false, so NOBODY who signed up before
--   this migration receives reminder mails. Under Dutch law (Telecommunicatiewet
--   art. 11.7) e-mail marketing needs prior opt-in, and we cannot prove that
--   older rows gave that specific consent, so "no reminders" is the safe default.
--   If you can prove consent for a group (e.g. they ticked the mailing box),
--   switch them on by hand, for example:
--     update public.signups set mailing_optin = true where email in ('a@b.nl', ...);
--   Reminders also require optin_confirmed_at (double opt-in confirmed); existing
--   rows keep NULL there, so they get no reminders either.
--   Rows that were already 'unsubscribed' get mailing_stopped_at = now() below,
--   so the Worker also removes them from the Laposta list.
-- ============================================================

-- 1) Columns --------------------------------------------------
alter table public.signups add column if not exists mailing_optin      boolean not null default false;
alter table public.signups add column if not exists reminders_sent     integer not null default 0;
alter table public.signups add column if not exists last_mail_at       timestamptz;  -- last mail we sent (welcome or reminder)
alter table public.signups add column if not exists mailing_stopped_at timestamptz;  -- set => never mail again (row + e-mail are kept)
alter table public.signups add column if not exists laposta_removed_at timestamptz;  -- set once the member is deleted from Laposta
-- REVIEW FIX: moment the e-mail address was confirmed via DOUBLE opt-in (Laposta
-- confirmation link; set by /api/laposta-webhook only when DOUBLE_OPTIN=1).
-- Reminder mails require it. Single opt-in sign-ups keep NULL = no reminders.
alter table public.signups add column if not exists optin_confirmed_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'signups_reminders_sent_nonneg') then
    alter table public.signups add constraint signups_reminders_sent_nonneg check (reminders_sent >= 0);
  end if;
end $$;

-- Backfill: people who already unsubscribed are stopped too (no reminders, removed from Laposta).
update public.signups
   set mailing_stopped_at = coalesce(mailing_stopped_at, now())
 where status = 'unsubscribed' and mailing_stopped_at is null;

-- 2) Indexes --------------------------------------------------
-- Reminder query: only the (small) set of people still in the reminder flow.
create index if not exists signups_reminders_due_idx
  on public.signups (id)
  where mailing_optin and mailing_stopped_at is null and status = 'confirmed'
    and optin_confirmed_at is not null;
-- Cleanup query: stopped/unsubscribed people not yet removed from Laposta.
create index if not exists signups_laposta_cleanup_idx
  on public.signups (id)
  where laposta_removed_at is null and (mailing_stopped_at is not null or status = 'unsubscribed');

-- 3) Unsubscribe now also stops every mailing ------------------
create or replace function public.unsubscribe_signup(p_email text)
returns void language sql security definer set search_path = public as $$
  update public.signups
     set status = 'unsubscribed',
         mailing_stopped_at = coalesce(mailing_stopped_at, now())
   where email = lower(p_email);
$$;
revoke all on function public.unsubscribe_signup(text) from public, anon, authenticated;

-- Stop mailings without changing status (person finished the reminders, or was
-- deleted from Laposta). Keeps the row, the e-mail and the queue position.
create or replace function public.stop_mailing(p_email text)
returns void language sql security definer set search_path = public as $$
  update public.signups
     set mailing_stopped_at = coalesce(mailing_stopped_at, now())
   where email = lower(p_email);
$$;
revoke all on function public.stop_mailing(text) from public, anon, authenticated;

-- 4) Admin export: same columns as v4 + reminder fields appended at the end
drop function if exists public.admin_signups();
create function public.admin_signups()
returns table (id bigint, email text, naam text, rol text, bedrijfstype text,
               boekhouder text, taal text, source text, city text, ref_code text,
               referred_by text, status text, queue_pos integer,
               confirmed_at timestamptz, created_at timestamptz,
               telefoon text, stad text, vestiging text,
               mailing_optin boolean, reminders_sent integer,
               last_mail_at timestamptz, mailing_stopped_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query select s.id, s.email, s.naam, s.rol, s.bedrijfstype, s.boekhouder,
                      s.taal, s.source, s.city, s.ref_code, s.referred_by,
                      s.status, s.queue_pos, s.confirmed_at, s.created_at,
                      s.telefoon, s.stad, s.vestiging,
                      s.mailing_optin, s.reminders_sent, s.last_mail_at, s.mailing_stopped_at
                 from public.signups s order by s.created_at desc;
end $$;
grant execute on function public.admin_signups() to authenticated;
revoke all on function public.admin_signups() from public, anon;

-- RLS stays as in v2: the table has RLS on and no grants for anon/authenticated.
-- The Pages Functions and the reminder Worker use the service key.
