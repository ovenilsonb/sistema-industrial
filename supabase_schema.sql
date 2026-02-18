-- ==============================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- COMO RODAR:
-- 1. Acesse o Painel do Supabase (https://supabase.com/dashboard).
-- 2. Vá em "SQL Editor" (ícone de terminal no menu lateral).
-- 3. Clique em "New Query".
-- 4. Cole todo este conteúdo e clique em "RUN".
-- ==============================================================================

-- 1. Limpeza (Opcional - remove tabelas antigas para recriar)
drop table if exists public.sales_order_items cascade;
drop table if exists public.sales_orders cascade;
drop table if exists public.production_orders cascade;
drop table if exists public.inventory_movements cascade;
drop table if exists public.inventory_items cascade;
drop table if exists public.formula_ingredients cascade;
drop table if exists public.formulas cascade;
drop table if exists public.raw_material_variants cascade;
drop table if exists public.raw_materials cascade;
drop table if exists public.customers cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.users cascade;

-- 2. Tabela de Usuários
create table public.users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null, -- Em produção real, use Supabase Auth. Aqui mantemos compatibilidade com o app atual.
  first_name text,
  last_name text,
  email text,
  role text check (role in ('admin', 'user')) default 'user',
  permissions text[], -- Array de strings
  active boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Tabela de Fornecedores
create table public.suppliers (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  cnpj text,
  address text,
  city text,
  state text,
  notes text,
  active boolean default true,
  purchase_history jsonb default '[]'::jsonb, -- Histórico simplificado em JSON
  created_at timestamp with time zone default now()
);

-- 4. Tabela de Clientes
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  cpf_cnpj text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  notes text,
  active boolean default true,
  purchase_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 5. Tabela de Matérias-Primas
create table public.raw_materials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text,
  unit text,
  unit_value numeric default 0,
  supplier text,
  min_stock numeric default 0,
  current_stock numeric default 0,
  is_chemical boolean default true,
  image text, -- Base64 ou URL
  status text default 'active',
  has_variants boolean default false,
  created_at timestamp with time zone default now()
);

-- 6. Variantes de Matéria-Prima
create table public.raw_material_variants (
  id uuid default gen_random_uuid() primary key,
  raw_material_id uuid references public.raw_materials(id) on delete cascade,
  name text not null,
  price numeric default 0,
  created_at timestamp with time zone default now()
);

-- 7. Tabela de Fórmulas
create table public.formulas (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text,
  description text,
  yield numeric default 1,
  unit text default 'UNID',
  status text default 'active',
  group_id text, -- ID do grupo (string simples no app atual)
  supply_list_name text,
  batch_prefix text,
  change_log jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 8. Ingredientes da Fórmula
create table public.formula_ingredients (
  id uuid default gen_random_uuid() primary key,
  formula_id uuid references public.formulas(id) on delete cascade,
  raw_material_id uuid references public.raw_materials(id),
  variant_id uuid references public.raw_material_variants(id), -- Opcional
  quantity numeric not null default 0,
  created_at timestamp with time zone default now()
);

-- 9. Itens de Estoque (Produto Acabado)
create table public.inventory_items (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  product_code text,
  batch_code text not null,
  production_date timestamp with time zone,
  expiration_date timestamp with time zone,
  quantity numeric default 0,
  unit_cost numeric default 0,
  status text default 'available',
  created_at timestamp with time zone default now()
);

-- 10. Movimentações de Estoque
create table public.inventory_movements (
  id uuid default gen_random_uuid() primary key,
  inventory_item_id uuid references public.inventory_items(id) on delete cascade,
  type text check (type in ('in', 'out')),
  quantity numeric not null,
  reason text,
  notes text,
  date timestamp with time zone default now()
);

-- 11. Ordens de Produção (Fábrica)
create table public.production_orders (
  id uuid default gen_random_uuid() primary key,
  formula_id uuid references public.formulas(id),
  product_name text not null,
  quantity numeric not null,
  status text default 'pending',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  notes text,
  supply_list_name text,
  batch_code text,
  expiration_date timestamp with time zone,
  sales_order_id text, -- Link para venda (string ou uuid se normalizado)
  origin text default 'manual',
  created_at timestamp with time zone default now()
);

-- 12. Pedidos de Venda
create table public.sales_orders (
  id uuid default gen_random_uuid() primary key,
  sale_sequence text, -- Ex: #0001
  customer_name text,
  customer_id uuid references public.customers(id),
  date timestamp with time zone default now(),
  status text default 'pending', -- pending, completed, budget
  total numeric default 0,
  payment_method text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 13. Itens do Pedido de Venda
create table public.sales_order_items (
  id uuid default gen_random_uuid() primary key,
  sales_order_id uuid references public.sales_orders(id) on delete cascade,
  formula_id uuid references public.formulas(id),
  product_name text not null,
  quantity numeric default 1,
  unit_price numeric default 0,
  total numeric default 0,
  sales_type text default 'retail', -- retail, wholesale, bundle
  created_at timestamp with time zone default now()
);

-- ==============================================================================
-- PERMISSÕES (RLS - ROW LEVEL SECURITY)
-- Importante: Isso permite que sua aplicação (usando a ANON_KEY) leia e escreva.
-- Em um app real com login Supabase, você usaria regras mais estritas.
-- ==============================================================================

-- Habilitar RLS
alter table public.users enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.raw_materials enable row level security;
alter table public.raw_material_variants enable row level security;
alter table public.formulas enable row level security;
alter table public.formula_ingredients enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.production_orders enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;

-- Criar Políticas de Acesso Total (Leitura e Escrita para todos os usuários da API)
create policy "Enable all access" on public.users for all using (true) with check (true);
create policy "Enable all access" on public.suppliers for all using (true) with check (true);
create policy "Enable all access" on public.customers for all using (true) with check (true);
create policy "Enable all access" on public.raw_materials for all using (true) with check (true);
create policy "Enable all access" on public.raw_material_variants for all using (true) with check (true);
create policy "Enable all access" on public.formulas for all using (true) with check (true);
create policy "Enable all access" on public.formula_ingredients for all using (true) with check (true);
create policy "Enable all access" on public.inventory_items for all using (true) with check (true);
create policy "Enable all access" on public.inventory_movements for all using (true) with check (true);
create policy "Enable all access" on public.production_orders for all using (true) with check (true);
create policy "Enable all access" on public.sales_orders for all using (true) with check (true);
create policy "Enable all access" on public.sales_order_items for all using (true) with check (true);

-- Conceder permissões explícitas aos roles do Supabase
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
