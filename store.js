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
  {
    id: 'exemplo-vitamina-d',
    name: 'Vitamina D3 2.000 UI',
    price: 0,
    image: 'images/products/placeholder.svg',
    placeholder: true,
    purpose: 'Card de exemplo para visualizar a galeria com mais produtos. Substitua pelo produto real quando for cadastrar.',
    description: 'Este item ainda não está à venda. Serve só para mostrar como a vitrine fica com uma lista maior.',
    composition: 'Exemplo de composição — preencha com a fórmula real.',
    usage: 'Exemplo de modo de uso — preencha com a orientação real.',
  },
  {
    id: 'exemplo-omega-3',
    name: 'Ômega 3',
    price: 0,
    image: 'images/products/placeholder.svg',
    placeholder: true,
    purpose: 'Card de exemplo para visualizar a galeria com mais produtos. Substitua pelo produto real quando for cadastrar.',
    description: 'Este item ainda não está à venda. Serve só para mostrar como a vitrine fica com uma lista maior.',
    composition: 'Exemplo de composição — preencha com a fórmula real.',
    usage: 'Exemplo de modo de uso — preencha com a orientação real.',
  },
  {
    id: 'exemplo-magnesio',
    name: 'Magnésio Dimalato',
    price: 0,
    image: 'images/products/placeholder.svg',
    placeholder: true,
    purpose: 'Card de exemplo para visualizar a galeria com mais produtos. Substitua pelo produto real quando for cadastrar.',
    description: 'Este item ainda não está à venda. Serve só para mostrar como a vitrine fica com uma lista maior.',
    composition: 'Exemplo de composição — preencha com a fórmula real.',
    usage: 'Exemplo de modo de uso — preencha com a orientação real.',
  },
  {
    id: 'exemplo-colageno',
    name: 'Colágeno Hidrolisado',
    price: 0,
    image: 'images/products/placeholder.svg',
    placeholder: true,
    purpose: 'Card de exemplo para visualizar a galeria com mais produtos. Substitua pelo produto real quando for cadastrar.',
    description: 'Este item ainda não está à venda. Serve só para mostrar como a vitrine fica com uma lista maior.',
    composition: 'Exemplo de composição — preencha com a fórmula real.',
    usage: 'Exemplo de modo de uso — preencha com a orientação real.',
  },
  {
    id: 'exemplo-melatonina',
    name: 'Melatonina 3mg',
    price: 0,
    image: 'images/products/placeholder.svg',
    placeholder: true,
    purpose: 'Card de exemplo para visualizar a galeria com mais produtos. Substitua pelo produto real quando for cadastrar.',
    description: 'Este item ainda não está à venda. Serve só para mostrar como a vitrine fica com uma lista maior.',
    composition: 'Exemplo de composição — preencha com a fórmula real.',
    usage: 'Exemplo de modo de uso — preencha com a orientação real.',
  },
  {
    id: 'exemplo-complexo-b',
    name: 'Complexo B',
    price: 0,
    image: 'images/products/placeholder.svg',
    placeholder: true,
    purpose: 'Card de exemplo para visualizar a galeria com mais produtos. Substitua pelo produto real quando for cadastrar.',
    description: 'Este item ainda não está à venda. Serve só para mostrar como a vitrine fica com uma lista maior.',
    composition: 'Exemplo de composição — preencha com a fórmula real.',
    usage: 'Exemplo de modo de uso — preencha com a orientação real.',
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
    const validIds = PRODUCTS.filter((p) => !p.placeholder).map((p) => p.id);
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
  const product = PRODUCTS.find((x) => x.id === productId);
  if (!product || product.placeholder) return loadCart();
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

function productCardHtml(p) {
  const badge = p.placeholder
    ? '<span class="product-badge product-badge--example">Exemplo</span>'
    : p.exclusive
      ? '<span class="product-badge">Fórmula Exclusiva</span>'
      : '';
  const price = p.placeholder
    ? '<p class="product-price">Exemplo de vitrine</p>'
    : `<p class="product-price">${formatPrice(p.price)}</p>`;
  const action = p.placeholder
    ? `<button type="button" class="btn-add-cart" data-open-product="${p.id}">Ver detalhes</button>`
    : `<button type="button" class="btn-add-cart" data-add-cart="${p.id}">
          <span class="btn-add-label">Adicionar ao Carrinho</span>
          <span class="btn-add-done" aria-hidden="true">✓ Adicionado</span>
        </button>`;

  return `
    <article class="product-card reveal${p.placeholder ? ' is-placeholder' : ''}" data-product-id="${p.id}">
      <button type="button" class="product-visual" data-open-product="${p.id}" aria-label="Ver detalhes de ${p.name}">
        ${badge}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </button>
      <div class="product-info">
        <button type="button" class="product-name" data-open-product="${p.id}">${p.name}</button>
        ${price}
        ${action}
      </div>
    </article>`;
}

function initStore() {
  const grid = document.getElementById('showroomGrid');
  if (!grid) return;

  const catalog = grid.dataset.catalog === 'all' ? PRODUCTS : PRODUCTS.filter((p) => !p.placeholder);
  grid.innerHTML = catalog.map(productCardHtml).join('');

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

  initInquiry();
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
  modal.querySelector('[data-modal-price]').textContent = p.placeholder ? 'Exemplo de vitrine' : formatPrice(p.price);
  modal.querySelector('[data-modal-purpose]').textContent = p.purpose;
  modal.querySelector('[data-modal-description]').textContent = p.description;
  modal.querySelector('[data-modal-composition]').textContent = p.composition;
  modal.querySelector('[data-modal-usage]').textContent = p.usage;

  const badge = modal.querySelector('[data-modal-badge]');
  if (badge) {
    badge.hidden = !(p.exclusive || p.placeholder);
    badge.textContent = p.placeholder ? 'Exemplo' : 'Fórmula Exclusiva';
    badge.classList.toggle('product-badge--example', Boolean(p.placeholder));
  }

  const addBtn = modal.querySelector('[data-modal-add]');
  const checkoutLink = modal.querySelector('.modal-checkout-link');
  addBtn.hidden = Boolean(p.placeholder);
  if (checkoutLink) checkoutLink.hidden = Boolean(p.placeholder);
  addBtn.dataset.addCart = p.id;
  addBtn.onclick = () => {
    if (p.placeholder) return;
    addToCart(p.id);
    addBtn.classList.add('is-added');
    setTimeout(() => addBtn.classList.remove('is-added'), 1800);
  };

  const doubtBtn = modal.querySelector('[data-modal-doubt]');
  if (doubtBtn) {
    doubtBtn.onclick = () => openInquiry({ mode: 'produto', product: p });
  }

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
    if (e.key !== 'Escape') return;
    const inquiry = document.getElementById('inquiryModal');
    if (inquiry && !inquiry.hidden) return;
    closeProductModal();
  });
}

