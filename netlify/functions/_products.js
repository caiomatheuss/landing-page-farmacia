// ══════════════════════════════════════════════
//  _products.js — Catálogo de preços (servidor)
//  Esta é a ÚNICA fonte confiável de preço.
//  O que vier de "total" ou "price" no corpo da
//  requisição do navegador é sempre ignorado.
//
//  Se mudar um preço, mude AQUI e também em
//  checkout.html (que é só para exibição visual).
// ══════════════════════════════════════════════

export const PRODUCTS = {
  'curcuma-500':   { name: 'Cúrcuma 500mg',          price: 1 },
  'kit-unhas':     { name: 'Kit Cuidado Para Unhas', price: 1 },
  'malta-cabelao': { name: 'Malta Cabelão',          price: 11 },
  'pantoarte':     { name: 'Pantoarte',              price: 95 },
};

// Recalcula o total a partir do catálogo do servidor e da lista de
// { id, qty } que veio do navegador. Ignora qualquer "price"/"total"
// enviado junto — nunca confia em valor vindo do cliente.
// Lança erro se algum item não existir ou a quantidade for inválida.
export function calcularPedido(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('Carrinho vazio ou inválido.');
  }

  let total = 0;
  const linhas = [];

  for (const item of itens) {
    const produto = PRODUCTS[item?.id];
    if (!produto) {
      throw new Error(`Produto inválido: ${item?.id}`);
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 50) {
      throw new Error(`Quantidade inválida para ${item.id}`);
    }
    total += produto.price * qty;
    linhas.push(`${produto.name} (x${qty})`);
  }

  return {
    total: Math.round(total * 100) / 100,
    descricao: linhas.join(', '),
  };
}