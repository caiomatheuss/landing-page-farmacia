import { createClient } from 'https://cdn.jsdelivr.net/npm/@base44/sdk@latest/dist/index.js';

const base44 = createClient({ appId: 'SEU_APP_ID_AQUI' });

const CHAVE_PIX   = 'artepharmaceutica@pix.com.br';
const MAX_PARCELAS = 6;

const state = {
  currentStep: 1,
  payMethod: 'cartao',
  formData: {},
  cartItems: [],
  cartTotal: 0,
  asaasId: null,
  pollingInterval: null,
};

/* ════════════ SALVAR PEDIDO ════════════ */
async function salvarPedido(dados) {
  try {
    await base44.entities.Pedido.create(dados);
  } catch(e) {
    console.warn('Erro ao salvar pedido:', e);
  }
}

/* ════════════ CARRINHO ════════════ */
function loadCart() {
  try {
    const raw = localStorage.getItem('arte_cart');
    state.cartItems = raw ? JSON.parse(raw) : [];
    state.cartTotal = state.cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  } catch (e) {
    state.cartItems = [];
    state.cartTotal = 0;
  }
}

function renderSummary() {
  const el = document.getElementById('summaryContent');
  if (!el) return;
  if (!state.cartItems.length) {
    el.innerHTML = `<div class="co-empty-cart"><p>Seu carrinho está vazio</p><a href="index.html#showroom" class="co-btn-primary" style="max-width:200px;margin:0 auto;text-decoration:none;display:inline-flex;font-size:0.65rem;">Ver produtos</a></div>`;
    return;
  }
  const itemsHTML = state.cartItems.map(item => `
    <li class="co-summary-item">
      <img class="co-summary-item-img" src="${item.img||''}" alt="${item.name||''}" onerror="this.style.opacity='0'">
      <div class="co-summary-item-info">
        <div class="co-summary-item-name">${item.name||'—'}</div>
        <div class="co-summary-item-qty">Qtd: ${item.qty||1}</div>
      </div>
      <div class="co-summary-item-price">R$ ${((item.price||0)*(item.qty||1)).toFixed(2).replace('.', ',')}</div>
    </li>`).join('');
  el.innerHTML = `
    <ul class="co-summary-items">${itemsHTML}</ul>
    <div class="co-summary-divider"></div>
    <div class="co-summary-line"><span>Subtotal</span><span>R$ ${state.cartTotal.toFixed(2).replace('.', ',')}</span></div>
    <div class="co-summary-line"><span>Frete</span><span>${state.cartTotal > 0 ? 'A calcular' : '—'}</span></div>
    <div class="co-summary-line co-summary-line--total"><span>Total</span><span>R$ ${state.cartTotal.toFixed(2).replace('.', ',')}</span></div>`;
}

/* ════════════ PARCELAS ════════════ */
function populateParcelas() {
  const select = document.getElementById('selectParcelas');
  if (!select) return;
  select.innerHTML = '';
  const total = state.cartTotal || 99.00;
  for (let i = 1; i <= MAX_PARCELAS; i++) {
    const valor = (total / i).toFixed(2).replace('.', ',');
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i === 1 ? `1x de R$ ${valor} (à vista)` : `${i}x de R$ ${valor} sem juros`;
    select.appendChild(opt);
  }
}

/* ════════════ STEPPER ════════════ */
function updateStepper(step) {
  [1,2,3].forEach(n => {
    const el = document.getElementById(`stepIndicator${n}`);
    if (!el) return;
    el.classList.remove('is-active','is-done');
    if (n < step) el.classList.add('is-done');
    if (n === step) el.classList.add('is-active');
  });
}

