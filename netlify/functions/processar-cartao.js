/* global process */
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

const headers = {
  'access_token': ASAAS_API_KEY,
  'Content-Type': 'application/json',
};

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
    const { cliente, itens, total, cartao, parcelas } = JSON.parse(event.body);
    const customerId = await criarOuBuscarCliente(cliente);
    const descricao = itens.map(i => `${i.name} (x${i.qty})`).join(', ');
    const numero = `PED-${Date.now()}`;
    const [mesValidade, anoValidade] = cartao.validade.split('/');
    const cepLimpo = (cliente.cep || '').replace(/\D/g, '') || '00000000';

    const resp = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer:          customerId,
        billingType:       'CREDIT_CARD',
        value:             total,
        dueDate:           new Date().toISOString().split('T')[0],
        description:       `Pedido Arte Pharmaceutica: ${descricao}`,
        externalReference: numero,
        installmentCount:  parcelas > 1 ? parcelas : undefined,
        installmentValue:  parcelas > 1 ? parseFloat((total / parcelas).toFixed(2)) : undefined,
        creditCard: {
          holderName:  cartao.nome,
          number:      cartao.numero.replace(/\s/g, ''),
          expiryMonth: mesValidade,
          expiryYear:  `20${anoValidade}`,
          ccv:         cartao.cvv,
        },
        creditCardHolderInfo: {
          name:          cliente.nome,
          email:         cliente.email,
          cpfCnpj:       cliente.cpf.replace(/\D/g, ''),
          postalCode:    cepLimpo,
          addressNumber: cliente.numero || 'S/N',
          phone:         cliente.telefone.replace(/\D/g, ''),
        },
      }),
    });

    const cobranca = await resp.json();

    if (!cobranca.id || cobranca.status === 'DECLINED') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          erro: cobranca.errors?.[0]?.description || 'Cartão recusado. Verifique os dados e tente novamente.',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucesso:  true,
        status:   cobranca.status,
        asaasId:  cobranca.id,
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