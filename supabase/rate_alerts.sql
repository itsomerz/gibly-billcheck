-- rate_alerts: email-only rate-watch signups from the results page.
--
-- HOW TO RUN THIS:
--   Supabase dashboard -> your project -> SQL Editor -> New query -> paste
--   this whole file -> Run. (Not run automatically by the app; this is a
--   one-time setup script.)
--
-- WHAT THIS STORES:
--   Only email, province, utility_type, current_rate, and consent fields —
--   no name, address, or account number, matching the same "no personal
--   info beyond what's needed" rule the bill-extraction route follows.
--
-- FUTURE ACCOUNTS MIGRATION (see chat explanation for the full walkthrough):
--   user_id is nullable and unused today. When Supabase Auth (Google
--   sign-in) is added later, a one-time backfill UPDATE can link existing
--   rows to a new auth.users row by matching email -- no data re-collection
--   needed. Email stays the durable identifier until then.

create table if not exists public.rate_alerts (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  email              text not null,
  province           text not null,
  utility_type       text not null check (utility_type in ('electricity', 'gas')),
  current_rate       numeric not null,
  consent_given      boolean not null default false,
  consent_timestamp  timestamptz,
  -- Nullable on purpose -- filled in later when accounts exist. References
  -- auth.users so it can become a real foreign key the moment that table
  -- has matching rows; harmless while every value here is null.
  user_id            uuid references auth.users (id) on delete set null,

  -- Belt-and-suspenders: the app's UI already requires the consent checkbox
  -- before it will submit, but this makes it impossible for ANY row to
  -- exist without recorded consent, even via a future bug or a direct API
  -- call that bypasses the UI.
  constraint rate_alerts_consent_required check (consent_given = true and consent_timestamp is not null)
);

-- email: looked up when linking to an account later, and useful for support
-- ("did this email already sign up?"). user_id: looked up once accounts
-- exist and you're listing a user's own alerts.
create index if not exists rate_alerts_email_idx on public.rate_alerts (email);
create index if not exists rate_alerts_user_id_idx on public.rate_alerts (user_id);

alter table public.rate_alerts enable row level security;

-- Anyone (anonymous visitors today, logged-in users later) can insert their
-- own signup. No SELECT/UPDATE/DELETE policy is defined below, so RLS
-- denies those by default -- nobody can read the list back through the
-- public API, only from the Supabase dashboard with elevated access.
--
-- When accounts exist, revisit this: add a SELECT policy scoped to
-- `auth.uid() = user_id` so a logged-in user can see their own alerts, and
-- consider tightening this INSERT policy so a logged-in user can only set
-- user_id to their own auth.uid() (or leave it null), not someone else's.
create policy "rate_alerts_insert_anyone"
  on public.rate_alerts
  for insert
  to anon, authenticated
  with check (true);
