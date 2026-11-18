// ── Dados de contato ──
const SITE = {
  instagram: 'https://www.instagram.com/artepharmaceutica',
  loja: 'https://www.artepharmaceutica.com',
  whatsappMessage:
    'Olá, tudo bem? Gostaria de saber mais sobre os produtos.',
  matriz: {
    phone: '5541991694197',
    display: '(41) 9169-4197',
  },
  filial: {
    phone: '5541991366263',
    display: '(41) 99136-6263',
  },
};

function waLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function getPhone(unit) {
  return unit === 'filial' ? SITE.filial.phone : SITE.matriz.phone;
}

document.querySelectorAll('[data-wa]').forEach((el) => {
  const unit = el.dataset.wa || 'matriz';
  el.href = waLink(getPhone(unit), SITE.whatsappMessage);
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
});

document.querySelectorAll('[data-instagram]').forEach((el) => {
  el.href = SITE.instagram;
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
});

document.querySelectorAll('[data-loja]').forEach((el) => {
  el.href = SITE.loja;
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
});

// Nav scroll
const navbar = document.getElementById('navbar');
const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 48);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menu mobile
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
});

function closeMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
}
window.closeMenu = closeMenu;

// Reveal on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
window.revealObserver = revealObserver;

// Parallax — elementos e faixas de transição
const parallaxItems = document.querySelectorAll('[data-parallax]');
const parallaxBands = document.querySelectorAll('[data-parallax-bg]');
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

function updateParallax() {
  if (prefersReducedMotion) return;

  const scrollY = window.scrollY;
  const vh = window.innerHeight;

  parallaxItems.forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.15;
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height * 0.5;
    const dist = (center - vh * 0.5) / vh;
    el.style.transform = `translate3d(0, ${dist * speed * 80}px, 0)`;
  });

  parallaxBands.forEach((band) => {
    const rect = band.getBoundingClientRect();
    const progress = (vh - rect.top) / (vh + rect.height);
    const offset = (progress - 0.5) * 40;
    band.style.setProperty('--parallax-offset', `${offset}px`);
  });
}

let ticking = false;
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);

updateParallax();
window.addEventListener('resize', updateParallax, { passive: true });

// Carrossel de depoimentos
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');

if (carouselTrack && carouselDots) {
  const slides = carouselTrack.querySelectorAll('.testimonial-card');
  let current = 0;
  let autoplayTimer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Depoimento ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    carouselDots.appendChild(dot);
  });

  const dots = carouselDots.querySelectorAll('.carousel-dot');

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    carouselTrack.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  carouselNext?.addEventListener('click', next);
  carouselPrev?.addEventListener('click', prev);

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, 6000);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  carouselTrack.closest('.carousel')?.addEventListener('mouseenter', stopAutoplay);
  carouselTrack.closest('.carousel')?.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
}

