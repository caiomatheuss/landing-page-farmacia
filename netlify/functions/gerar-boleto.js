/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

// Calcula data de vencimento em dias úteis
function addBusinessDays(days) {
  const date = new Date();
  let count = 0;
  while (count < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++; // pula sábado e domingo
  }
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function criarOuBuscarCliente(dadosCliente) {
  // Tenta buscar cliente pelo CPF
  const busca = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${dadosCliente.cpf.replace(/\D/g, '')}`, {
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  const resultado = await busca.json();

  if (resultado.data && resultado.data.length > 0) {
    return resultado.data[0].id; // cliente já existe
  }

  // Cria novo cliente
  const criar = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: dadosCliente.nome,
      email: dadosCliente.email,
      phone: dadosCliente.telefone.replace(/\D/g, ''),
      cpfCnpj: dadosCliente.cpf.replace(/\D/g, ''),
      address: dadosCliente.rua,
      addressNumber: dadosCliente.numero,
      complement: dadosCliente.complemento || '',
      province: dadosCliente.bairro,
      city: dadosCliente.cidade,
      state: dadosCliente.estado,
      postalCode: dadosCliente.cep.replace(/\D/g, ''),
    }),
  });
  const novoCliente = await criar.json();
  return novoCliente.id;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { cliente, itens, total } = JSON.parse(event.body);

  // 1. Cria ou busca cliente no Asaas
  const customerId = await criarOuBuscarCliente(cliente);

  // 2. Gera descrição dos itens
  const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');

  // 3. Cria cobrança boleto
  const resp = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'BOLETO',
      value: total,
      dueDate: addBusinessDays(3),
      description: `Pedido Arte Pharmaceutica: ${descricao}`,
      externalReference: `pedido_${Date.now()}`,
    }),
  });

  const cobranca = await resp.json();

  if (!cobranca.id) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: 'Erro ao gerar boleto', detalhes: cobranca }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      boletoUrl: cobranca.bankSlipUrl,
      nossoNumero: cobranca.nossoNumero,
      vencimento: cobranca.dueDate,
    }),
  };
};