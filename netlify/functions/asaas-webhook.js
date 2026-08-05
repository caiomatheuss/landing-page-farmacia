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

  // ── Validação de origem ──
  // O Asaas envia o token configurado no painel dele no header
  // 'asaas-access-token'. Sem checar isso, qualquer pessoa pode mandar
  // um POST fingindo ser uma notificação de pagamento.
  const tokenRecebido = event.headers['asaas-access-token'];
  const tokenEsperado = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    console.warn('[Webhook Asaas] Requisição rejeitada: token ausente ou inválido.');
    return { statusCode: 401, body: 'Unauthorized' };
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