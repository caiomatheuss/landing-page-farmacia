/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { asaasId } = event.queryStringParameters || {};

  if (!asaasId) {
    return { statusCode: 400, body: JSON.stringify({ erro: 'asaasId obrigatório' }) };
  }

  const resp = await fetch(`${ASAAS_URL}/payments/${asaasId}`, {
    headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
  });

  const payment = await resp.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: payment.status, // PENDING, RECEIVED, CONFIRMED, OVERDUE, etc.
      id: payment.id,
    }),
  };
};