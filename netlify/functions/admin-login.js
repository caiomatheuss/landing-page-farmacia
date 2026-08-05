/* global process */
// ══════════════════════════════════════════════
//  admin-login.js — Netlify Function
//  Valida a senha do admin NO SERVIDOR e devolve
//  um token de sessão (também guardado só no
//  servidor) que o painel usa nas próximas chamadas.
//  A senha real nunca fica no código nem no navegador.
// ══════════════════════════════════════════════

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!ADMIN_PASSWORD || !ADMIN_TOKEN) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'ADMIN_PASSWORD/ADMIN_TOKEN não configurados no Netlify.' }),
    };
  }

  try {
    const { senha } = JSON.parse(event.body || '{}');

    if (senha !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Senha incorreta.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ADMIN_TOKEN }),
    };
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Corpo da requisição inválido.' }),
    };
  }
};