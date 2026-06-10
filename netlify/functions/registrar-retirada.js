/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

const headers = {
  'access_token': ASAAS_API_KEY,
  'Content-Type': 'application/json',
};

async function criarOuBuscarCliente(c) {
  const cpf = c.cpf.replace(/\D/g, '');
  const busca = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${cpf}`, { headers });
  const res = await busca.json();
  if (res.data && res.data.length > 0) return res.data[0].id;

  const criar = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name:    c.nome,
      email:   c.email,
      phone:   c.telefone.replace(/\D/g, ''),
      cpfCnpj: cpf,
    }),
  });
  const novo = await criar.json();
  if (!novo.id) throw new Error(`Erro ao criar cliente: ${JSON.stringify(novo)}`);
  return novo.id;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { cliente, itens, total, unidadeRetirada } = JSON.parse(event.body);
    const customerId = await criarOuBuscarCliente(cliente);
    const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');
    const numero = `RET-${Date.now()}`;

    const venc = new Date();
    venc.setDate(venc.getDate() + 7);
    const dueDate = venc.toISOString().split('T')[0];

    const resp = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer:          customerId,
        billingType:       'UNDEFINED',
        value:             total,
        dueDate,
        description:       `[RETIRADA NA LOJA] ${unidadeRetirada} | Produtos: ${descricao}`,
        externalReference: numero,
      }),
    });

    const cobranca = await resp.json();

    if (!cobranca.id) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Erro ao registrar pedido', detalhes: cobranca }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, asaasId: cobranca.id }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: err.message }),
    };
  }
};