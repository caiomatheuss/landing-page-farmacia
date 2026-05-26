// ═══════════════════════════════════════════════════════════════════
// MUDAR CHAVE PIX AQUI
// Cole sua chave aleatória, CPF, CNPJ, e-mail ou telefone (+55...)
// ═══════════════════════════════════════════════════════════════════
const PIX_KEY = 'contato@artepharmaceutica.com';

// Imagem do QR Code — troque pelo arquivo real do seu banco
const PIX_QR_IMAGE = 'images/pix-qrcode-placeholder.svg';

// WhatsApp da matriz (somente números, com DDI 55)
const WHATSAPP_MATRIZ = '5541991694197';

const PIX_PAYMENT_DONE_MESSAGE =
  'Olá! Acabei de realizar o pagamento via PIX do meu pedido. Segue o comprovante.';

const CART_KEY = 'arte-pharma-cart';

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function waLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function copyPixKey() {
  const feedback = document.getElementById('pixCopyFeedback');
  const btn = document.getElementById('copyPixBtn');

  try {
    await navigator.clipboard.writeText(PIX_KEY);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = PIX_KEY;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  if (feedback) {
    feedback.hidden = false;
    feedback.textContent = 'Copiado!';
  }
  if (btn) btn.classList.add('is-copied');

  setTimeout(() => {
    if (feedback) feedback.hidden = true;
    if (btn) btn.classList.remove('is-copied');
  }, 2500);
}

function initPixSection() {
  const keyEl = document.getElementById('pixKeyDisplay');
  const qrEl = document.getElementById('pixQrImage');
  const copyBtn = document.getElementById('copyPixBtn');
  const paidBtn = document.getElementById('pixPaymentDoneBtn');

  if (keyEl) keyEl.textContent = PIX_KEY;
  if (qrEl) qrEl.src = PIX_QR_IMAGE;

  copyBtn?.addEventListener('click', copyPixKey);

  if (paidBtn) {
    paidBtn.href = waLink(WHATSAPP_MATRIZ, PIX_PAYMENT_DONE_MESSAGE);
    paidBtn.target = '_blank';
    paidBtn.rel = 'noopener noreferrer';
  }
}

function renderCheckout() {
  const cart = loadCart();
  const list = document.getElementById('checkoutItems');
  const empty = document.getElementById('checkoutEmpty');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const totalEl = document.getElementById('checkoutTotal');
  const pixSection = document.getElementById('pixPayment');
  const orderWaBtn = document.getElementById('checkoutOrderWhatsApp');

  if (!cart.length) {
    list.innerHTML = '';
    empty.hidden = false;
    subtotalEl.textContent = formatPrice(0);
    totalEl.textContent = formatPrice(0);
    if (pixSection) pixSection.hidden = true;
    if (orderWaBtn) {
      orderWaBtn.classList.add('is-disabled');
      orderWaBtn.href = '#';
    }
    return;
  }

  empty.hidden = true;
  let total = 0;

  list.innerHTML = cart
    .map((item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      if (!p) return '';
      const line = p.price * item.qty;
      total += line;
      return `<li class="checkout-item">
        <img src="${p.image}" alt="" width="56" height="56">
        <div>
          <strong>${p.name}</strong>
          <span class="checkout-item-qty">${item.qty} un.</span>
        </div>
        <span class="checkout-amount">${formatPrice(line)}</span>
      </li>`;
    })
    .join('');

  subtotalEl.textContent = formatPrice(total);
  totalEl.textContent = formatPrice(total);

  const pixTotal = document.getElementById('pixPayTotal');
  if (pixTotal) pixTotal.textContent = formatPrice(total);

  if (pixSection) pixSection.hidden = false;

  if (orderWaBtn && typeof buildCartWhatsAppMessage === 'function') {
    orderWaBtn.href = waLink(WHATSAPP_MATRIZ, buildCartWhatsAppMessage(cart));
    orderWaBtn.target = '_blank';
    orderWaBtn.rel = 'noopener noreferrer';
    orderWaBtn.classList.remove('is-disabled');
  }
}

function initCheckout() {
  initPixSection();
  renderCheckout();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}
