-- ADVAIT Scheduler — full schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists team_members (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  phone      text not null,           -- E.164 without +, e.g. 919198765432
  role       text not null default '',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  client     text not null default '',
  status     text not null default 'active'
               check (status in ('active','on_hold','completed')),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  notes        text not null default '',
  project_id   uuid references projects(id) on delete set null,
  assigned_to  uuid references team_members(id) on delete set null,
  status       text not null default 'pending'
                 check (status in ('pending','in_progress','done')),
  send_tonight boolean not null default false,
  due_date     date,
  created_at   timestamptz not null default now()
);

create table if not exists send_logs (
  id           uuid primary key default uuid_generate_v4(),
  member_id    uuid not null references team_members(id) on delete cascade,
  task_ids     uuid[] not null default '{}',
  message_sent text not null,
  sent_at      timestamptz not null default now(),
  status       text not null default 'success'
                 check (status in ('success','failed'))
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists tasks_assigned_to_idx on tasks(assigned_to);
create index if not exists tasks_send_tonight_idx on tasks(send_tonight) where send_tonight = true;
create index if not exists send_logs_member_id_idx on send_logs(member_id);
create index if not exists send_logs_sent_at_idx on send_logs(sent_at desc);

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- App uses service-role key from server-side API routes, so RLS is disabled.
-- Enable + add policies below only if you expose tables to the client/browser.
alter table team_members disable row level security;
alter table projects     disable row level security;
alter table tasks        disable row level security;
alter table send_logs    disable row level security;

-- ── Seed dummy data ────────────────────────────────────────────────────────────
-- Delete then re-insert so the script is idempotent (safe to run again).
delete from send_logs;
delete from tasks;
delete from team_members;
delete from projects;

insert into team_members (id, name, phone, role, active) values
  ('00000000-0000-0000-0000-000000000001', 'Gunjan', '919198765432', 'Architect', true),
  ('00000000-0000-0000-0000-000000000002', 'Ravi',   '919187654321', 'Drafter',   true),
  ('00000000-0000-0000-0000-000000000003', 'Priya',  '919176543210', 'Intern',    true);

insert into projects (id, name, client, status) values
  ('10000000-0000-0000-0000-000000000001', 'Mediterranean Villa', 'Sharma Ji',  'active'),
  ('10000000-0000-0000-0000-000000000002', 'Aikyam Residence',    'Mehta Ji',   'active'),
  ('10000000-0000-0000-0000-000000000003', 'Skyline Office',      'Gupta Infra','on_hold');

insert into tasks (id, title, notes, project_id, assigned_to, status, send_tonight) values
  ('20000000-0000-0000-0000-000000000001',
   'Revise bedroom layout',
   'Client wants wardrobe on east wall',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'pending', true),
  ('20000000-0000-0000-0000-000000000002',
   'Stone texture research', '',
   '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'pending', false),
  ('20000000-0000-0000-0000-000000000003',
   'Section drawings — Floor 2',
   'Reference the Mehta brief doc',
   '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'in_progress', true),
  ('20000000-0000-0000-0000-000000000004',
   'Compile mood board', '',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000003',
   'pending', false),
  ('20000000-0000-0000-0000-000000000005',
   'Structural consultancy call notes',
   'Meet at 11am',
   '10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000002',
   'done', false);

insert into send_logs (member_id, task_ids, message_sent, sent_at, status) values
  ('00000000-0000-0000-0000-000000000001',
   array['20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003']::uuid[],
   E'Hi Gunjan,\n\nHere are your tasks for tonight:\n\n1. Revise bedroom layout — Mediterranean Villa\n2. Section drawings — Floor 2 — Aikyam Residence\n\n– ADVAIT Studio',
   now() - interval '1 day', 'success'),
  ('00000000-0000-0000-0000-000000000002',
   array['20000000-0000-0000-0000-000000000002']::uuid[],
   E'Hi Ravi,\n\nHere are your tasks for tonight:\n\n1. Stone texture research — Aikyam Residence\n\n– ADVAIT Studio',
   now() - interval '1 day', 'success');
