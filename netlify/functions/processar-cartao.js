/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

async function criarOuBuscarCliente(dadosCliente) {
  const busca = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${dadosCliente.cpf.replace(/\D/g, '')}`, {
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  const resultado = await busca.json();

  if (resultado.data && resultado.data.length > 0) {
    return resultado.data[0].id;
  }

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

  const { cliente, itens, total, cartao, parcelas } = JSON.parse(event.body);

  // 1. Cria ou busca cliente
  const customerId = await criarOuBuscarCliente(cliente);

  // 2. Descrição dos itens
  const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');

  // 3. Processa pagamento com cartão
  const [mesValidade, anoValidade] = cartao.validade.split('/');

  const resp = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: total,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Pedido Arte Pharmaceutica: ${descricao}`,
      externalReference: `pedido_${Date.now()}`,
      installmentCount: parcelas > 1 ? parcelas : undefined,
      installmentValue: parcelas > 1 ? parseFloat((total / parcelas).toFixed(2)) : undefined,
      creditCard: {
        holderName: cartao.nome,
        number: cartao.numero.replace(/\s/g, ''),
        expiryMonth: mesValidade,
        expiryYear: `20${anoValidade}`,
        ccv: cartao.cvv,
      },
      creditCardHolderInfo: {
        name: cliente.nome,
        email: cliente.email,
        cpfCnpj: cliente.cpf.replace(/\D/g, ''),
        postalCode: cliente.cep.replace(/\D/g, ''),
        addressNumber: cliente.numero,
        phone: cliente.telefone.replace(/\D/g, ''),
      },
    }),
  });

  const cobranca = await resp.json();

  if (!cobranca.id || cobranca.status === 'DECLINED') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        erro: cobranca.errors?.[0]?.description || 'Cartão recusado. Verifique os dados e tente novamente.',
      }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sucesso: true,
      status: cobranca.status,
      id: cobranca.id,
    }),
  };
};