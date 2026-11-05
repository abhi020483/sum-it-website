-- Sum-IT v6 (5 nov 2026): UTM tags from Meta/Instagram ads stored with each sign-up (B5).
-- Run once in Supabase > SQL editor. Safe to run twice.
alter table public.signups add column if not exists utm_source   text;
alter table public.signups add column if not exists utm_medium   text;
alter table public.signups add column if not exists utm_campaign text;
alter table public.signups add column if not exists utm_content  text;
alter table public.signups add column if not exists utm_term     text;