function escHtml(valor) {
  return String(valor || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fotosDa(secao) {
  const lista = Array.isArray(window.GALERIA) ? window.GALERIA : [];
  const rank = { matriz: 0, filial: 1, geral: 2 };
  return lista
    .filter((foto) => foto.secao === secao)
    .sort((a, b) =>
      (rank[a.unidade] ?? 9) - (rank[b.unidade] ?? 9) ||
      a.ordem - b.ordem ||
      a.src.localeCompare(b.src)
    );
}

function tagUnidade(unidade) {
  if (unidade !== 'matriz' && unidade !== 'filial') return '';
  const texto = unidade === 'matriz' ? 'Matriz' : 'Filial';
  return `<span class="gal-tag">${texto}</span>`;
}

function attrsImg(foto, modo) {
  const comum = `width="${foto.width}" height="${foto.height}" decoding="async"`;
  if (modo === 'eager') {
    return `src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" loading="eager" fetchpriority="high" ${comum}`;
  }
  if (modo === 'adiar') {
    return `alt="${escHtml(foto.alt)}" data-src="${escHtml(foto.src)}" ${comum}`;
  }
  return `src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" loading="lazy" ${comum}`;
}

function slideHtml(foto, indice, total, adiarFora, comTag) {
  const modo = indice === 0 ? 'eager' : (adiarFora ? 'adiar' : 'lazy');
  const legenda = foto.legenda
    ? `<figcaption><span>${escHtml(foto.legenda)}</span></figcaption>`
    : '';
  return `<figure class="espaco-slide gal-slide is-h">
    <button type="button" class="gal-frame" data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}" aria-label="Ampliar foto ${indice + 1} de ${total}">
      <img class="gal-photo" ${attrsImg(foto, modo)}>
      ${comTag ? tagUnidade(foto.unidade) : ''}
    </button>
    ${legenda}
  </figure>`;
}

function retratoHtml(foto, comTag) {
  return `<figure class="retrato-card">
    <button type="button" data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}" aria-label="Ampliar foto">
      <img src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" width="${foto.width}" height="${foto.height}" loading="lazy" decoding="async">
      ${comTag ? tagUnidade(foto.unidade) : ''}
    </button>
    ${foto.legenda ? `<figcaption>${escHtml(foto.legenda)}</figcaption>` : ''}
  </figure>`;
}

function mostrarSecao(el) {
  if (!el) return;
  el.hidden = false;
  el.querySelectorAll('.reveal').forEach((node) => revealObserver.observe(node));
}

function montarFachadas() {
  const grade = document.querySelector('[data-mount="fachada"]');
  const secao = document.getElementById('unidades');
  if (!grade || !secao) return;
  const porUnidade = { matriz: null, filial: null };
  fotosDa('fachada').forEach((foto) => {
    if (!porUnidade[foto.unidade]) porUnidade[foto.unidade] = foto;
  });
  const casas = [
    {
      chave: 'matriz',
      foto: porUnidade.matriz,
      endereco: 'Rua Dona Izabel A Redentora, 2076 — Centro<br>São José dos Pinhais - PR, 83005-010',
      maps: 'https://www.google.com/maps/search/?api=1&query=Rua+Dona+Izabel+A+Redentora+2076+São+José+dos+Pinhais+PR',
    },
    {
      chave: 'filial',
      foto: porUnidade.filial,
      endereco: 'Rua Visconde do Rio Branco, 1945 — Centro<br>São José dos Pinhais - PR',
      maps: 'https://www.google.com/maps/search/?api=1&query=Rua+Visconde+do+Rio+Branco+1945+São+José+dos+Pinhais+PR',
    },
  ].filter((casa) => casa.foto);

  if (!casas.length) {
    secao.hidden = true;
    return;
  }

  grade.innerHTML = casas.map((casa) => {
    const foto = casa.foto;
    const nome = casa.chave === 'matriz' ? 'Matriz' : 'Filial';
    return `<article class="fachada reveal">
      <figure>
        <button type="button" class="fachada-foto" data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}" aria-label="Ampliar fachada da ${nome}">
          <img src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" width="${foto.width}" height="${foto.height}" decoding="async" loading="lazy">
          ${tagUnidade(foto.unidade)}
        </button>
      </figure>
      <h3>${nome}</h3>
      <p><a href="${casa.maps}" target="_blank" rel="noopener noreferrer">${casa.endereco}</a></p>
      <a href="${waLink(getPhone(casa.chave), SITE.whatsappMessage)}" class="link-gold" target="_blank" rel="noopener noreferrer">WhatsApp ${nome}</a>
    </article>`;
  }).join('');
  mostrarSecao(secao);
}

function montarRetratos(secao, fotos, comTag) {
  const faixa = secao?.querySelector('[data-mount="retratos"]');
  if (!faixa) return;
  if (!fotos.length) {
    faixa.hidden = true;
    faixa.innerHTML = '';
    return;
  }
  faixa.hidden = false;
  faixa.innerHTML = fotos.map((foto) => retratoHtml(foto, comTag)).join('');
}

function montarCarrossel(root) {
  const secaoNome = root.dataset.secao;
  if (!secaoNome) return;
  const track = root.querySelector('[data-mount="slides"]');
  if (!track) return;
  const fotos = fotosDa(secaoNome);
  const deitadas = fotos.filter((foto) => foto.orientacao === 'h');
  const emPe = fotos.filter((foto) => foto.orientacao === 'v');
  const secao = root.closest('section');
  const comTag = secaoNome === 'ambiente';
  if (!fotos.length) {
    if (secao) secao.hidden = true;
    root.removeAttribute('data-carousel');
    return;
  }
  if (!deitadas.length) {
    root.hidden = true;
    root.removeAttribute('data-carousel');
  } else {
    root.hidden = false;
    const muitos = deitadas.length > 8;
    track.innerHTML = deitadas.map((foto, i) => slideHtml(foto, i, deitadas.length, muitos, comTag)).join('');
    if (muitos) root.dataset.lazySlides = '1';
    else delete root.dataset.lazySlides;
  }
  montarRetratos(secao, emPe, comTag);
  if (secao) mostrarSecao(secao);
}

function montarFormula() {
  const mosaic = document.querySelector('[data-mount="formula"]');
  if (!mosaic) return;
  const fotos = fotosDa('formula');
  if (!fotos.length) {
    mosaic.hidden = true;
    return;
  }
  const slots = ['formula-shot--main', 'formula-shot--top', 'formula-shot--bottom'];
  const visiveis = fotos.slice(0, 3);
  const extras = fotos.slice(3);
  mosaic.innerHTML = visiveis.map((foto, i) => `
    <figure class="formula-shot ${slots[i]} is-${foto.orientacao}">
      <button type="button" class="formula-hit" data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}" aria-label="Ampliar foto da formulação">
        <img src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" width="${foto.width}" height="${foto.height}" loading="lazy" decoding="async">
      </button>
    </figure>`).join('') + (extras.length ? `<div class="formula-mais">${extras.map((foto) => `
      <button type="button" class="formula-mais-btn" data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}">
        <img src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" width="${foto.width}" height="${foto.height}" loading="lazy" decoding="async">
      </button>`).join('')}</div>` : '');
}

function montarGrade(secaoNome) {
  const grade = document.querySelector(`[data-mount="grid"][data-secao="${secaoNome}"]`);
  if (!grade) return;
  const fotos = fotosDa(secaoNome);
  const secao = grade.closest('section');
  if (!fotos.length) {
    if (secao) secao.hidden = true;
    return;
  }
  const html = [];
  const itemDe = (foto) => `<figure class="galeria-item is-${foto.orientacao}">
      <button type="button" data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}" aria-label="Ampliar foto">
        <img src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" width="${foto.width}" height="${foto.height}" loading="lazy" decoding="async">
      </button>
    </figure>`;
  for (let i = 0; i < fotos.length; i += 1) {
    const foto = fotos[i];
    const proxima = fotos[i + 1];
    if (foto.orientacao === 'v' && proxima && proxima.orientacao === 'v') {
      html.push(itemDe(foto), itemDe(proxima));
      i += 1;
      continue;
    }
    html.push(itemDe(foto));
    if (foto.orientacao === 'v') {
      html.push(`<div class="galeria-legenda"><p>${escHtml(foto.legenda || foto.alt)}</p></div>`);
    }
  }
  grade.innerHTML = html.join('');
  if (secao) mostrarSecao(secao);
}

function atualizarColagem() {
  const troca = {
    'servicos-shot--main': 'lab-matriz-v-05.jpg',
    'servicos-shot--top': 'especialidade-matriz-h-01.jpg',
    'servicos-shot--bottom': 'especialidade-matriz-v-03.jpg',
  };
  const lista = Array.isArray(window.GALERIA) ? window.GALERIA : [];
  Object.entries(troca).forEach(([classe, arquivo]) => {
    const figura = document.querySelector(`.${classe}`);
    const foto = lista.find((item) => item.src.endsWith(arquivo));
    const img = figura?.querySelector('img');
    if (!figura || !img || !foto) return;
    img.src = foto.src;
    img.alt = foto.alt;
    img.width = foto.width;
    img.height = foto.height;
    img.decoding = 'async';
    img.loading = 'lazy';
    figura.dataset.lightbox = foto.src;
    figura.dataset.caption = foto.legenda || foto.alt;
    figura.querySelector('.gal-tag')?.remove();
  });
}

function botaoFoto(foto, classe, rotulo, comTag = true, troca = false) {
  const acao = troca
    ? `data-troca data-caption="${escHtml(foto.legenda || foto.alt)}"`
    : `data-lightbox="${escHtml(foto.src)}" data-caption="${escHtml(foto.legenda || foto.alt)}"`;
  return `<button type="button" class="${classe}" ${acao} aria-label="${escHtml(rotulo)}">
      <img src="${escHtml(foto.src)}" alt="${escHtml(foto.alt)}" width="${foto.width}" height="${foto.height}" loading="lazy" decoding="async">
      ${comTag ? tagUnidade(foto.unidade) : ''}
    </button>`;
}

function nomeUnidade(unidade) {
  if (unidade === 'filial') return 'Filial';
  if (unidade === 'matriz') return 'Matriz';
  return 'Casa';
}

function parHtml(item, indice) {
  const nome = nomeUnidade(item.unidade);
  const numero = String(indice + 1).padStart(2, '0');
  const foto = item.foto;
  const legenda = foto.legenda ? `<p class="album-legenda">${escHtml(foto.legenda)}</p>` : '';
  return `<article class="album-casa">
    <figure>${botaoFoto(foto, 'album-foto', `Ampliar foto da ${nome}`)}</figure>
    <p class="album-meta"><span>${numero}</span> ${nome}</p>
    ${legenda}
  </article>`;
}

function cartasPilha(lista, nome) {
  const poses = lista.length === 1
    ? [{ x: 18, y: 8, r: 0 }]
    : lista.length === 2
      ? [{ x: 0, y: 12, r: -7 }, { x: 32, y: 0, r: 6 }]
      : [{ x: 0, y: 10, r: -8 }, { x: 34, y: 0, r: 7 }, { x: 14, y: 18, r: -2 }];
  return lista.map((foto, i) => {
    const pose = poses[i];
    return `<figure class="pilha-carta" style="--r:${pose.r}deg;--x:${pose.x}%;--y:${pose.y}%;z-index:${i + 1}">
      ${botaoFoto(foto, 'pilha-foto', `Ampliar foto da ${nome}`)}
    </figure>`;
  }).join('');
}

function pilhaHtml(grupo) {
  const nome = nomeUnidade(grupo.unidade);
  const fatias = [];
  for (let i = 0; i < grupo.lista.length; i += 3) fatias.push(grupo.lista.slice(i, i + 3));
  const blocos = fatias.map((lista) => `<div class="pilha">${cartasPilha(lista, nome)}</div>`).join('');
  const texto = grupo.lista[0].legenda ? `<p>${escHtml(grupo.lista[0].legenda)}</p>` : '';
  return `<div class="pilha-bloco">
    ${blocos}
    <p class="pilha-meta">${nome}</p>
    ${texto}
  </div>`;
}

function montarAmbiente() {
  const secao = document.getElementById('espaco');
  const par = secao?.querySelector('[data-mount="par"]');
  const pilhas = secao?.querySelector('[data-mount="pilhas"]');
  if (!secao || !par || !pilhas) return;
  const fotos = fotosDa('ambiente');
  if (!fotos.length) {
    secao.hidden = true;
    return;
  }
  const usadas = new Set();
  const destaques = ['matriz', 'filial'].map((unidade) => {
    const daCasa = fotos.filter((foto) => foto.unidade === unidade);
    const foto = daCasa.find((item) => item.orientacao === 'h') || daCasa[0];
    if (!foto) return null;
    usadas.add(foto.src);
    return { unidade, foto };
  }).filter(Boolean);

  par.hidden = !destaques.length;
  par.innerHTML = destaques.map((item, i) => parHtml(item, i)).join('');

  const grupos = ['matriz', 'filial'].map((unidade) => {
    const lista = fotos.filter((foto) => foto.unidade === unidade && !usadas.has(foto.src));
    return lista.length ? { unidade, lista } : null;
  }).filter(Boolean);
  const outras = fotos.filter((foto) => !usadas.has(foto.src) && foto.unidade !== 'matriz' && foto.unidade !== 'filial');
  if (outras.length) grupos.push({ unidade: 'geral', lista: outras });

  pilhas.hidden = !grupos.length;
  pilhas.innerHTML = grupos.map((grupo) => pilhaHtml(grupo)).join('');
  mostrarSecao(secao);
}

function colunaLab(lista) {
  const hero = lista.find((foto) => foto.orientacao === 'h') || lista[0];
  return { hero, thumbs: lista.filter((foto) => foto !== hero) };
}

function saborHtml(coluna) {
  const nome = nomeUnidade(coluna.hero.unidade);
  const legenda = coluna.hero.legenda ? `<p class="sabor-legenda">${escHtml(coluna.hero.legenda)}</p>` : '';
  const thumbs = coluna.thumbs.length
    ? `<div class="sabor-thumbs">${coluna.thumbs.map((foto) => botaoFoto(foto, 'sabor-thumb', 'Colocar esta foto em destaque', false, true)).join('')}</div>`
    : '';
  return `<article class="sabor">
    <figure class="sabor-hero">${botaoFoto(coluna.hero, 'album-foto', `Ampliar foto do laboratório, ${nome}`)}</figure>
    ${thumbs}
    <p class="sabor-meta">${nome}</p>
    ${legenda}
  </article>`;
}

function montarLaboratorio() {
  const root = document.querySelector('[data-mount="sabores"]');
  const secao = document.getElementById('laboratorio');
  if (!root || !secao) return;
  const fotos = fotosDa('lab');
  if (!fotos.length) {
    secao.hidden = true;
    return;
  }
  const porUnidade = { matriz: [], filial: [] };
  fotos.forEach((foto) => {
    const chave = foto.unidade === 'filial' ? 'filial' : 'matriz';
    porUnidade[chave].push(foto);
  });
  const chaves = ['matriz', 'filial'].filter((chave) => porUnidade[chave].length);
  let colunas;
  if (chaves.length >= 2) {
    colunas = chaves.map((chave) => colunaLab(porUnidade[chave]));
  } else {
    const lista = porUnidade[chaves[0]] || fotos;
    const horizontais = lista.filter((foto) => foto.orientacao === 'h');
    const resto = lista.filter((foto) => foto.orientacao !== 'h');
    if (horizontais.length >= 2) {
      const meio = Math.ceil(resto.length / 2);
      colunas = [
        { hero: horizontais[0], thumbs: resto.slice(0, meio) },
        { hero: horizontais[1], thumbs: resto.slice(meio).concat(horizontais.slice(2)) },
      ];
    } else {
      colunas = [colunaLab(lista)];
    }
  }
  root.innerHTML = colunas.map((coluna) => saborHtml(coluna)).join('');
  mostrarSecao(secao);
}

function lerBotaoFoto(btn) {
  const img = btn.querySelector('img');
  return {
    src: img?.getAttribute('src') || '',
    alt: img?.getAttribute('alt') || '',
    width: img?.getAttribute('width') || '',
    height: img?.getAttribute('height') || '',
    caption: btn.dataset.caption || img?.getAttribute('alt') || '',
  };
}

function escreverBotaoFoto(btn, foto, destaque) {
  const img = btn.querySelector('img');
  if (!img) return;
  img.src = foto.src;
  img.alt = foto.alt;
  if (foto.width) img.setAttribute('width', foto.width);
  if (foto.height) img.setAttribute('height', foto.height);
  btn.dataset.caption = foto.caption;
  if (destaque) btn.dataset.lightbox = foto.src;
  btn.setAttribute('aria-label', destaque ? 'Ampliar foto do laboratório' : 'Colocar esta foto em destaque');
}

function ligarTrocaLaboratorio() {
  const root = document.querySelector('[data-mount="sabores"]');
  if (!root) return;
  root.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-troca]');
    if (!thumb || !root.contains(thumb)) return;
    const artigo = thumb.closest('.sabor');
    const hero = artigo?.querySelector('.album-foto');
    const faixa = artigo?.querySelector('.sabor-thumbs');
    if (!hero || !faixa) return;
    const atual = lerBotaoFoto(hero);
    const proxima = lerBotaoFoto(thumb);
    escreverBotaoFoto(hero, proxima, true);
    escreverBotaoFoto(thumb, atual, false);
    faixa.appendChild(thumb);
    const legenda = artigo.querySelector('.sabor-legenda');
    if (legenda) legenda.textContent = proxima.caption;
  });
}

