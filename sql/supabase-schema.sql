-- Arte Pharmaceutica — schema do Supabase
-- Rode uma vez no SQL Editor do projeto (supabase.com → SQL → New query).
-- Substitui o Neon. A senha fica no Supabase Auth (auth.users), não em senha_hash.
--
-- Depois deste script:
-- 1. Authentication → Providers → Email: desligue "Confirm email"
--    para o cliente entrar na hora, como no site antigo.
-- 2. Authentication → Users → Add user: crie o e-mail da farmácia.
-- 3. Rode o UPDATE do final deste arquivo para promover esse e-mail a admin.
-- 4. No Netlify, crie as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
-- 5. Em config.js, cole SUPABASE_URL e SUPABASE_ANON_KEY (a anon key é pública).

-- ── Tabelas ──────────────────────────────────────────────────

create table public.empresas (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null unique,
  criado_em timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id bigint not null references public.empresas (id),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text not null,
  senha_hash text,
  nome text,
  telefone text,
  cpf text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  constraint clientes_role_check check (role in ('admin', 'customer'))
);

create unique index clientes_empresa_email_idx
  on public.clientes (empresa_id, lower(email));

create table public.produtos (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas (id),
  codigo text not null,
  nome text not null,
  preco numeric(10, 2) not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, codigo)
);

