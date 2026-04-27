-- VagasIA — Schema Supabase
-- Corre este ficheiro no SQL Editor do teu projeto Supabase

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null default 'Outro',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  whatsapp_phone_number_id text,
  whatsapp_access_token text,
  created_at timestamptz default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  duration_minutes int not null default 60,
  price numeric(8,2) not null default 0,
  description text,
  active boolean not null default true
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  phone text not null,
  email text,
  notes text,
  total_appointments int not null default 0,
  total_spent numeric(10,2) not null default 0,
  last_appointment date,
  created_at timestamptz default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pendente' check (status in ('confirmada','pendente','cancelada')),
  notes text,
  price numeric(8,2) not null default 0,
  created_at timestamptz default now()
);

create table waiting_list (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  service_id uuid references services(id) on delete set null,
  preferred_date date,
  preferred_time_start time,
  preferred_time_end time,
  notes text,
  notified boolean not null default false,
  created_at timestamptz default now()
);

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  open_time time not null default '09:00',
  close_time time not null default '19:00',
  is_closed boolean not null default false,
  unique (business_id, day_of_week)
);

create table availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('block','open')),
  start_time time not null,
  end_time time not null,
  reason text,
  constraint valid_range check (end_time > start_time)
);

alter table availability_exceptions enable row level security;

-- RLS (Row Level Security)
alter table businesses enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table waiting_list enable row level security;
alter table business_hours enable row level security;

-- Políticas públicas de leitura para a página de reservas
create policy "Public read services" on services for select using (active = true);
create policy "Public read business_hours" on business_hours for select using (true);
create policy "Public insert appointments" on appointments for insert with check (true);
create policy "Public insert clients" on clients for insert with check (true);

-- availability_exceptions: gerida via service_role (server actions)
-- sem políticas anon — acesso apenas pelo backend com service_role key

-- Seed: negócio de demonstração
-- UUID fixo para usar como DEMO_BUSINESS_ID no código
insert into businesses (id, name, slug, category, phone, email, address)
values (
  '00000000-0000-0000-0000-000000000001',
  'Cabeleireira Lisboa',
  'cabeleireira-lisboa',
  'Cabeleireira',
  '+351 21 000 0000',
  'info@cabeleireira-lisboa.pt',
  'Rua Augusta 123, Lisboa'
) on conflict (id) do nothing;
