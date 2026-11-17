-- ============================================================
-- Yatrik – Supabase / PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Enable UUID generation ───────────────────────────────────
create extension if not exists "pgcrypto";


-- ══════════════════════════════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════════════════════════════

create type user_role      as enum ('student', 'admin');
create type pass_type      as enum ('monthly', 'quarterly', 'half-yearly', 'yearly');
create type app_status     as enum ('pending', 'under_review', 'approved', 'rejected');
create type timeline_key   as enum ('submitted', 'review', 'approved', 'rejected', 'pass');
create type pass_action    as enum ('issued', 'extended', 'revoked', 'reinstated', 'expired');
create type notif_type     as enum ('submitted', 'approved', 'rejected', 'pass', 'expiring', 'expired', 'info');
create type ann_priority   as enum ('normal', 'important', 'urgent');


-- ══════════════════════════════════════════════════════════════
-- USERS
-- ══════════════════════════════════════════════════════════════

create table users (
  id          text        primary key default gen_random_uuid()::text,
  email       text        not null unique,
  password    text        not null,         -- store hashed (bcrypt) in production
  role        user_role   not null default 'student',
  name        text        not null,
  created_at  timestamptz not null default now()
);

create index idx_users_email on users(email);


-- ══════════════════════════════════════════════════════════════
-- STUDENT PROFILES
-- ══════════════════════════════════════════════════════════════

create table student_profiles (
  id           text        primary key default gen_random_uuid()::text,
  user_id      text        not null references users(id) on delete cascade,
  full_name    text        not null,
  student_id   text,
  college      text,
  course       text,
  year         text,
  mobile       text,
  email        text,
  photo_key         text,                        -- Supabase Storage object path
  aadhar_key        text,                        -- uploaded Aadhar card
  pan_key           text,                        -- uploaded PAN card
  id_card_key       text,                        -- uploaded student ID card
  admission_key     text,                        -- uploaded admission letter
  documents_uploaded boolean not null default false,  -- true once all required docs are present
  created_at   timestamptz not null default now()
);

create index idx_sp_user_id on student_profiles(user_id);


-- ══════════════════════════════════════════════════════════════
-- BUS ROUTES
-- ══════════════════════════════════════════════════════════════

