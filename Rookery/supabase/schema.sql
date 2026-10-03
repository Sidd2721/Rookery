-- DEMO DATA ONLY. Run against your Supabase project.
create table offices (id text primary key, name_mr text, name_en text);
create table services (
  id text primary key,
  office_id text references offices(id),
  name_mr text not null, name_en text not null,
  duration_min int not null default 10,
  checklist jsonb not null
);
create table visits (
  id uuid primary key default gen_random_uuid(),
  office_id text references offices(id),
  service_id text references services(id),
  items_checked jsonb not null default '[]',
  status text not null default 'gathering'
    check (status in ('gathering','ready','serving','done','sent_back')),
  token_no int,
  sent_back_reason text,
  created_at timestamptz default now(),
  ready_at timestamptz
);
create index on visits(office_id, status);
alter table offices enable row level security;
alter table services enable row level security;
alter table visits enable row level security;