create table public.pedidos (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas (id),
  cliente_id uuid references public.clientes (id),
  numero text,
  metodo text,
  status text not null default 'PENDENTE',
  total numeric(10, 2) not null default 0,
  taxa_entrega numeric(10, 2) not null default 0,
  asaas_payment_id text,
  endereco_entrega text,
  created_at timestamptz not null default now(),
  constraint pedidos_status_check check (
    status in ('PENDENTE', 'PAGO', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO')
  )
);

create unique index pedidos_asaas_payment_id_idx
  on public.pedidos (asaas_payment_id)
  where asaas_payment_id is not null;

create index pedidos_cliente_id_idx on public.pedidos (cliente_id);

create table public.pedido_itens (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  produto_id bigint not null references public.produtos (id),
  quantidade integer not null check (quantidade > 0 and quantidade <= 50),
  preco_unitario numeric(10, 2) not null
);

-- ── Dados iniciais (empresa + os 4 produtos do Neon) ─────────

insert into public.empresas (id, nome, slug)
overriding system value
values (1, 'Arte Pharmaceutica', 'arte-pharmaceutica');

select setval(pg_get_serial_sequence('public.empresas', 'id'), 1);

insert into public.produtos (id, empresa_id, codigo, nome, preco, ativo)
overriding system value
values
  (1, 1, 'curcuma-500', 'Cúrcuma 500mg', 1.00, true),
  (2, 1, 'kit-unhas', 'Kit Cuidado Para Unhas', 1.00, true),
  (3, 1, 'malta-cabelao', 'Malta Cabelão', 11.00, true),
  (4, 1, 'pantoarte', 'Pantoarte', 95.00, true);

select setval(pg_get_serial_sequence('public.produtos', 'id'), 4);

-- ── Perfil criado junto com o login do Supabase Auth ─────────
-- Compra sem conta (checkout) grava o cliente pela função da Netlify,
-- sem auth_user_id. Se a pessoa criar conta depois com o mesmo e-mail,
-- este trigger liga o login a esse cadastro.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
begin
  select id into existing_id
  from public.clientes
  where empresa_id = 1 and lower(email) = lower(new.email)
  limit 1;

  if existing_id is not null then
    update public.clientes
    set
      auth_user_id = new.id,
      nome = coalesce(nullif(new.raw_user_meta_data->>'nome', ''), nome),
      telefone = coalesce(nullif(new.raw_user_meta_data->>'telefone', ''), telefone)
    where id = existing_id;
  else
    insert into public.clientes (empresa_id, auth_user_id, email, nome, telefone, role)
    values (
      1,
      new.id,
      lower(new.email),
      nullif(new.raw_user_meta_data->>'nome', ''),
      nullif(new.raw_user_meta_data->>'telefone', ''),
      'customer'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clientes
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Pedido do cliente logado. O preço sai da tabela produtos, não do navegador.
-- Pagamento confirmado (PIX, cartão, retirada) é gravado pela Netlify
-- com a service role, que recalcula produtos e taxa de entrega.

create or replace function public.criar_pedido(
  p_itens jsonb,
  p_metodo text default 'PIX',
  p_endereco text default null,
  p_taxa_entrega numeric default 0,
  p_numero text default null,
  p_asaas_payment_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente public.clientes%rowtype;
  v_pedido_id bigint;
  v_total numeric := 0;
  v_item jsonb;
  v_produto public.produtos%rowtype;
  v_qty integer;
  v_i integer := 0;
  v_taxa numeric := greatest(coalesce(p_taxa_entrega, 0), 0);
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para finalizar o pedido.';
  end if;

  if p_asaas_payment_id is not null then
    select id into v_pedido_id
    from public.pedidos
    where asaas_payment_id = p_asaas_payment_id
    limit 1;
    if v_pedido_id is not null then
      return jsonb_build_object('id', v_pedido_id, 'duplicado', true);
    end if;
  end if;

  select * into v_cliente
  from public.clientes
  where auth_user_id = auth.uid()
  limit 1;

  if v_cliente.id is null then
    raise exception 'Cadastro não encontrado.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Carrinho vazio.';
  end if;

  insert into public.pedidos (
    empresa_id, cliente_id, numero, metodo, status, total, taxa_entrega, asaas_payment_id, endereco_entrega
  )
  values (
    v_cliente.empresa_id,
    v_cliente.id,
    coalesce(nullif(p_numero, ''), 'PED-' || floor(extract(epoch from now()))::bigint),
    upper(coalesce(nullif(p_metodo, ''), 'PIX')),
    'PENDENTE',
    0,
    v_taxa,
    nullif(p_asaas_payment_id, ''),
    nullif(p_endereco, '')
  )
  returning id into v_pedido_id;

  while v_i < jsonb_array_length(p_itens) loop
    v_item := p_itens -> v_i;
    v_i := v_i + 1;
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 50 then
      raise exception 'Quantidade inválida.';
    end if;

    select * into v_produto
    from public.produtos
    where empresa_id = v_cliente.empresa_id
      and codigo = v_item->>'id'
      and ativo = true;

    if v_produto.id is null then
      raise exception 'Produto inválido.';
    end if;

    insert into public.pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
    values (v_pedido_id, v_produto.id, v_qty, v_produto.preco);

    v_total := v_total + (v_produto.preco * v_qty);
  end loop;

  v_total := round((v_total + v_taxa) * 100) / 100;
  update public.pedidos set total = v_total where id = v_pedido_id;

  return jsonb_build_object('id', v_pedido_id, 'total', v_total);
end;
$$;

revoke all on function public.criar_pedido(jsonb, text, text, numeric, text, text) from public;
grant execute on function public.criar_pedido(jsonb, text, text, numeric, text, text) to authenticated;
grant execute on function public.eh_admin() to authenticated;

-- ── Permissões da API ────────────────────────────────────────

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

grant select on public.produtos to anon, authenticated;
grant select (id, empresa_id, auth_user_id, email, nome, telefone, cpf, role, created_at)
  on public.clientes to authenticated;
grant update (nome, telefone, cpf) on public.clientes to authenticated;
grant select on public.pedidos to authenticated;
grant update (status) on public.pedidos to authenticated;
grant select on public.pedido_itens to authenticated;

-- ── RLS ──────────────────────────────────────────────────────

alter table public.empresas enable row level security;
alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

create policy "catalogo publico"
  on public.produtos
  for select
  to anon, authenticated
  using (ativo = true);

create policy "admin gerencia produtos"
  on public.produtos
  for all
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy "cliente le o proprio perfil"
  on public.clientes
  for select
  to authenticated
  using (auth_user_id = auth.uid() or public.eh_admin());

create policy "cliente atualiza o proprio perfil"
  on public.clientes
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "pedidos do cliente ou do admin"
  on public.pedidos
  for select
  to authenticated
  using (
    public.eh_admin()
    or cliente_id in (
      select id from public.clientes where auth_user_id = auth.uid()
    )
  );

create policy "admin atualiza status do pedido"
  on public.pedidos
  for update
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy "itens do pedido visivel"
  on public.pedido_itens
  for select
  to authenticated
  using (
    public.eh_admin()
    or exists (
      select 1
      from public.pedidos p
      join public.clientes c on c.id = p.cliente_id
      where p.id = pedido_itens.pedido_id
        and c.auth_user_id = auth.uid()
    )
  );

-- ── Admin da farmácia ────────────────────────────────────────
-- Crie o usuário em Authentication → Users e troque o e-mail abaixo.
-- update public.clientes
-- set role = 'admin'
-- where lower(email) = lower('email@da-farmacia.com');