let inquiryState = { mode: 'manipular', product: null };

function ensureInquiryModal() {
  if (document.getElementById('inquiryModal')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="inquiry-modal" id="inquiryModal" hidden>
      <div class="modal-backdrop" data-inquiry-close></div>
      <form class="inquiry-panel" id="inquiryForm">
        <button type="button" class="modal-close" data-inquiry-close aria-label="Fechar">×</button>
        <p class="eyebrow" data-inquiry-kicker>WhatsApp</p>
        <h2 class="inquiry-title" data-inquiry-title>Dúvidas sobre o produto</h2>
        <p class="inquiry-lead" data-inquiry-lead></p>
        <label class="inquiry-field">
          <span>Seu nome</span>
          <input type="text" name="nome" autocomplete="name" maxlength="80" required placeholder="Como podemos te chamar?">
        </label>
        <label class="inquiry-field">
          <span data-inquiry-notes-label>Informações breves</span>
          <textarea name="notas" maxlength="500" rows="4" required placeholder="Escreva aqui, em poucas linhas."></textarea>
        </label>
        <p class="inquiry-error" data-inquiry-error hidden>Preencha seu nome e uma breve informação para continuar.</p>
        <button type="submit" class="btn-showroom btn-showroom--gold">Enviar no WhatsApp</button>
      </form>
    </div>`;
  document.body.appendChild(wrap.firstElementChild);
}

function openInquiry({ mode, product }) {
  ensureInquiryModal();
  const modal = document.getElementById('inquiryModal');
  const form = document.getElementById('inquiryForm');
  inquiryState = { mode, product: product || null };
  form.reset();
  modal.querySelector('[data-inquiry-error]').hidden = true;

  const title = modal.querySelector('[data-inquiry-title]');
  const lead = modal.querySelector('[data-inquiry-lead]');
  const notesLabel = modal.querySelector('[data-inquiry-notes-label]');
  const notes = form.elements.notas;

  if (mode === 'produto' && product) {
    title.textContent = 'Dúvidas sobre o produto';
    lead.textContent = `Vamos abrir o WhatsApp da Arte Pharmaceutica já com o seu nome e a sua dúvida sobre ${product.name}.`;
    notesLabel.textContent = 'Quais são as suas dúvidas?';
    notes.placeholder = 'Conte em poucas linhas o que você quer saber.';
  } else {
    title.textContent = 'Quero manipular o meu próprio remédio';
    lead.textContent = 'Vamos abrir o WhatsApp da Arte Pharmaceutica já com o seu nome e o que você precisa. Assim o atendimento já começa te chamando pelo nome.';
    notesLabel.textContent = 'Informações breves';
    notes.placeholder = 'Ex.: quero um remédio para dormir melhor, com orientação do farmacêutico.';
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.elements.nome.focus();
}

function closeInquiry() {
  const modal = document.getElementById('inquiryModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  const productModal = document.getElementById('productModal');
  if (!productModal || !productModal.classList.contains('is-open')) {
    document.body.classList.remove('modal-open');
  }
}

function buildInquiryMessage(nome, notas) {
  if (inquiryState.mode === 'produto' && inquiryState.product) {
    return `Oi, meu nome é ${nome}. Minhas dúvidas sobre o remédio ${inquiryState.product.name} são estas: ${notas}`;
  }
  return `Olá, meu nome é ${nome}. Quero manipular o meu próprio remédio. As informações são estas: ${notas}`;
}

function initInquiry() {
  ensureInquiryModal();
  const modal = document.getElementById('inquiryModal');
  const form = document.getElementById('inquiryForm');

  document.querySelectorAll('[data-inquiry="manipular"]').forEach((btn) => {
    btn.addEventListener('click', () => openInquiry({ mode: 'manipular' }));
  });

  modal.querySelectorAll('[data-inquiry-close]').forEach((el) => {
    el.addEventListener('click', closeInquiry);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.elements.nome.value.trim();
    const notas = form.elements.notas.value.trim();
    const error = modal.querySelector('[data-inquiry-error]');
    if (!nome || !notas) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const phone = typeof SITE !== 'undefined' ? SITE.matriz.phone : '5541991694197';
    const url = typeof waLink === 'function'
      ? waLink(phone, buildInquiryMessage(nome, notas))
      : `https://wa.me/${phone}?text=${encodeURIComponent(buildInquiryMessage(nome, notas))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeInquiry();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInquiry();
  });
}