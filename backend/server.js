/* global process */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const {
  DATABASE_URL,
  JWT_SECRET,
  PORT = 3000,
  EMPRESA_ID = '1',
  FRONTEND_ORIGIN = '',
} = process.env;

if (!DATABASE_URL) {
  console.error('[api] DATABASE_URL não configurada.');
  process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('[api] JWT_SECRET precisa ter pelo menos 16 caracteres.');
  process.exit(1);
}

const empresaId = Number(EMPRESA_ID) || 1;
const SENHA_MIN = 6;
const SENHA_MAX = 20;
const STATUS_PERMITIDOS = [
  'PENDENTE',
  'PAGO',
  'CONFIRMADO',
  'PREPARANDO',
  'ENVIADO',
  'ENTREGUE',
  'CANCELADO',
];

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

const origens = FRONTEND_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (!origens.length || origens.includes(origin)) return cb(null, true);
      return cb(new Error('Origem não permitida pelo CORS'));
    },
  })
);

function validarSenha(senha) {
  if (typeof senha !== 'string') return 'Informe a senha.';
  if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) {
    return `A senha deve ter entre ${SENHA_MIN} e ${SENHA_MAX} caracteres.`;
  }
  if (!/[A-Z]/.test(senha)) return 'A senha precisa de ao menos 1 letra maiúscula.';
  if (!/[0-9]/.test(senha)) return 'A senha precisa de ao menos 1 número.';
  return null;
}

function validarEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function tokenPara(cliente) {
  return jwt.sign(
    {
      id: cliente.id,
      email: cliente.email,
      role: cliente.role,
      nome: cliente.nome,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function usuarioPublico(cliente) {
  return {
    id: cliente.id,
    email: cliente.email,
    nome: cliente.nome,
    displayName: cliente.nome,
    role: cliente.role,
    telefone: cliente.telefone || null,
  };
}

function authRequired(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (roles?.length && !roles.includes(payload.role)) {
        return res.status(403).json({ erro: 'Acesso negado.' });
      }
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
    }
  };
}

const tentativasLogin = new Map();
function limitarLogin(req, res, next) {
  const ip = req.ip || 'unknown';
  const agora = Date.now();
  const janela = 15 * 60 * 1000;
  const lista = (tentativasLogin.get(ip) || []).filter((t) => agora - t < janela);
  if (lista.length >= 20) {
    return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' });
  }
  lista.push(agora);
  tentativasLogin.set(ip, lista);
  return next();
}

async function buscarPorEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, empresa_id, nome, email, telefone, senha_hash, role
     FROM clientes
     WHERE empresa_id = $1 AND lower(email) = lower($2)
     LIMIT 1`,
    [empresaId, email]
  );
  return rows[0] || null;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/register', limitarLogin, async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const senha = String(req.body?.senha || '');
    const telefone = String(req.body?.telefone || '').trim() || null;

    if (!nome || nome.split(' ').filter(Boolean).length < 2) {
      return res.status(400).json({ erro: 'Informe nome e sobrenome.' });
    }
    if (!validarEmail(email)) {
      return res.status(400).json({ erro: 'E-mail inválido.' });
    }
    const erroSenha = validarSenha(senha);
    if (erroSenha) return res.status(400).json({ erro: erroSenha });

    const existente = await buscarPorEmail(email);
    if (existente?.senha_hash) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    let cliente;

    if (existente) {
      const { rows } = await pool.query(
        `UPDATE clientes
         SET nome = $1, telefone = COALESCE($2, telefone), senha_hash = $3, role = COALESCE(role, 'customer')
         WHERE id = $4
         RETURNING id, nome, email, telefone, role`,
        [nome, telefone, senhaHash, existente.id]
      );
      cliente = rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO clientes (empresa_id, nome, email, telefone, senha_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'customer')
         RETURNING id, nome, email, telefone, role`,
        [empresaId, nome, email, telefone, senhaHash]
      );
      cliente = rows[0];
    }

    const token = tokenPara(cliente);
    return res.status(201).json({ token, user: usuarioPublico(cliente) });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ erro: 'Erro ao criar conta.' });
  }
});

