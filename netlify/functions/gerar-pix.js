/* global process */
import { calcularPedido, salvarPedido } from './_products.js';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

const headers = {
  'access_token': ASAAS_API_KEY,
  'Content-Type': 'application/json',
};

// Campos de endereço são opcionais — clientes que retiram na loja não têm CEP
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
      name:     c.nome,
      email:    c.email,
      phone:    c.telefone.replace(/\D/g, ''),
      cpfCnpj:  cpf,
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
    const { cliente, itens } = JSON.parse(event.body);

    // Preço vem só do banco de dados — "total" do navegador é ignorado
    let total, descricao, itensCalculados, empresaId;
    try {
      ({ total, descricao, itensCalculados, empresaId } = await calcularPedido(itens));
    } catch (err) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: err.message }),
      };
    }

    const customerId = await criarOuBuscarCliente(cliente);
    const numero = `PED-${Date.now()}`;

    const venc = new Date();
    venc.setDate(venc.getDate() + 1);
    const dueDate = venc.toISOString().split('T')[0];

    // 1. Cria cobrança PIX
    const respCobranca = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer:          customerId,
        billingType:       'PIX',
        value:             total,
        dueDate,
        description:       `Pedido Arte Pharmaceutica: ${descricao}`,
        externalReference: numero,
      }),
    });
    const cobranca = await respCobranca.json();

    if (!cobranca.id) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Erro ao criar cobrança PIX no Asaas', detalhes: cobranca }),
      };
    }

    // 2. Busca QR Code — aguarda até 3s se necessário (Asaas pode demorar um instante)
    let qrData = {};
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const qrResp = await fetch(`${ASAAS_URL}/payments/${cobranca.id}/pixQrCode`, { headers });
      qrData = await qrResp.json();
      if (qrData.payload) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    // Salva o pedido de verdade no banco (não trava a resposta se falhar —
    // o pagamento já foi criado no Asaas, isso aqui é só nosso histórico)
    try {
      await salvarPedido({
        empresaId,
        cliente,
        numero,
        metodo: 'PIX',
        total,
        asaasPaymentId: cobranca.id,
        enderecoEntrega: [cliente.rua, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado].filter(Boolean).join(', '),
        itensCalculados,
      });
    } catch (err) {
      console.error('[gerar-pix] Falha ao salvar pedido no Neon:', err.message);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asaasId:      cobranca.id,
        numero,
        pixCopiaCola: qrData.payload       || null,
        qrCodeBase64: qrData.encodedImage  || null,
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