/* global process */
import { calcularPedido, garantirPedidoPago } from './_products.js';
import { resolverTaxaEntrega } from '../../entrega-taxas.js';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_URL = 'https://api.asaas.com/v3';

const headers = {
  access_token: ASAAS_API_KEY,
  'Content-Type': 'application/json',
};

function enderecoDe(cliente) {
  return [cliente.rua, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
    .filter(Boolean)
    .join(', ');
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { cliente, itens, asaasId, numero } = JSON.parse(event.body || '{}');

    if (!asaasId || !cliente) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Dados do pagamento incompletos.' }),
      };
    }

    const resp = await fetch(`${ASAAS_URL}/payments/${encodeURIComponent(asaasId)}`, { headers });
    const payment = await resp.json();

    if (!resp.ok || !payment.id) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Não foi possível confirmar o pagamento no Asaas.' }),
      };
    }

    const status = payment.status;
    if (status !== 'RECEIVED' && status !== 'CONFIRMED') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'O PIX ainda não foi confirmado.', status }),
      };
    }

    let total, itensCalculados, empresaId, taxaEntrega;
    try {
      ({ total, itensCalculados, empresaId } = await calcularPedido(itens));
      taxaEntrega = resolverTaxaEntrega(cliente).taxa;
      total = Math.round((total + taxaEntrega) * 100) / 100;
    } catch (err) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: err.message }),
      };
    }

    if (Math.abs(Number(payment.value) - total) > 0.05) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'O valor pago não corresponde ao pedido. Fale com a farmácia.' }),
      };
    }

    const pedidoId = await garantirPedidoPago({
      empresaId,
      cliente,
      numero: payment.externalReference || numero || `PED-${Date.now()}`,
      metodo: 'PIX',
      total,
      taxaEntrega,
      asaasPaymentId: payment.id,
      enderecoEntrega: enderecoDe(cliente),
      itensCalculados,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, pedidoId, status: 'PAGO' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: err.message }),
    };
  }
};
