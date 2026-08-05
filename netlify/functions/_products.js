// ══════════════════════════════════════════════
//  _products.js — Catálogo e pedidos (Neon)
//  Preço vem sempre do banco — nunca do navegador.
// ══════════════════════════════════════════════
import { sql } from './_db.js';

// Fixo por enquanto (só existe 1 farmácia). Quando virar SaaS
// multi-cliente, isso passa a vir de qual empresa está logada.
const EMPRESA_ID = 1;

// Recalcula o total a partir do banco de dados e da lista de
// { id, qty } que veio do navegador. Ignora qualquer "price"/"total"
// enviado junto. Lança erro se algum item não existir ou a
// quantidade for inválida.
export async function calcularPedido(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('Carrinho vazio ou inválido.');
  }

  const codigos = itens.map((i) => i?.id).filter(Boolean);
  if (codigos.length !== itens.length) {
    throw new Error('Item de carrinho inválido.');
  }

  const produtos = await sql`
    SELECT id, codigo, nome, preco
    FROM produtos
    WHERE empresa_id = ${EMPRESA_ID} AND codigo = ANY(${codigos}) AND ativo = true
  `;
  const porCodigo = Object.fromEntries(produtos.map((p) => [p.codigo, p]));

  let total = 0;
  const linhas = [];
  const itensCalculados = [];

  for (const item of itens) {
    const produto = porCodigo[item.id];
    if (!produto) throw new Error(`Produto inválido: ${item.id}`);

    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 50) {
      throw new Error(`Quantidade inválida para ${item.id}`);
    }

    const preco = Number(produto.preco);
    total += preco * qty;
    linhas.push(`${produto.nome} (x${qty})`);
    itensCalculados.push({ produtoId: produto.id, qty, preco });
  }

  return {
    total: Math.round(total * 100) / 100,
    descricao: linhas.join(', '),
    itensCalculados,
    empresaId: EMPRESA_ID,
  };
}

// Grava o pedido de verdade no banco (cliente + pedido + itens).
// Chamar DEPOIS que o Asaas já confirmou a cobrança.
export async function salvarPedido({
  empresaId,
  cliente,
  numero,
  metodo,
  total,
  asaasPaymentId,
  enderecoEntrega,
  itensCalculados,
}) {
  const [clienteRow] = await sql`
    INSERT INTO clientes (empresa_id, nome, email, telefone, cpf)
    VALUES (${empresaId}, ${cliente.nome}, ${cliente.email}, ${cliente.telefone || null}, ${cliente.cpf || null})
    ON CONFLICT (empresa_id, email) DO UPDATE
      SET nome = EXCLUDED.nome, telefone = EXCLUDED.telefone, cpf = EXCLUDED.cpf
    RETURNING id
  `;

  const [pedidoRow] = await sql`
    INSERT INTO pedidos (empresa_id, cliente_id, numero, metodo, status, total, asaas_payment_id, endereco_entrega)
    VALUES (${empresaId}, ${clienteRow.id}, ${numero}, ${metodo}, 'PENDENTE', ${total}, ${asaasPaymentId}, ${enderecoEntrega || null})
    RETURNING id
  `;

  for (const item of itensCalculados) {
    await sql`
      INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
      VALUES (${pedidoRow.id}, ${item.produtoId}, ${item.qty}, ${item.preco})
    `;
  }

  return pedidoRow.id;
}