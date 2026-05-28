/* global process */
// ══════════════════════════════════════════════
//  asaas-webhook.js — Netlify Function
//  Recebe notificações do Asaas.
//  Os pedidos já ficam no Asaas — só precisamos
//  confirmar o recebimento (status 200).
// ══════════════════════════════════════════════

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { event: tipo, payment } = payload;

  // Loga o evento recebido (visível nos logs do Netlify)
  console.log(`[Webhook Asaas] Evento: ${tipo} | ID: ${payment?.id} | Status: ${payment?.status}`);

  // Retorna 200 para o Asaas saber que recebemos
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};