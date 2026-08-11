// ══════════════════════════════════════════════
//  login-modal.js — Modal de Login/Cadastro
//  Arte Pharmaceutica
// ══════════════════════════════════════════════

import { cadastrar, login, logout, getUsuarioAtual, onAuthStateChanged, auth } from './auth.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

/* ── Requisitos de senha (edite aqui se precisar) ── */
const SENHA_MIN = 6; // Firebase exige no mínimo 6 caracteres
const SENHA_MAX = 20;

function validarSenha(senha) {
  const erros = [];
  if (senha.length < SENHA_MIN) erros.push(`mínimo de ${SENHA_MIN} caracteres`);
  if (senha.length > SENHA_MAX) erros.push(`máximo de ${SENHA_MAX} caracteres`);
  if (!/[A-Z]/.test(senha)) erros.push('ao menos 1 letra maiúscula');
  if (!/[0-9]/.test(senha)) erros.push('ao menos 1 número');
  return { ok: erros.length === 0, erros };
}

function requisitosSenhaHTML(idPrefix) {
  return `
    <ul class="auth-reqs" id="${idPrefix}Reqs" aria-live="polite">
      <li data-rule="len">Entre ${SENHA_MIN} e ${SENHA_MAX} caracteres</li>
      <li data-rule="upper">Pelo menos 1 letra maiúscula</li>
      <li data-rule="num">Pelo menos 1 número</li>
    </ul>
  `;
}

function atualizarChecklist(senha, listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const checks = {
    len: senha.length >= SENHA_MIN && senha.length <= SENHA_MAX,
    upper: /[A-Z]/.test(senha),
    num: /[0-9]/.test(senha),
  };
  list.querySelectorAll('[data-rule]').forEach((li) => {
    const ok = checks[li.dataset.rule];
    li.classList.toggle('is-ok', !!ok);
    li.classList.toggle('is-bad', senha.length > 0 && !ok);
  });
}

