/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

async function criarOuBuscarCliente(dadosCliente) {
  const busca = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${dadosCliente.cpf.replace(/\D/g, '')}`, {
    headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
  });
  const resultado = await busca.json();
  if (resultado.data && resultado.data.length > 0) return resultado.data[0].id;

  const criar = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
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
  const customerId = await criarOuBuscarCliente(cliente);
  const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');
  const numero = `PED-${Date.now()}`;

  // Vencimento: hoje + 1 dia
  const venc = new Date();
  venc.setDate(venc.getDate() + 1);
  const dueDate = venc.toISOString().split('T')[0];

  const resp = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: total,
      dueDate,
      description: `Pedido Arte Pharmaceutica: ${descricao}`,
      externalReference: numero,
    }),
  });

  const cobranca = await resp.json();

  if (!cobranca.id) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: 'Erro ao gerar PIX', detalhes: cobranca }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asaasId: cobranca.id,
      numero,
    }),
  };
};