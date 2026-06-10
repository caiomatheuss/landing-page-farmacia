/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

const headers = {
  'access_token': ASAAS_API_KEY,
  'Content-Type': 'application/json',
};

function addBusinessDays(days) {
  const date = new Date();
  let count = 0;
  while (count < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return date.toISOString().split('T')[0];
}

function dadosEndereco(c) {
  return {
    address:       c.rua        || '',
    addressNumber: c.numero     || 'S/N',
    complement:    c.complemento || '',
    province:      c.bairro     || '',
    city:          c.cidade     || '',
    state:         c.estado     || '',
    postalCode:    (c.cep || '').replace(/\D/g, '') || '00000000',
  };
}

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
      ...dadosEndereco(c),
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
    const { cliente, itens, total } = JSON.parse(event.body);
    const customerId = await criarOuBuscarCliente(cliente);
    const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');
    const numero = `PED-${Date.now()}`;

    const resp = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer:          customerId,
        billingType:       'BOLETO',
        value:             total,
        dueDate:           addBusinessDays(3),
        description:       `Pedido Arte Pharmaceutica: ${descricao}`,
        externalReference: numero,
      }),
    });

    const cobranca = await resp.json();

    if (!cobranca.id) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Erro ao gerar boleto', detalhes: cobranca }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boletoUrl:   cobranca.bankSlipUrl,
        nossoNumero: cobranca.nossoNumero,
        vencimento:  cobranca.dueDate,
        asaasId:     cobranca.id,
        numero,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: err.message }),
    };
  }
};