create table bus_routes (
  id           text        primary key default gen_random_uuid()::text,
  number       text        not null unique,
  name         text        not null,
  start_point  text        not null,
  end_point    text        not null,
  description  text,
  distance_km  numeric(6,1),
  duration_min integer,
  color        text        not null default '#3DB67F',
  pass_types   pass_type[] not null default array['monthly','quarterly','half-yearly','yearly']::pass_type[],
  created_at   timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- BUS STOPS
-- ══════════════════════════════════════════════════════════════

create table bus_stops (
  id         text        primary key default gen_random_uuid()::text,
  route_id   text        not null references bus_routes(id) on delete cascade,
  name       text        not null,
  lat        numeric(9,6) not null,
  lng        numeric(9,6) not null,
  "order"    integer     not null default 0,
  created_at timestamptz not null default now()
);

create index idx_stops_route_id on bus_stops(route_id);


-- ══════════════════════════════════════════════════════════════
-- APPLICATIONS
-- ══════════════════════════════════════════════════════════════

create table applications (
  id                   text       primary key,   -- e.g. APP20260001
  user_id              text       not null references users(id),
  student_profile_id   text       not null references student_profiles(id),
  route_id             text       not null references bus_routes(id),
  -- personal snapshot at time of application
  full_name            text       not null,
  student_id_no        text,
  college              text,
  course               text,
  year                 text,
  mobile               text,
  email                text,
  start_point          text,
  destination          text,
  stop_id              text,
  pass_type            pass_type  not null,
  -- document storage paths in Supabase Storage
  doc_photo            text,
  doc_student_id_card  text,
  doc_admission_proof  text,
  -- status
  status               app_status not null default 'pending',
  rejection_reason     text,
  submitted_at         timestamptz not null default now(),
  reviewed_at          timestamptz,
  pass_id              text,
  resubmitted_from     text
);

create index idx_app_user_id  on applications(user_id);
create index idx_app_status   on applications(status);
create index idx_app_submitted on applications(submitted_at desc);


-- ── Application Timeline ─────────────────────────────────────

create table application_timeline (
  id             bigserial   primary key,
  application_id text        not null references applications(id) on delete cascade,
  event_key      timeline_key not null,
  label          text        not null,
  occurred_at    timestamptz not null default now()
);

create index idx_timeline_app_id on application_timeline(application_id);


-- ══════════════════════════════════════════════════════════════
-- ISSUED PASSES
-- ══════════════════════════════════════════════════════════════

create table issued_passes (
  id                  text        primary key,   -- e.g. BP20260001
  application_id      text        not null references applications(id),
  student_profile_id  text        not null references student_profiles(id),
  user_id             text        not null references users(id),
  route_id            text        not null references bus_routes(id),
  pass_type           pass_type   not null,
  issue_date          timestamptz not null default now(),
  expiry_date         timestamptz not null,
  revoked             boolean     not null default false,
  notified_7          boolean     not null default false,
  notified_30         boolean     not null default false,
  notified_expired    boolean     not null default false
);

create index idx_pass_user_id   on issued_passes(user_id);
create index idx_pass_expiry    on issued_passes(expiry_date);
create index idx_pass_revoked   on issued_passes(revoked);


-- ── Pass History ─────────────────────────────────────────────

create table pass_history (
  id           bigserial   primary key,
  pass_id      text        not null references issued_passes(id) on delete cascade,
  action       pass_action not null,
  note         text,
  occurred_at  timestamptz not null default now()
);

create index idx_pass_history_pass_id on pass_history(pass_id);


-- ══════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS
-- ══════════════════════════════════════════════════════════════

create table announcements (
  id          text         primary key default gen_random_uuid()::text,
  title       text         not null,
  body        text         not null,
  priority    ann_priority not null default 'normal',
  active      boolean      not null default true,
  created_at  timestamptz  not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════

create table notifications (
  id          text        primary key default gen_random_uuid()::text,
  audience    text        not null,          -- user id OR 'admin'
  type        notif_type  not null,
  title       text        not null,
  message     text        not null,
  link        text,
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index idx_notif_audience on notifications(audience);
create index idx_notif_unread   on notifications(audience, read) where read = false;


-- ══════════════════════════════════════════════════════════════
-- SETTINGS  (single row keyed by id)
-- ══════════════════════════════════════════════════════════════

create table settings (
  id                    text    primary key default 'main',
  college_name          text    not null default 'Mumbai Metropolitan College',
  college_address       text    not null default 'LBS Marg, Mulund West, Mumbai 400080',
  college_email         text    not null default 'transport@mmc.edu.in',
  college_phone         text    not null default '+91 22 2560 1234',
  admin_name            text    not null default 'Transport Office',
  admin_email           text    not null default 'admin@demo.com',
  -- pass validity in days
  validity_monthly      integer not null default 30,
  validity_quarterly    integer not null default 90,
  validity_half_yearly  integer not null default 180,
  validity_yearly       integer not null default 365,
  -- pass fees in INR
  fee_monthly           integer not null default 450,
  fee_quarterly         integer not null default 1250,
  fee_half_yearly       integer not null default 2400,
  fee_yearly            integer not null default 4500,
  instructions          text,
  counter_app           integer not null default 0,
  counter_pass          integer not null default 0,
  updated_at            timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- BUS TICKETS  (single/return journey tickets, expire 24 h)
-- ══════════════════════════════════════════════════════════════

create type ticket_type as enum ('single', 'return');

create table bus_tickets (
  id                  text        primary key,                    -- e.g. TKT20260001
  user_id             text        not null references users(id) on delete cascade,
  student_profile_id  text        not null references student_profiles(id),
  student_name        text        not null,
  route_id            text        not null references bus_routes(id),
  from_stop_id        text        not null references bus_stops(id),
  to_stop_id          text        not null references bus_stops(id),
  from_stop_name      text        not null,
  to_stop_name        text        not null,
  ticket_type         ticket_type not null default 'single',
  passengers          integer     not null default 1 check (passengers between 1 and 10),
  fare                integer     not null,                       -- total fare in ₹
  stations            integer     not null,                       -- number of station gaps
  issued_at           timestamptz not null default now(),
  expires_at          timestamptz not null,                       -- issued_at + 24 hours
  used                boolean     not null default false
);

create index idx_ticket_user    on bus_tickets(user_id);
create index idx_ticket_route   on bus_tickets(route_id);
create index idx_ticket_expires on bus_tickets(expires_at);
create index idx_ticket_used    on bus_tickets(used);


-- ══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (Supabase RLS)
-- ══════════════════════════════════════════════════════════════
-- Enable RLS on every table so the anon key cannot read raw data.
-- Use the service role key (server-side only) to bypass RLS.

alter table users               enable row level security;
alter table student_profiles    enable row level security;
alter table bus_routes          enable row level security;
alter table bus_stops           enable row level security;
alter table applications        enable row level security;
alter table application_timeline enable row level security;
alter table issued_passes       enable row level security;
alter table pass_history        enable row level security;
alter table announcements       enable row level security;
alter table notifications       enable row level security;
alter table settings            enable row level security;
alter table bus_tickets         enable row level security;

-- Allow service role full access (bypasses RLS automatically in Supabase).
-- Add finer-grained policies as needed once you wire up Supabase Auth.
