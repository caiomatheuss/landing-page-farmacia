/* global process */
// Busca pedidos do Asaas pelo e-mail do cliente
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';
const headers = { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' };

export const handler = async (event) => {
  const email = event.queryStringParameters?.email;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ erro: 'E-mail não informado' }) };
  }

  // Busca cliente pelo e-mail no Asaas
  const respCliente = await fetch(`${ASAAS_URL}/customers?email=${encodeURIComponent(email)}&limit=1`, { headers });
  const dataCliente = await respCliente.json();

  if (!dataCliente.data || !dataCliente.data.length) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidos: [] }),
    };
  }

  const customerId = dataCliente.data[0].id;

  // Busca pagamentos desse cliente
  const respPag = await fetch(`${ASAAS_URL}/payments?customer=${customerId}&limit=50`, { headers });
  const dataPag = await respPag.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pedidos: dataPag.data || [] }),
  };
};