function initGaleria() {
  montarFachadas();
  montarAmbiente();
  montarLaboratorio();
  ligarTrocaLaboratorio();
  document.querySelectorAll('.gal-carousel[data-secao]').forEach(montarCarrossel);
  montarFormula();
  montarGrade('produtos');
  atualizarColagem();
  const decor = document.querySelector('.certificacoes');
  if (decor) {
    fetch('images/decor/classico.jpg', { method: 'HEAD' })
      .then((res) => { if (res.ok) decor.classList.add('has-decor'); })
      .catch(() => {});
  }
}

function initPhotoCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.espaco-track');
    const slides = [...root.querySelectorAll('.espaco-slide')];
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const controls = root.querySelector('.espaco-controls');
    const interval = Number(root.dataset.autoplay || 0);
    if (!track || !slides.length || !dotsWrap) return;

    let current = 0;
    let timer;
    const muitos = slides.length > 8;
    dotsWrap.replaceChildren();

    if (slides.length < 2 && controls) controls.hidden = true;

    const dots = [];
    if (!muitos && slides.length > 1) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'espaco-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', `Foto ${i + 1}`);
        dot.addEventListener('click', () => {
          goTo(i);
          start();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    } else if (muitos) {
      dotsWrap.classList.add('is-counter');
    }

    function carregar(indice) {
      if (!root.dataset.lazySlides) return;
      [indice - 1, indice, indice + 1].forEach((n) => {
        const alvo = slides[(n + slides.length) % slides.length];
        alvo.querySelectorAll('img[data-src]').forEach((img) => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        });
      });
    }

    function goTo(index) {
      if (!slides.length || !Number.isFinite(index)) return;
      current = ((index % slides.length) + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
      if (muitos) {
        dotsWrap.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      }
      carregar(current);
    }

    function start() {
      if (!interval || slides.length < 2 || document.hidden) return;
      stop();
      timer = setInterval(() => goTo(current + 1), interval);
    }

    function stop() {
      clearInterval(timer);
    }

    prev?.addEventListener('click', () => {
      goTo(current - 1);
      start();
    });
    next?.addEventListener('click', () => {
      goTo(current + 1);
      start();
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    let toqueX = null;
    root.addEventListener('touchstart', (e) => {
      toqueX = e.changedTouches[0].clientX;
    }, { passive: true });
    root.addEventListener('touchend', (e) => {
      if (toqueX == null || slides.length < 2) return;
      const dx = e.changedTouches[0].clientX - toqueX;
      if (Math.abs(dx) > 40) {
        goTo(current + (dx < 0 ? 1 : -1));
        start();
      }
      toqueX = null;
    }, { passive: true });

    goTo(0);
    start();
  });
}

