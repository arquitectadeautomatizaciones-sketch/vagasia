-- =============================================================
-- VagasIA — available_slots
-- Corre este ficheiro no SQL Editor do teu projeto Supabase.
-- É seguro correr mais do que uma vez (idempotente).
-- =============================================================

-- ---------------------------------------------------------------
-- 1. TABELA
-- ---------------------------------------------------------------
create table if not exists available_slots (
  id          uuid        primary key default gen_random_uuid(),
  business_id uuid        not null references businesses(id) on delete cascade,
  date        date        not null,
  start_time  time        not null,
  end_time    time        not null,
  service_id  uuid        references services(id) on delete set null,
  status      text        not null default 'disponivel'
                          check (status in ('disponivel', 'reservada', 'cancelada')),
  notes       text,
  created_at  timestamptz default now(),
  constraint valid_slot_range check (end_time > start_time)
);

-- ---------------------------------------------------------------
-- 2. RLS
-- A tabela é acedida APENAS via API (service_role key), que
-- bypassa automaticamente o RLS — não são necessárias políticas
-- anon. Ativamos RLS para bloquear acesso direto do cliente.
-- ---------------------------------------------------------------
alter table available_slots enable row level security;

-- Remove políticas anteriores para evitar conflitos ao re-correr
drop policy if exists "Service role full access" on available_slots;

-- Política explícita para service_role (redundante mas documentada)
create policy "Service role full access"
  on available_slots
  for all
  to service_role
  using (true)
  with check (true);

-- ---------------------------------------------------------------
-- 3. SERVIÇOS DE DEMONSTRAÇÃO (UUIDs fixos, idempotente)
-- ---------------------------------------------------------------
insert into services (id, business_id, name, duration_minutes, price, active)
values
  ('00000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000001',
   'Corte de cabelo', 45, 20.00, true),

  ('00000000-0000-0000-0000-000000000012',
   '00000000-0000-0000-0000-000000000001',
   'Coloração', 120, 60.00, true),

  ('00000000-0000-0000-0000-000000000013',
   '00000000-0000-0000-0000-000000000001',
   'Tratamento capilar', 60, 35.00, true),

  ('00000000-0000-0000-0000-000000000014',
   '00000000-0000-0000-0000-000000000001',
   'Escova e brushing', 40, 25.00, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 4. VAGAS DE DEMONSTRAÇÃO
--    Datas relativas a CURRENT_DATE — ficam sempre no futuro.
-- ---------------------------------------------------------------
delete from available_slots
where business_id = '00000000-0000-0000-0000-000000000001';

insert into available_slots
  (business_id, date, start_time, end_time, service_id, status, notes)
values

  -- === DISPONÍVEIS ===
  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 1, '09:00', '09:45',
   '00000000-0000-0000-0000-000000000011',
   'disponivel',
   'Vaga de última hora — cancelamento de cliente'),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 1, '15:00', '15:40',
   null,
   'disponivel',
   null),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 3, '10:00', '12:00',
   '00000000-0000-0000-0000-000000000012',
   'disponivel',
   null),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 5, '14:00', '15:00',
   '00000000-0000-0000-0000-000000000013',
   'disponivel',
   'Inclui máscara intensiva'),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 7, '09:00', '09:45',
   '00000000-0000-0000-0000-000000000011',
   'disponivel',
   null),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 7, '11:00', '11:40',
   '00000000-0000-0000-0000-000000000014',
   'disponivel',
   null),

  -- === RESERVADAS ===
  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 2, '10:00', '12:00',
   '00000000-0000-0000-0000-000000000012',
   'reservada',
   null),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 4, '16:00', '16:45',
   '00000000-0000-0000-0000-000000000011',
   'reservada',
   null),

  -- === CANCELADAS ===
  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE - 1, '13:00', '14:00',
   '00000000-0000-0000-0000-000000000013',
   'cancelada',
   null),

  ('00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + 6, '09:00', '09:45',
   null,
   'cancelada',
   'Feriado municipal');
