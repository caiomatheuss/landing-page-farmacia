/* global process */
// Registra pedido de retirada na loja usando o Asaas como "UNDEFINED" (sem cobrança online)
// O pedido fica como PENDING no Asaas e aparece no admin com a unidade de retirada na descrição

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
    }),
  });
  const novoCliente = await criar.json();
  return novoCliente.id;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { cliente, itens, total, unidadeRetirada } = JSON.parse(event.body);
  const customerId = await criarOuBuscarCliente(cliente);
  const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');
  const numero = `RET-${Date.now()}`;

  // Vencimento em 7 dias (prazo para retirar)
  const venc = new Date();
  venc.setDate(venc.getDate() + 7);
  const dueDate = venc.toISOString().split('T')[0];

  // Cria cobrança como UNDEFINED — aparece no admin mas não gera boleto/pix
  const resp = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'UNDEFINED',
      value: total,
      dueDate,
      // Descrição inclui a unidade de retirada — aparece no admin
      description: `[RETIRADA NA LOJA] ${unidadeRetirada} | Produtos: ${descricao}`,
      externalReference: numero,
    }),
  });

  const cobranca = await resp.json();

  if (!cobranca.id) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: 'Erro ao registrar pedido', detalhes: cobranca }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero, asaasId: cobranca.id }),
  };
};