function limparCamposAuth() {
  [
    'loginEmail',
    'loginSenha',
    'cadNome',
    'cadTelefone',
    'cadEmail',
    'cadSenha',
    'cadConfirmarSenha',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const loginErro = document.getElementById('loginErro');
  const cadErro = document.getElementById('cadErro');
  if (loginErro) loginErro.textContent = '';
  if (cadErro) cadErro.textContent = '';
  document.getElementById('resetSucesso')?.classList.remove('is-visible');
  atualizarChecklist('', 'loginReqs');
  atualizarChecklist('', 'cadReqs');
}

// ── Injeta o HTML do modal no body ────────────
function injetarModal() {
  const html = `
  <style>
    #authOverlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,20,50,0.68);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 0.4s ease;
      padding: 1rem;
      overflow-y: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    #authOverlay::-webkit-scrollbar { display: none; width: 0; height: 0; }
    #authOverlay.is-open {
      opacity: 1; pointer-events: all;
    }
    #authOverlay.is-closing {
      opacity: 0;
      pointer-events: none;
    }

    .auth-modal {
      background: #fff;
      width: min(560px, 100%);
      max-height: none;
      overflow: visible;
      margin: 0;
      border-radius: 20px;
      box-shadow: 0 36px 90px rgba(0,20,50,0.3);
      transform: translateY(40px) scale(0.94);
      opacity: 0.85;
      transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
    }
    #authOverlay.is-open .auth-modal {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    #authOverlay.is-closing .auth-modal {
      transform: translateY(48px) scale(0.92);
      opacity: 0;
    }

    .auth-header {
      background: #002B5B;
      padding: 1rem 1.5rem 0.9rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      border-radius: 20px 20px 0 0;
    }
    .auth-logo {
      height: 36px; width: auto;
      filter: brightness(0) invert(1);
    }
    .auth-close {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.5); padding: 0.25rem; line-height: 1;
      transition: color 0.2s, transform 0.25s;
      border-radius: 8px;
    }
    .auth-close:hover { color: #fff; transform: rotate(90deg); }

    .auth-tabs {
      display: flex;
      border-bottom: 1px solid rgba(0,43,91,0.1);
    }
    .auth-tab {
      flex: 1; padding: 0.85rem;
      background: none; border: none; cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: #8a9ab0;
      border-bottom: 2px solid transparent;
      transition: color 0.3s, border-color 0.3s;
    }
    .auth-tab.is-active {
      color: #002B5B;
      border-bottom-color: #C5A059;
    }

    .auth-body { padding: 1.25rem 1.75rem 1.4rem; }

    .auth-field {
      display: flex; flex-direction: column; gap: 0.28rem;
      margin-bottom: 0.7rem;
    }
    .auth-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.62rem; letter-spacing: 0.14em;
      text-transform: uppercase; font-weight: 600;
      color: #002B5B;
    }
    .auth-input {
      width: 100%; padding: 0.65rem 0.9rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
      color: #1a2b3c; background: #f8f7f4;
      border: 1px solid rgba(0,43,91,0.12); border-radius: 10px;
      outline: none; box-sizing: border-box;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .auth-input:focus {
      border-color: #C5A059;
      box-shadow: 0 0 0 3px rgba(197,160,89,0.12);
      background: #fff;
    }
    .auth-error {
      font-size: 0.75rem; color: #e05252; font-weight: 500;
      min-height: 1rem; margin-bottom: 0.35rem;
    }

    .auth-forgot {
      display: block; text-align: right;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.7rem; color: #C5A059;
      text-decoration: none; margin-top: -0.35rem; margin-bottom: 0.65rem;
      cursor: pointer; background: none; border: none; padding: 0;
      transition: color 0.3s;
    }
    .auth-forgot:hover { color: #002B5B; }

    .auth-reqs {
      list-style: none;
      margin: 0 0 0.55rem;
      padding: 0.5rem 0.75rem;
      background: rgba(0,43,91,0.035);
      border-radius: 10px;
      border: 1px solid rgba(0,43,91,0.07);
    }
    .auth-reqs li {
      position: relative;
      padding-left: 1.1rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.65rem;
      line-height: 1.35;
      color: #5a6b7d;
      margin-bottom: 0.15rem;
    }
    .auth-reqs li:last-child { margin-bottom: 0; }
    .auth-reqs li::before {
      content: '';
      position: absolute;
      left: 0; top: 0.4em;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #b0bec5;
    }
    .auth-reqs li.is-ok { color: #1a7a48; }
    .auth-reqs li.is-ok::before { background: #32bc64; }
    .auth-reqs li.is-bad { color: #c0392b; }
    .auth-reqs li.is-bad::before { background: #e05252; }

    .auth-success {
      font-size: 0.78rem; color: #1a7a48; font-weight: 500;
      background: rgba(50,188,100,0.08);
      border: 1px solid rgba(50,188,100,0.25);
      border-radius: 12px; padding: 0.75rem 1rem;
      margin-bottom: 0.75rem;
      display: none;
    }
    .auth-success.is-visible { display: block; }

    .auth-btn-primary {
      width: 100%; padding: 0.8rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.16em; text-transform: uppercase;
      background: #C5A059; color: #002B5B;
      border: none; border-radius: 12px; cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      margin-top: 0.15rem;
    }
    .auth-btn-primary:hover { background: #d4af6a; transform: translateY(-1px); }
    .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .auth-skip {
      width: 100%; padding: 0.75rem;
      background: none; border: 1px solid rgba(0,43,91,0.15);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.68rem; font-weight: 500;
      letter-spacing: 0.08em; color: #5a6b7d;
      border-radius: 12px; cursor: pointer; margin-top: 0.65rem;
      transition: border-color 0.3s, color 0.3s;
    }
    .auth-skip:hover { border-color: #C5A059; color: #002B5B; }

    #navUserArea {
      display: flex; align-items: center; gap: 0.75rem;
    }
    .nav-user-name {
      font-size: 0.75rem; color: rgba(255,255,255,0.75);
      font-family: 'DM Sans', sans-serif; font-weight: 400;
      max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .nav-btn-login {
      padding: 0.5rem 1.1rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.65rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      background: transparent;
      border: 1px solid rgba(197,160,89,0.5);
      color: rgba(255,255,255,0.85);
      border-radius: 8px; cursor: pointer;
      transition: border-color 0.3s, color 0.3s, background 0.3s;
    }
    .nav-btn-login:hover {
      border-color: #C5A059; color: #C5A059;
    }
    .nav-btn-logout {
      padding: 0.4rem 0.75rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.62rem; font-weight: 500;
      color: rgba(255,255,255,0.45);
      background: none; border: none; cursor: pointer;
      transition: color 0.3s;
    }
    .nav-btn-logout:hover { color: #e05252; }

    @media (max-width: 520px) {
      .auth-body { padding: 1.5rem 1.25rem 1.6rem; }
      .auth-header { padding: 1.35rem 1.25rem 1.1rem; }
    }
  </style>

  <div id="authOverlay" role="dialog" aria-modal="true" aria-label="Login ou Cadastro">
    <div class="auth-modal">
      <div class="auth-header">
        <img class="auth-logo" src="images/brand/logo-arte.png" alt="Arte Pharmaceutica">
        <button class="auth-close" id="authCloseBtn" aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab" id="tabLogin" data-tab="login">Entrar</button>
        <button class="auth-tab is-active" id="tabCadastro" data-tab="cadastro">Criar conta</button>
      </div>

      <div class="auth-body">
        <div id="painelLogin" style="display:none">
          <div class="auth-field">
            <label class="auth-label" for="loginEmail">E-mail</label>
            <input class="auth-input" type="email" id="loginEmail" placeholder="seu@email.com" autocomplete="username" value="">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="loginSenha">Senha</label>
            <input class="auth-input" type="password" id="loginSenha" placeholder="Sua senha" autocomplete="new-password" value="" maxlength="20">
          </div>
          <button type="button" class="auth-forgot" id="btnEsqueceuSenha">Esqueceu sua senha?</button>
          ${requisitosSenhaHTML('login')}
          <div class="auth-success" id="resetSucesso">E-mail de recuperação enviado! Verifique sua caixa de entrada.</div>
          <div class="auth-error" id="loginErro"></div>
          <button class="auth-btn-primary" id="btnEntrar">Entrar</button>
          <button class="auth-skip" id="btnSkipLogin">Continuar sem login</button>
        </div>

        <div id="painelCadastro">
          <div class="auth-field">
            <label class="auth-label" for="cadNome">Nome completo</label>
            <input class="auth-input" type="text" id="cadNome" placeholder="Seu nome completo" autocomplete="name" value="">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadTelefone">Telefone / WhatsApp</label>
            <input class="auth-input" type="tel" id="cadTelefone" placeholder="(41) 99999-9999" autocomplete="tel" value="">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadEmail">E-mail</label>
            <input class="auth-input" type="email" id="cadEmail" placeholder="seu@email.com" autocomplete="email" value="">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadSenha">Senha</label>
            <input class="auth-input" type="password" id="cadSenha" placeholder="Crie sua senha" autocomplete="new-password" value="" maxlength="20">
          </div>
          ${requisitosSenhaHTML('cad')}
          <div class="auth-field">
            <label class="auth-label" for="cadConfirmarSenha">Confirmar senha</label>
            <input class="auth-input" type="password" id="cadConfirmarSenha" placeholder="Repita a senha" autocomplete="new-password" value="" maxlength="20">
          </div>
          <div class="auth-error" id="cadErro"></div>
          <button class="auth-btn-primary" id="btnCadastrar">Criar conta</button>
          <button class="auth-skip" id="btnSkipCadastro">Continuar sem login</button>
        </div>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

function setupModal() {
  const overlay = document.getElementById('authOverlay');
  const closeBtn = document.getElementById('authCloseBtn');
  const tabLogin = document.getElementById('tabLogin');
  const tabCad = document.getElementById('tabCadastro');
  const pLogin = document.getElementById('painelLogin');
  const pCad = document.getElementById('painelCadastro');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('is-active');
    tabCad.classList.remove('is-active');
    pLogin.style.display = '';
    pCad.style.display = 'none';
    limparCamposAuth();
  });

  tabCad.addEventListener('click', () => {
    tabCad.classList.add('is-active');
    tabLogin.classList.remove('is-active');
    pCad.style.display = '';
    pLogin.style.display = 'none';
    limparCamposAuth();
  });

  closeBtn.addEventListener('click', fecharModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModal();
  });

  document.getElementById('btnSkipLogin').addEventListener('click', () => {
    sessionStorage.setItem('auth-modal-skipped', '1');
    fecharModal();
  });
  document.getElementById('btnSkipCadastro').addEventListener('click', () => {
    sessionStorage.setItem('auth-modal-skipped', '1');
    fecharModal();
  });

  document.getElementById('loginSenha').addEventListener('input', (e) => {
    atualizarChecklist(e.target.value, 'loginReqs');
  });
  document.getElementById('cadSenha').addEventListener('input', (e) => {
    atualizarChecklist(e.target.value, 'cadReqs');
  });

  // Bloqueia autofill persistente do navegador
  ['loginSenha', 'cadSenha', 'cadConfirmarSenha'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('focus', () => {
      if (input.value && input.dataset.touched !== '1') input.value = '';
      input.dataset.touched = '1';
    });
  });

  document.getElementById('btnEsqueceuSenha').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const erroEl = document.getElementById('loginErro');
    const sucessoEl = document.getElementById('resetSucesso');
    erroEl.textContent = '';
    sucessoEl.classList.remove('is-visible');

    if (!email) {
      erroEl.textContent = 'Digite seu e-mail acima para recuperar a senha.';
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      sucessoEl.classList.add('is-visible');
    } catch (e) {
      erroEl.textContent = traduzirErroFirebase(e.code);
    }
  });

  document.getElementById('btnEntrar').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const erroEl = document.getElementById('loginErro');
    erroEl.textContent = '';
    document.getElementById('resetSucesso').classList.remove('is-visible');

    if (!email || !senha) {
      erroEl.textContent = 'Preencha e-mail e senha.';
      return;
    }

    const btn = document.getElementById('btnEntrar');
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    try {
      await login(email, senha);
      limparCamposAuth();
      fecharModal();
      if (window.__onAuthSuccess) window.__onAuthSuccess();
    } catch (e) {
      erroEl.textContent = traduzirErroFirebase(e.code);
      document.getElementById('loginSenha').value = '';
      atualizarChecklist('', 'loginReqs');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  document.getElementById('btnCadastrar').addEventListener('click', async () => {
    const nome = document.getElementById('cadNome').value.trim();
    const telefone = document.getElementById('cadTelefone').value.trim();
    const email = document.getElementById('cadEmail').value.trim();
    const senha = document.getElementById('cadSenha').value;
    const confirmarSenha = document.getElementById('cadConfirmarSenha').value;
    const erroEl = document.getElementById('cadErro');
    erroEl.textContent = '';

    if (!nome || !email || !senha || !confirmarSenha) {
      erroEl.textContent = 'Preencha todos os campos obrigatórios.';
      return;
    }
    if (!nome.includes(' ')) {
      erroEl.textContent = 'Informe nome e sobrenome.';
      return;
    }

    const check = validarSenha(senha);
    if (!check.ok) {
      erroEl.textContent = `Senha inválida: ${check.erros.join(', ')}.`;
      return;
    }
    if (senha !== confirmarSenha) {
      erroEl.textContent = 'As senhas não coincidem. Verifique e tente novamente.';
      document.getElementById('cadConfirmarSenha').value = '';
      return;
    }

    const btn = document.getElementById('btnCadastrar');
    btn.disabled = true;
    btn.textContent = 'Criando conta…';

    try {
      await cadastrar({ nome, telefone, email, senha });
      limparCamposAuth();
      fecharModal();
      if (window.__onAuthSuccess) window.__onAuthSuccess();
    } catch (e) {
      erroEl.textContent = traduzirErroFirebase(e.code);
      document.getElementById('cadSenha').value = '';
      document.getElementById('cadConfirmarSenha').value = '';
      atualizarChecklist('', 'cadReqs');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Criar conta';
    }
  });
}

export function abrirModal(tabInicial = 'cadastro') {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  overlay.classList.remove('is-closing');
  limparCamposAuth();

  if (tabInicial === 'login') {
    document.getElementById('tabLogin')?.click();
  } else {
    document.getElementById('tabCadastro')?.click();
  }

  // limpa de novo após o click da tab (que também limpa)
  requestAnimationFrame(() => limparCamposAuth());

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  const overlay = document.getElementById('authOverlay');
  if (!overlay || (!overlay.classList.contains('is-open') && !overlay.classList.contains('is-closing'))) {
    return;
  }

  overlay.classList.add('is-closing');
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';

  setTimeout(() => {
    overlay.classList.remove('is-closing');
    limparCamposAuth();
  }, 420);
}

function atualizarNavbar(user) {
  const area = document.getElementById('navUserArea');
  if (!area) return;

  if (user) {
    const nome = user.displayName || user.email;
    area.innerHTML = `
      <span class="nav-user-name">Olá, ${nome.split(' ')[0]}</span>
      <a href="meus-pedidos.html" class="nav-btn-login" style="text-decoration:none">Meus Pedidos</a>
      <button class="nav-btn-logout" id="btnNavLogout">Sair</button>
    `;
    document.getElementById('btnNavLogout')?.addEventListener('click', async () => {
      await logout();
    });
  } else {
    area.innerHTML = `
      <button class="nav-btn-login" id="btnNavLogin">Entrar / Cadastrar</button>
    `;
    document.getElementById('btnNavLogin')?.addEventListener('click', () => abrirModal('login'));
  }
}

function traduzirErroFirebase(code) {
  const msgs = {
    'auth/user-not-found': 'E-mail não cadastrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': `Senha fraca. Use ${SENHA_MIN}–${SENHA_MAX} caracteres, 1 maiúscula e 1 número.`,
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
  };
  return msgs[code] || 'Erro inesperado. Tente novamente.';
}

async function abrirNoLoadSeNecessario() {
  // Só na home — evita abrir em checkout/admin automaticamente
  const isHome =
    /(?:^|\/)index\.html?$/.test(location.pathname) ||
    location.pathname === '/' ||
    location.pathname.endsWith('/landing-page-farmacia/') ||
    location.pathname.endsWith('/landing-page-farmacia');

  if (!isHome) return;
  if (sessionStorage.getItem('auth-modal-skipped') === '1') return;

  const user = await getUsuarioAtual();
  if (!user) {
    setTimeout(() => abrirModal('cadastro'), 450);
  }
}

// ── Init ──────────────────────────────────────
injetarModal();
setupModal();

onAuthStateChanged(auth, (user) => {
  atualizarNavbar(user);
});

abrirNoLoadSeNecessario();

export { getUsuarioAtual };