function goToStep(step) {
  state.currentStep = step;
  updateStepper(step);
  document.getElementById('step1Panel').classList.toggle('u-hidden', step !== 1);
  document.getElementById('step2Panel').classList.toggle('u-hidden', step !== 2);
  document.getElementById('step3Panel').classList.toggle('u-hidden', step !== 3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ════════════ VALIDAÇÃO ════════════ */
function validateStep1() {
  let valid = true;
  function check(fieldId, inputId, testFn) {
    const field = document.getElementById(fieldId);
    const input = document.getElementById(inputId);
    if (!field || !input) return;
    const ok = testFn(input.value.trim());
    field.classList.toggle('has-error', !ok);
    if (!ok) valid = false;
  }
  check('fieldNome',         'inputNome',         v => v.length >= 3 && v.includes(' '));
  check('fieldEmail',        'inputEmail',        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  check('fieldTelefone',     'inputTelefone',     v => v.replace(/\D/g,'').length >= 10);
  check('fieldCpf',          'inputCpf',          v => v.replace(/\D/g,'').length === 11);
  check('fieldCep',          'inputCep',          v => v.replace(/\D/g,'').length === 8);
  check('fieldDestinatario', 'inputDestinatario', v => v.length >= 3);
  check('fieldRua',          'inputRua',          v => v.length >= 3);
  check('fieldNumero',       'inputNumero',       v => v.length >= 1);
  check('fieldBairro',       'inputBairro',       v => v.length >= 2);
  check('fieldCidade',       'inputCidade',       v => v.length >= 2);
  check('fieldEstado',       'inputEstado',       v => v.length === 2);
  return valid;
}

/* ════════════ MÁSCARAS ════════════ */
function applyMasks() {
  const masks = {
    inputCpf: v => { v = v.replace(/\D/g,'').substring(0,11); if(v.length>9) v=v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4'); else if(v.length>6) v=v.replace(/(\d{3})(\d{3})(\d{3})/,'$1.$2.$3'); else if(v.length>3) v=v.replace(/(\d{3})(\d{3})/,'$1.$2'); return v; },
    inputCep: v => { v = v.replace(/\D/g,'').substring(0,8); if(v.length>5) v=v.replace(/(\d{5})(\d{3})/,'$1-$2'); return v; },
    inputTelefone: v => { v=v.replace(/\D/g,'').substring(0,11); if(v.length>10) v=v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3'); else if(v.length>6) v=v.replace(/(\d{2})(\d{4})(\d+)/,'($1) $2-$3'); else if(v.length>2) v=v.replace(/(\d{2})(\d+)/,'($1) $2'); return v; },
    inputCardNum: v => { v=v.replace(/\D/g,'').substring(0,16); return v.replace(/(\d{4})/g,'$1 ').trim(); },
    inputCardExp: v => { v=v.replace(/\D/g,'').substring(0,4); if(v.length>2) v=v.replace(/(\d{2})(\d{2})/,'$1/$2'); return v; },
  };
  Object.entries(masks).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { el.value = fn(el.value); });
  });
}

/* ════════════ CEP ════════════ */
async function buscarCep() {
  const cepInput = document.getElementById('inputCep');
  if (!cepInput) return;
  const nums = cepInput.value.replace(/\D/g,'');
  if (nums.length !== 8) return;
  const btn = document.getElementById('btnBuscarCep');
  if (btn) { btn.textContent = '...'; btn.disabled = true; }
  try {
    const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`);
    const data = await res.json();
    if (!data.erro) {
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      set('inputRua', data.logradouro);
      set('inputBairro', data.bairro);
      set('inputCidade', data.localidade);
      set('inputEstado', data.uf);
      document.getElementById('inputNumero')?.focus();
    }
  } catch {}
  if (btn) { btn.textContent = 'Atualizar'; btn.disabled = false; }
}

/* ════════════ POLLING — verifica pagamento a cada 5s ════════════ */
function iniciarPolling(asaasId, metodo) {
  if (!asaasId) return;
  state.asaasId = asaasId;

  // Mostra painel de aguardando
  document.getElementById('pollingBox')?.classList.add('is-active');
  document.getElementById('btnFinalizarPedido').style.display = 'none';
  document.querySelectorAll('.co-pay-methods').forEach(el => el.style.pointerEvents = 'none');

  let tentativas = 0;
  const MAX_TENTATIVAS = 72; // 72 * 5s = 6 minutos
  let timerEl = document.getElementById('pollingTimer');

  state.pollingInterval = setInterval(async () => {
    tentativas++;

    if (timerEl) timerEl.textContent = `Verificando pagamento… (${tentativas * 5}s)`;

    const resp = await fetch(`/.netlify/functions/verificar-pagamento?asaasId=${asaasId}`);
    const data = await resp.json();

    // Status de pagamento confirmado no Asaas
    if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
      pararPolling();
      pagamentoConfirmado(metodo);
      return;
    }

    // Timeout após 6 minutos
    if (tentativas >= MAX_TENTATIVAS) {
      pararPolling();
      // Mesmo sem confirmação automática, vai para etapa 3 com mensagem pendente
      confirmarPedido(metodo);
    }
  }, 5000);
}

function pararPolling() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
  }
}

function pagamentoConfirmado(metodo) {
  // Esconde spinner e mostra confirmado
  document.getElementById('pollingBox')?.classList.remove('is-active');
  document.getElementById('pollingConfirmed')?.classList.add('is-active');

  // Aguarda 2s para mostrar tela de confirmação final
  setTimeout(() => {
    confirmarPedido(metodo, true);
  }, 2000);
}

/* ════════════ PIX ════════════ */
function setupPix() {
  const display = document.getElementById('pixKeyDisplay');
  if (display) display.textContent = CHAVE_PIX;
}

function setupCopyPix() {
  const btn = document.getElementById('btnCopyPix');
  const fb  = document.getElementById('pixFeedback');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = CHAVE_PIX; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    btn.classList.add('is-copied');
    if (fb) fb.textContent = '✓ Chave copiada com sucesso!';
    setTimeout(() => { btn.classList.remove('is-copied'); if (fb) fb.textContent = ''; }, 3500);
  });
}

/* ════════════ BOLETO ════════════ */
function setupBoleto() {
  const btn     = document.getElementById('btnGerarBoleto');
  const success = document.getElementById('boletoSuccess');
  const link    = document.getElementById('boletoLink');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true; btn.textContent = 'Gerando…';
    const resp = await fetch('/.netlify/functions/gerar-boleto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: state.formData, itens: state.cartItems, total: state.cartTotal }),
    });
    const data = await resp.json();
    if (resp.ok && data.boletoUrl) {
      btn.style.display = 'none';
      if (link) link.href = data.boletoUrl;
      if (success) success.classList.add('is-visible');
      window.open(data.boletoUrl, '_blank');
      await salvarPedido({
        numero: data.numero, status: 'pendente', metodo_pagamento: 'boleto',
        total: state.cartTotal, itens: JSON.stringify(state.cartItems),
        cliente_nome: state.formData.nome, cliente_email: state.formData.email,
        cliente_telefone: state.formData.telefone, cliente_cpf: state.formData.cpf,
        endereco_rua: state.formData.rua, endereco_numero: state.formData.numero,
        endereco_complemento: state.formData.complemento||'', endereco_bairro: state.formData.bairro,
        endereco_cidade: state.formData.cidade, endereco_estado: state.formData.estado,
        endereco_cep: state.formData.cep, asaas_id: data.asaasId, boleto_url: data.boletoUrl,
      });
      // Inicia polling após gerar boleto
      iniciarPolling(data.asaasId, 'boleto');
    } else {
      btn.disabled = false; btn.textContent = 'Gerar boleto';
      alert('Erro ao gerar boleto. Tente novamente.');
    }
  });
}

/* ════════════ FINALIZAR PEDIDO ════════════ */
function setupFinalizarPedido() {
  const btn = document.getElementById('btnFinalizarPedido');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (state.payMethod === 'cartao') {
      await processarCartao(btn);
    } else if (state.payMethod === 'pix') {
      await processarPix(btn);
    }
    // boleto já tem seu próprio fluxo no botão "Gerar boleto"
  });
}

async function processarPix(btn) {
  btn.disabled = true;
  btn.textContent = 'Gerando cobrança PIX…';

  const resp = await fetch('/.netlify/functions/gerar-pix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: state.formData, itens: state.cartItems, total: state.cartTotal }),
  });
  const data = await resp.json();

  if (resp.ok && data.asaasId) {
    await salvarPedido({
      numero: data.numero, status: 'pendente', metodo_pagamento: 'pix',
      total: state.cartTotal, itens: JSON.stringify(state.cartItems),
      cliente_nome: state.formData.nome, cliente_email: state.formData.email,
      cliente_telefone: state.formData.telefone, cliente_cpf: state.formData.cpf,
      endereco_rua: state.formData.rua, endereco_numero: state.formData.numero,
      endereco_complemento: state.formData.complemento||'', endereco_bairro: state.formData.bairro,
      endereco_cidade: state.formData.cidade, endereco_estado: state.formData.estado,
      endereco_cep: state.formData.cep, asaas_id: data.asaasId,
    });
    iniciarPolling(data.asaasId, 'pix');
  } else {
    btn.disabled = false;
    btn.innerHTML = 'Finalizar pedido <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    alert(data.erro || 'Erro ao gerar cobrança PIX.');
  }
}

async function processarCartao(btn) {
  const numero   = document.getElementById('inputCardNum')?.value.trim();
  const nome     = document.getElementById('inputCardName')?.value.trim();
  const validade = document.getElementById('inputCardExp')?.value.trim();
  const cvv      = document.getElementById('inputCardCvv')?.value.trim();
  const parcelas = parseInt(document.getElementById('selectParcelas')?.value || '1');

  if (!numero || numero.replace(/\s/g,'').length < 16) { alert('Informe o número do cartão completo.'); return; }
  if (!nome) { alert('Informe o nome como está no cartão.'); return; }
  if (!validade || validade.length < 5) { alert('Informe a validade do cartão.'); return; }
  if (!cvv || cvv.length < 3) { alert('Informe o CVV do cartão.'); return; }

  btn.disabled = true; btn.textContent = 'Processando pagamento…';

  const resp = await fetch('/.netlify/functions/processar-cartao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: state.formData, itens: state.cartItems, total: state.cartTotal, parcelas, cartao: { numero, nome, validade, cvv } }),
  });
  const data = await resp.json();

  if (resp.ok && data.sucesso) {
    await salvarPedido({
      numero: data.numero, status: 'pago', metodo_pagamento: 'cartao',
      total: state.cartTotal, itens: JSON.stringify(state.cartItems),
      cliente_nome: state.formData.nome, cliente_email: state.formData.email,
      cliente_telefone: state.formData.telefone, cliente_cpf: state.formData.cpf,
      endereco_rua: state.formData.rua, endereco_numero: state.formData.numero,
      endereco_complemento: state.formData.complemento||'', endereco_bairro: state.formData.bairro,
      endereco_cidade: state.formData.cidade, endereco_estado: state.formData.estado,
      endereco_cep: state.formData.cep, asaas_id: data.asaasId,
    });
    confirmarPedido('cartao', true);
  } else {
    btn.disabled = false;
    btn.innerHTML = 'Finalizar pedido <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    alert(data.erro || 'Erro ao processar pagamento. Tente novamente.');
  }
}

function confirmarPedido(metodo, confirmado = false) {
  pararPolling();
  metodo = metodo || state.payMethod;
  localStorage.removeItem('arte_cart');
  const msgs = {
    cartao: 'Seu pagamento com cartão foi aprovado! Em breve você receberá a confirmação por e-mail.',
    pix:    confirmado ? 'PIX recebido e confirmado! Seu pedido já está sendo preparado.' : 'Pagamento PIX pendente. Assim que identificarmos, seu pedido será liberado.',
    boleto: confirmado ? 'Boleto pago e confirmado! Seu pedido já está sendo preparado.' : 'Boleto gerado. O pedido será processado após o pagamento.',
  };
  const confirmText = document.getElementById('confirmText');
  if (confirmText) confirmText.textContent = msgs[metodo] || msgs.cartao;
  goToStep(3);
}

/* ════════════ EVENTS ════════════ */
function setupPayMethodSwitch() {
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.payMethod = radio.value;
      document.querySelectorAll('.co-method-panel').forEach(p => p.classList.remove('is-active'));
      const panelMap = { cartao: 'panelCartao', pix: 'panelPix', boleto: 'panelBoleto' };
      document.getElementById(panelMap[radio.value])?.classList.add('is-active');
    });
  });
}

function setupEvents() {
  const form1 = document.getElementById('formStep1');
  if (form1) {
    form1.addEventListener('submit', e => {
      e.preventDefault();
      if (validateStep1()) {
        state.formData = {
          nome:         document.getElementById('inputNome')?.value,
          email:        document.getElementById('inputEmail')?.value,
          telefone:     document.getElementById('inputTelefone')?.value,
          cpf:          document.getElementById('inputCpf')?.value,
          cep:          document.getElementById('inputCep')?.value,
          destinatario: document.getElementById('inputDestinatario')?.value,
          rua:          document.getElementById('inputRua')?.value,
          numero:       document.getElementById('inputNumero')?.value,
          complemento:  document.getElementById('inputComplemento')?.value,
          bairro:       document.getElementById('inputBairro')?.value,
          cidade:       document.getElementById('inputCidade')?.value,
          estado:       document.getElementById('inputEstado')?.value,
        };
        goToStep(2);
      }
    });
  }
  document.getElementById('btnBackStep1')?.addEventListener('click', () => goToStep(1));
  document.getElementById('btnBuscarCep')?.addEventListener('click', buscarCep);
  document.getElementById('inputCep')?.addEventListener('blur', buscarCep);
}

/* ════════════ INIT ════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  renderSummary();
  populateParcelas();
  setupPix();
  applyMasks();
  setupPayMethodSwitch();
  setupCopyPix();
  setupBoleto();
  setupFinalizarPedido();
  setupEvents();
  updateStepper(1);
});