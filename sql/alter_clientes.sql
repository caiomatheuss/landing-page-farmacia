-- ══════════════════════════════════════════════════════════════
--  OBSOLETO. O banco agora é o Supabase.
--  Use sql/supabase-schema.sql no SQL Editor do Supabase.
-- ══════════════════════════════════════════════════════════════
--  Arte Pharmaceutica — autenticação na tabela clientes
--  Rode no SQL Editor do Neon (ou psql) uma vez.
--  email já pode existir no banco; IF NOT EXISTS evita erro.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS senha_hash TEXT;

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Garante só admin | customer
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_role_check;
ALTER TABLE clientes
  ADD CONSTRAINT clientes_role_check
  CHECK (role IN ('admin', 'customer'));

-- E-mail único por farmácia (cadastro/login)
CREATE UNIQUE INDEX IF NOT EXISTS clientes_empresa_email_lower_idx
  ON clientes (empresa_id, lower(email))
  WHERE email IS NOT NULL AND email <> '';

-- Pedidos: created_at ajuda o painel admin
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Taxa de motoboy, separada do valor dos produtos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ── Admin inicial ────────────────────────────────────────────
-- NÃO cole senha em texto puro aqui.
-- Depois do backend no ar, rode:
--   cd backend && node scripts/criar-admin.js email@farmacia.com 'SenhaForte1' 'Nome Admin'
