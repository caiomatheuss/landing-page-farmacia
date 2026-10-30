import { supabaseAdmin } from './_supabase.js';

const EMPRESA_ID = 1;

export async function calcularPedido(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('Carrinho vazio ou inválido.');
  }

  const codigos = itens.map((item) => item?.id).filter(Boolean);
  if (codigos.length !== itens.length) {
    throw new Error('Item de carrinho inválido.');
  }

  const { data: produtos, error } = await supabaseAdmin
    .from('produtos')
    .select('id, codigo, nome, preco')
    .eq('empresa_id', EMPRESA_ID)
    .eq('ativo', true)
    .in('codigo', codigos);

  if (error) throw new Error(error.message);

  const porCodigo = Object.fromEntries((produtos || []).map((produto) => [produto.codigo, produto]));
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

async function garantirCliente(empresaId, cliente) {
  const email = String(cliente.email || '').trim().toLowerCase();
  const nome = String(cliente.nome || '').trim();
  const telefone = cliente.telefone || null;
  const cpf = cliente.cpf || null;

  const { data: existente, error: buscaErr } = await supabaseAdmin
    .from('clientes')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('email', email)
    .maybeSingle();

  if (buscaErr) throw new Error(buscaErr.message);

  if (existente) {
    const { error } = await supabaseAdmin
      .from('clientes')
      .update({ nome, telefone, cpf })
      .eq('id', existente.id);
    if (error) throw new Error(error.message);
    return existente.id;
  }

  const { data: criado, error } = await supabaseAdmin
    .from('clientes')
    .insert({
      empresa_id: empresaId,
      nome,
      email,
      telefone,
      cpf,
      role: 'customer',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return criado.id;
}

export async function salvarPedido({
  empresaId,
  cliente,
  numero,
  metodo,
  total,
  taxaEntrega = 0,
  asaasPaymentId,
  enderecoEntrega,
  itensCalculados,
  status = 'PENDENTE',
}) {
  const clienteId = await garantirCliente(empresaId, cliente);

  const { data: pedido, error } = await supabaseAdmin
    .from('pedidos')
    .insert({
      empresa_id: empresaId,
      cliente_id: clienteId,
      numero,
      metodo,
      status,
      total,
      taxa_entrega: Number(taxaEntrega) || 0,
      asaas_payment_id: asaasPaymentId,
      endereco_entrega: enderecoEntrega || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  const { error: itensErr } = await supabaseAdmin.from('pedido_itens').insert(
    itensCalculados.map((item) => ({
      pedido_id: pedido.id,
      produto_id: item.produtoId,
      quantidade: item.qty,
      preco_unitario: item.preco,
    }))
  );

  if (itensErr) throw new Error(itensErr.message);
  return pedido.id;
}

export async function garantirPedidoPago(dados) {
  const { data: existente, error } = await supabaseAdmin
    .from('pedidos')
    .select('id, status')
    .eq('asaas_payment_id', dados.asaasPaymentId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (existente) {
    if (existente.status !== 'PAGO') {
      const { error: updateErr } = await supabaseAdmin
        .from('pedidos')
        .update({ status: 'PAGO' })
        .eq('id', existente.id);
      if (updateErr) throw new Error(updateErr.message);
    }
    return existente.id;
  }

  return salvarPedido({ ...dados, status: 'PAGO' });
}
