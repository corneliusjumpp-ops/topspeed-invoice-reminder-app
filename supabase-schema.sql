create extension if not exists pgcrypto;

create table if not exists invoices(
 id uuid primary key default gen_random_uuid(),
 invoice_number text unique default ('TSP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
 customer_name text not null,
 phone text,
 email text,
 description text not null default 'Piano Storage',
 amount numeric(10,2) not null default 100,
 due_date date not null,
 recurring boolean not null default true,
 reminder_email boolean not null default true,
 reminder_sms boolean not null default true,
 status text not null default 'unpaid',
 paid_at timestamptz,
 created_at timestamptz default now()
);

create table if not exists invoice_events(
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid references invoices(id) on delete cascade,
 event_type text not null,
 details text,
 created_at timestamptz default now()
);

alter table invoices enable row level security;
alter table invoice_events enable row level security;

-- For production, add staff authentication and tighten these policies.
create policy "public read invoices" on invoices for select using (true);
create policy "public insert invoices" on invoices for insert with check (true);
create policy "public update invoices" on invoices for update using (true) with check (true);