function initLightbox() {
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  if (!box || !img) return;

  let album = [];
  let index = 0;
  let toqueX = null;

  function mostrar() {
    const item = album[index];
    if (!item) return;
    const photo = item.querySelector('img:not(.gal-blur)');
    img.src = item.dataset.lightbox;
    img.alt = photo?.alt || item.dataset.caption || '';
    img.width = photo?.naturalWidth || photo?.width || '';
    img.height = photo?.naturalHeight || photo?.height || '';
    caption.textContent = item.dataset.caption || photo?.alt || '';
    const sozinha = album.length < 2;
    if (prevBtn) prevBtn.hidden = sozinha;
    if (nextBtn) nextBtn.hidden = sozinha;
  }

  function abrir(nodes, i) {
    album = nodes.length ? nodes : [];
    index = ((i % album.length) + album.length) % album.length;
    mostrar();
    box.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function fechar() {
    box.hidden = true;
    img.removeAttribute('src');
    document.body.style.overflow = '';
  }

  function passo(delta) {
    if (album.length < 2) return;
    index = (index + delta + album.length) % album.length;
    mostrar();
  }

  document.querySelectorAll('[data-lightbox]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raiz = btn.closest('[data-carousel], [data-mount="formula"], [data-mount="par"], [data-mount="pilhas"], [data-mount="sabores"], .galeria-grid, .fachadas-grid, .servicos-gallery') || btn.parentElement;
      const nodes = [...raiz.querySelectorAll('[data-lightbox]')];
      const lista = nodes.length ? nodes : [btn];
      abrir(lista, Math.max(0, lista.indexOf(btn)));
    });
  });

  closeBtn?.addEventListener('click', fechar);
  prevBtn?.addEventListener('click', () => passo(-1));
  nextBtn?.addEventListener('click', () => passo(1));
  box.addEventListener('click', (e) => {
    if (e.target === box) fechar();
  });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowLeft') passo(-1);
    if (e.key === 'ArrowRight') passo(1);
  });
  box.addEventListener('touchstart', (e) => {
    toqueX = e.changedTouches[0].clientX;
  }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (toqueX == null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 40) passo(dx < 0 ? 1 : -1);
    toqueX = null;
  }, { passive: true });
}

initGaleria();
initPhotoCarousels();
initLightbox();
