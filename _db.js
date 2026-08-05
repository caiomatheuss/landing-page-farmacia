/* global process */
// ══════════════════════════════════════════════
//  _db.js — Conexão com o Neon (Postgres)
//  Usa o driver serverless (via HTTP), feito pra
//  rodar bem em Netlify Functions.
// ══════════════════════════════════════════════
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL não configurada nas variáveis de ambiente.');
}

export const sql = neon(process.env.DATABASE_URL);