const PRODUCTS = [
  {
    id: 'curcuma-500',
    name: 'Cúrcuma 500mg',
    price: 1,
    image: 'images/products/curcuma-500mg.png',
    exclusive: true,
    purpose:
      'Suplemento anti-inflamatório e antioxidante para apoiar articulações, digestão e bem-estar geral com alta biodisponibilidade.',
    description:
      'Fórmula desenvolvida em laboratório de alta precisão para garantir máxima absorção e resultados consistentes em até 30 dias, com curcumina padronizada.',
    composition: 'Curcumina 500mg por cápsula, excipientes q.s.p. Fórmula magistral manipulada sob demanda.',
    usage: 'Tomar 1 cápsula ao dia, preferencialmente com refeição, ou conforme orientação do seu médico ou farmacêutico.',
  },
  {
    id: 'kit-unhas',
    name: 'Kit Cuidado Para Unhas',
    price: 1,
    image: 'images/products/kit-unhas.png',
    exclusive: true,
    purpose:
      'Tratamento completo que combina cuidado tópico e suporte nutricional para unhas mais fortes, resistentes e com aspecto saudável.',
    description:
      'Kit exclusivo Arte Pharmaceutica com fórmulas manipuladas de alta performance, pensado para rotina prática e resultados visíveis.',
    composition:
      'Esmalte terapêutico manipulado, gel fortificante e suplemento em cápsulas (Malitta) — composição detalhada informada na prescrição.',
    usage:
      'Aplicar produtos tópicos conforme orientação. Suplemento: 1 cápsula ao dia. Consulte nosso farmacêutico para protocolo personalizado.',
  },
  {
    id: 'malta-cabelao',
    name: 'Malta Cabelão',
    price: 11,
    image: 'images/products/malta-cabelao.png',
    exclusive: true,
    purpose:
      'Nutrição capilar avançada para fortalecer a estrutura do fio, reduzir queda e promover crescimento saudável com mais brilho.',
    description:
      'Desenvolvido com Biotina e Zinco em dosagens estratégicas. Fórmula de alta absorção para manutenção do cabelo e da pele.',
    composition:
      'Biotina, Zinco e complexo de aminoácidos e vitaminas do complexo B. Frasco com 60 cápsulas (tratamento para 2 meses).',
    usage: 'Ingerir 1 cápsula ao dia, em horário fixo, com água. Resultados visíveis a partir de 30 dias de uso contínuo.',
  },
  {
    id: 'pantoarte',
    name: 'Pantoarte',
    price: 95,
    image: 'images/products/pantoarte.png',
    exclusive: true,
    purpose:
      'Fórmula manipulada para suporte à saúde capilar e fortalecimento dos fios, com ativos selecionados para reposição nutricional.',
    description:
      'Produto magistral Arte Pharmaceutica com padronização rigorosa de ativos. Ideal para quem busca tratamento personalizado e eficaz.',
    composition:
      'Pantotenato de cálcio e associados conforme prescrição magistral. Embalagem branca lacrada com rótulo farmacêutico.',
    usage:
      'Posologia definida pelo profissional de saúde. Em geral, 1 cápsula ao dia. Mantenha em local fresco e seco.',
  },
];

const CART_KEY = 'arte-pharma-cart';

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    // Filtra itens cujo id não existe mais nos produtos cadastrados
    const validIds = PRODUCTS.map(p => p.id);
    const clean = raw.filter(item => validIds.includes(item.id));
    // Se havia lixo, já limpa o localStorage
    if (clean.length !== raw.length) {
      localStorage.setItem(CART_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount(cart) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function addToCart(productId) {
  const cart = loadCart();
  const existing = cart.find((i) => i.id === productId);
  if (existing) existing.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  saveCart(cart);
  updateCartUI();
  return cart;
}

function buildCartWhatsAppMessage(cart) {
  const lines = ['Olá! Gostaria de finalizar meu pedido na Arte Pharmaceutica:', ''];
  cart.forEach((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    if (p) lines.push(`• ${p.name} — ${item.qty}x — ${formatPrice(p.price * item.qty)}`);
  });
  lines.push('', `*Total estimado: ${formatPrice(getCartTotal(cart))}*`);
  lines.push('', 'Aguardo orientação para pagamento e entrega. Obrigado(a)!');
  return lines.join('\n');
}

function initStore() {
  const grid = document.getElementById('showroomGrid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map(
    (p) => `
    <article class="product-card reveal" data-product-id="${p.id}">
      <button type="button" class="product-visual" data-open-product="${p.id}" aria-label="Ver detalhes de ${p.name}">
        ${p.exclusive ? '<span class="product-badge">Fórmula Exclusiva</span>' : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </button>
      <div class="product-info">
        <button type="button" class="product-name" data-open-product="${p.id}">${p.name}</button>
        <p class="product-price">${formatPrice(p.price)}</p>
        <button type="button" class="btn-add-cart" data-add-cart="${p.id}">
          <span class="btn-add-label">Adicionar ao Carrinho</span>
          <span class="btn-add-done" aria-hidden="true">✓ Adicionado</span>
        </button>
      </div>
    </article>`
  ).join('');

  document.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.addCart;
      addToCart(id);
      btn.classList.add('is-added');
      setTimeout(() => btn.classList.remove('is-added'), 1800);
    });
  });

  document.querySelectorAll('[data-open-product]').forEach((el) => {
    el.addEventListener('click', () => openProductModal(el.dataset.openProduct));
  });

  initCartControls();
  initProductModal();
  updateCartUI();

  document.querySelectorAll('#showroomGrid .reveal').forEach((el) => {
    if (window.revealObserver) {
      window.revealObserver.observe(el);
    } else {
      el.classList.add('visible');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStore);
} else {
  initStore();
}

function updateCartUI() {
  const cart = loadCart();
  const count = getCartCount(cart);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = count;
    el.classList.toggle('is-visible', count > 0);
  });
}

function initCartControls() {
  document.querySelectorAll('[data-cart-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'checkout.html';
    });
  });
}

function openProductModal(productId) {
  const p = PRODUCTS.find((x) => x.id === productId);
  const modal = document.getElementById('productModal');
  if (!p || !modal) return;

  modal.querySelector('[data-modal-img]').src = p.image;
  modal.querySelector('[data-modal-img]').alt = p.name;
  modal.querySelector('[data-modal-title]').textContent = p.name;
  modal.querySelector('[data-modal-price]').textContent = formatPrice(p.price);
  modal.querySelector('[data-modal-purpose]').textContent = p.purpose;
  modal.querySelector('[data-modal-description]').textContent = p.description;
  modal.querySelector('[data-modal-composition]').textContent = p.composition;
  modal.querySelector('[data-modal-usage]').textContent = p.usage;

  const addBtn = modal.querySelector('[data-modal-add]');
  addBtn.dataset.addCart = p.id;
  addBtn.onclick = () => {
    addToCart(p.id);
    addBtn.classList.add('is-added');
    setTimeout(() => addBtn.classList.remove('is-added'), 1800);
  };

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function initProductModal() {
  const modal = document.getElementById('productModal');
  if (!modal) return;

  modal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', closeProductModal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
      closeProductModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });
}