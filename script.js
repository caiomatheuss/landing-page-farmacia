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
