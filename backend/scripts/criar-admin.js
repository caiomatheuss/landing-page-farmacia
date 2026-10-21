/* global process */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const [emailArg, senha, nome = 'Administrador'] = process.argv.slice(2);
const EMPRESA_ID = Number(process.env.EMPRESA_ID || 1);

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL no backend/.env');
  process.exit(1);
}

if (!emailArg || !senha) {
  console.error('Uso: node scripts/criar-admin.js email@farmacia.com SenhaForte1 "Nome Admin"');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const hash = await bcrypt.hash(senha, 10);
const existente = await pool.query(
  `SELECT id FROM clientes WHERE empresa_id = $1 AND lower(email) = $2 LIMIT 1`,
  [EMPRESA_ID, email]
);

let row;
if (existente.rows[0]) {
  const updated = await pool.query(
    `UPDATE clientes
     SET nome = $1, senha_hash = $2, role = 'admin'
     WHERE id = $3
     RETURNING id, email, role`,
    [nome, hash, existente.rows[0].id]
  );
  row = updated.rows[0];
} else {
  const inserted = await pool.query(
    `INSERT INTO clientes (empresa_id, nome, email, senha_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, email, role`,
    [EMPRESA_ID, nome, email, hash]
  );
  row = inserted.rows[0];
}

console.log('Admin pronto:', row);
await pool.end();
