-- Tabela de transações financeiras
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type        text not null check (type in ('entrada', 'despesa')),
  amount      numeric(10, 2) not null check (amount > 0),
  description text not null,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_business_id_idx on transactions (business_id);
create index if not exists transactions_created_at_idx  on transactions (created_at desc);
