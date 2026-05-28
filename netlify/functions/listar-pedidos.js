/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

const headers = { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' };

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Busca pagamentos
  const respPagamentos = await fetch(`${ASAAS_URL}/payments?limit=50&offset=0`, { headers });
  const dataPagamentos = await respPagamentos.json();
  const pagamentos = dataPagamentos.data || [];

  // Para cada pagamento, busca dados do cliente
  const pagamentosComCliente = await Promise.all(
    pagamentos.map(async (p) => {
      if (!p.customer) return p;
      const respCliente = await fetch(`${ASAAS_URL}/customers/${p.customer}`, { headers });
      const cliente = await respCliente.json();
      return { ...p, clienteDetalhes: cliente };
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: pagamentosComCliente }),
  };
};