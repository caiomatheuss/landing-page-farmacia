/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const resp = await fetch(`${ASAAS_URL}/payments?limit=50&offset=0`, {
    headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
  });

  const data = await resp.json();

  if (!resp.ok) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: 'Erro ao buscar pedidos', detalhes: data }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};