app.post('/auth/login', limitarLogin, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const senha = String(req.body?.senha || '');

    if (!validarEmail(email) || !senha) {
      return res.status(400).json({ erro: 'Preencha e-mail e senha.' });
    }

    const cliente = await buscarPorEmail(email);
    if (!cliente?.senha_hash) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const ok = await bcrypt.compare(senha, cliente.senha_hash);
    if (!ok) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const token = tokenPara(cliente);
    return res.json({ token, user: usuarioPublico(cliente) });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ erro: 'Erro ao entrar.' });
  }
});

app.get('/auth/me', authRequired(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, email, telefone, role FROM clientes WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(401).json({ erro: 'Usuário não encontrado.' });
    return res.json({ user: usuarioPublico(rows[0]) });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ erro: 'Erro ao validar sessão.' });
  }
});

function mapPedido(row) {
  return {
    id: row.id,
    numero: row.numero,
    metodo: row.metodo,
    status: row.status,
    total: Number(row.total),
    taxa_entrega: Number(row.taxa_entrega || 0),
    asaas_payment_id: row.asaas_payment_id,
    endereco_entrega: row.endereco_entrega,
    created_at: row.created_at,
    cliente: {
      id: row.cliente_id,
      nome: row.cliente_nome,
      email: row.cliente_email,
      telefone: row.cliente_telefone,
      cpf: row.cliente_cpf,
    },
    itens: row.itens || [],
  };
}

const SQL_PEDIDOS_BASE = `
  SELECT
    p.id, p.numero, p.metodo, p.status, p.total, p.taxa_entrega,
    p.asaas_payment_id, p.endereco_entrega, p.created_at, p.cliente_id,
    c.nome AS cliente_nome, c.email AS cliente_email,
    c.telefone AS cliente_telefone, c.cpf AS cliente_cpf,
    COALESCE(
      json_agg(
        json_build_object(
          'nome', pr.nome,
          'quantidade', i.quantidade,
          'preco', i.preco_unitario
        )
      ) FILTER (WHERE i.id IS NOT NULL),
      '[]'
    ) AS itens
  FROM pedidos p
  JOIN clientes c ON c.id = p.cliente_id
  LEFT JOIN pedido_itens i ON i.pedido_id = p.id
  LEFT JOIN produtos pr ON pr.id = i.produto_id
`;

app.get('/admin/pedidos', authRequired(['admin']), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `${SQL_PEDIDOS_BASE}
       WHERE p.empresa_id = $1
       GROUP BY p.id, c.nome, c.email, c.telefone, c.cpf
       ORDER BY p.id DESC`,
      [empresaId]
    );
    return res.json({ pedidos: rows.map(mapPedido) });
  } catch (err) {
    console.error('[admin/pedidos]', err);
    return res.status(500).json({ erro: 'Erro ao listar pedidos.' });
  }
});

app.patch('/admin/pedidos/:id/status', authRequired(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || '').trim().toUpperCase();
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: 'Pedido inválido.' });
    }
    if (!STATUS_PERMITIDOS.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.', statusPermitidos: STATUS_PERMITIDOS });
    }

    const { rows } = await pool.query(
      `UPDATE pedidos
       SET status = $1
       WHERE id = $2 AND empresa_id = $3
       RETURNING id, status, numero`,
      [status, id, empresaId]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    return res.json({ pedido: rows[0] });
  } catch (err) {
    console.error('[admin/status]', err);
    return res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
});

app.get('/cliente/pedidos', authRequired(['customer', 'admin']), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SQL_PEDIDOS_BASE}
       WHERE p.empresa_id = $1 AND p.cliente_id = $2
       GROUP BY p.id, c.nome, c.email, c.telefone, c.cpf
       ORDER BY p.id DESC`,
      [empresaId, req.user.id]
    );
    return res.json({ pedidos: rows.map(mapPedido) });
  } catch (err) {
    console.error('[cliente/pedidos]', err);
    return res.status(500).json({ erro: 'Erro ao listar seus pedidos.' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`[api] Arte Pharmaceutica API na porta ${PORT}`);
});
