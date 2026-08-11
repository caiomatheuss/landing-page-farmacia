// ══════════════════════════════════════════════
//  login-modal.js — Modal de Login/Cadastro
//  Inclua este script em todas as páginas HTML
//  Arte Pharmaceutica
// ══════════════════════════════════════════════

import { cadastrar, login, logout, getUsuarioAtual, onAuthStateChanged, auth } from './auth.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ── Injeta o HTML do modal no body ────────────
function injetarModal() {
  const html = `
  <style>
    /* ── Overlay ── */
    #authOverlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,20,50,0.65);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 0.35s;
    }
    #authOverlay.is-open {
      opacity: 1; pointer-events: all;
    }

    /* ── Modal box ── */
    .auth-modal {
      background: #fff;
      width: 100%;
      max-width: 420px;
      margin: 1rem;
      border-radius: 4px;
      box-shadow: 0 32px 80px rgba(0,20,50,0.25);
      overflow: hidden;
      transform: translateY(24px);
      transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
    }
    #authOverlay.is-open .auth-modal { transform: translateY(0); }

    /* ── Header do modal ── */
    .auth-header {
      background: #002B5B;
      padding: 1.5rem 1.75rem 1.25rem;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .auth-logo {
      height: 40px; width: auto;
      filter: brightness(0) invert(1);
    }
    .auth-close {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.5); padding: 0; line-height: 1;
      transition: color 0.2s;
    }
    .auth-close:hover { color: #fff; }

    /* ── Tabs ── */
    .auth-tabs {
      display: flex;
      border-bottom: 1px solid rgba(0,43,91,0.1);
    }
    .auth-tab {
      flex: 1; padding: 1rem;
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

    /* ── Body ── */
    .auth-body { padding: 1.75rem; }

    /* ── Campos ── */
    .auth-field {
      display: flex; flex-direction: column; gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .auth-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.62rem; letter-spacing: 0.14em;
      text-transform: uppercase; font-weight: 600;
      color: #002B5B;
    }
    .auth-input {
      width: 100%; padding: 0.85rem 1rem;
      font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
      color: #1a2b3c; background: #f8f7f4;
      border: 1px solid rgba(0,43,91,0.12); border-radius: 2px;
      outline: none; box-sizing: border-box;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .auth-input:focus {
      border-color: #C5A059;
      box-shadow: 0 0 0 3px rgba(197,160,89,0.1);
      background: #fff;
    }
    .auth-error {
      font-size: 0.72rem; color: #e05252; font-weight: 500;
      min-height: 1rem; margin-top: -0.5rem;
    }

    /* ── Esqueceu a senha ── */
    .auth-forgot {
      display: block; text-align: right;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.68rem; color: #C5A059;
      text-decoration: none; margin-top: -0.5rem; margin-bottom: 1rem;
      cursor: pointer; background: none; border: none; padding: 0;
      transition: color 0.3s;
    }
    .auth-forgot:hover { color: #002B5B; }

    /* ── Mensagem de sucesso ── */
    .auth-success {
      font-size: 0.78rem; color: #1a7a48; font-weight: 500;
      background: rgba(50,188,100,0.08);
      border: 1px solid rgba(50,188,100,0.25);
      border-radius: 4px; padding: 0.75rem 1rem;
      margin-top: -0.5rem; margin-bottom: 0.5rem;
      display: none;
    }
    .auth-success.is-visible { display: block; }

    /* ── Botão principal ── */
    .auth-btn-primary {
      width: 100%; padding: 1rem;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.16em; text-transform: uppercase;
      background: #C5A059; color: #002B5B;
      border: none; border-radius: 2px; cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      margin-top: 0.5rem;
    }
    .auth-btn-primary:hover { background: #d4af6a; transform: translateY(-1px); }
    .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* ── Continuar sem login ── */
    .auth-skip {
      width: 100%; padding: 0.75rem;
      background: none; border: 1px solid rgba(0,43,91,0.15);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.68rem; font-weight: 500;
      letter-spacing: 0.08em; color: #5a6b7d;
      border-radius: 2px; cursor: pointer; margin-top: 0.75rem;
      transition: border-color 0.3s, color 0.3s;
    }
    .auth-skip:hover { border-color: #C5A059; color: #002B5B; }

    /* ── Navbar: área de usuário ── */
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
      border-radius: 2px; cursor: pointer;
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
  </style>

  <div id="authOverlay" role="dialog" aria-modal="true" aria-label="Login ou Cadastro">
    <div class="auth-modal">

      <!-- Header -->
      <div class="auth-header">
        <img class="auth-logo" src="images/brand/logo-arte.png" alt="Arte Pharmaceutica">
        <button class="auth-close" id="authCloseBtn" aria-label="Fechar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs">
        <button class="auth-tab is-active" id="tabLogin" data-tab="login">Entrar</button>
        <button class="auth-tab" id="tabCadastro" data-tab="cadastro">Criar conta</button>
      </div>

      <!-- Body -->
      <div class="auth-body">

        <!-- PAINEL LOGIN -->
        <div id="painelLogin">
          <div class="auth-field">
            <label class="auth-label" for="loginEmail">E-mail</label>
            <input class="auth-input" type="email" id="loginEmail" placeholder="seu@email.com" autocomplete="email">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="loginSenha">Senha</label>
            <input class="auth-input" type="password" id="loginSenha" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="auth-forgot" id="btnEsqueceuSenha">Esqueceu sua senha?</button>
          <div class="auth-success" id="resetSucesso">E-mail de recuperação enviado! Verifique sua caixa de entrada.</div>
          <div class="auth-error" id="loginErro"></div>
          <button class="auth-btn-primary" id="btnEntrar">Entrar</button>
          <button class="auth-skip" id="btnSkipLogin">Continuar sem login</button>
        </div>

        <!-- PAINEL CADASTRO -->
        <div id="painelCadastro" style="display:none">
          <div class="auth-field">
            <label class="auth-label" for="cadNome">Nome completo</label>
            <input class="auth-input" type="text" id="cadNome" placeholder="Seu nome completo" autocomplete="name">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadTelefone">Telefone / WhatsApp</label>
            <input class="auth-input" type="tel" id="cadTelefone" placeholder="(41) 99999-9999" autocomplete="tel">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadEmail">E-mail</label>
            <input class="auth-input" type="email" id="cadEmail" placeholder="seu@email.com" autocomplete="email">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadSenha">Senha</label>
            <input class="auth-input" type="password" id="cadSenha" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
          </div>
          <div class="auth-field">
            <label class="auth-label" for="cadConfirmarSenha">Confirmar senha</label>
            <input class="auth-input" type="password" id="cadConfirmarSenha" placeholder="Repita a senha" autocomplete="new-password">
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

// ── Lógica do modal ───────────────────────────
function setupModal() {
  const overlay   = document.getElementById('authOverlay');
  const closeBtn  = document.getElementById('authCloseBtn');
  const tabLogin  = document.getElementById('tabLogin');
  const tabCad    = document.getElementById('tabCadastro');
  const pLogin    = document.getElementById('painelLogin');
  const pCad      = document.getElementById('painelCadastro');

  // Tabs
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('is-active'); tabCad.classList.remove('is-active');
    pLogin.style.display = ''; pCad.style.display = 'none';
  });
  tabCad.addEventListener('click', () => {
    tabCad.classList.add('is-active'); tabLogin.classList.remove('is-active');
    pCad.style.display = ''; pLogin.style.display = 'none';
  });

  // Fechar
  closeBtn.addEventListener('click', fecharModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) fecharModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

  // Skip (continuar sem login)
  document.getElementById('btnSkipLogin').addEventListener('click', fecharModal);
  document.getElementById('btnSkipCadastro').addEventListener('click', fecharModal);

  // Esqueceu a senha
  document.getElementById('btnEsqueceuSenha').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const erroEl = document.getElementById('loginErro');
    const sucessoEl = document.getElementById('resetSucesso');
    erroEl.textContent = '';
    sucessoEl.classList.remove('is-visible');

    if (!email) { erroEl.textContent = 'Digite seu e-mail acima para recuperar a senha.'; return; }

    try {
      await sendPasswordResetEmail(auth, email);
      sucessoEl.classList.add('is-visible');
    } catch (e) {
      erroEl.textContent = traduzirErroFirebase(e.code);
    }
  });

  // Entrar
  document.getElementById('btnEntrar').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const erroEl = document.getElementById('loginErro');
    erroEl.textContent = '';
    document.getElementById('resetSucesso').classList.remove('is-visible');

    if (!email || !senha) { erroEl.textContent = 'Preencha e-mail e senha.'; return; }

    const btn = document.getElementById('btnEntrar');
    btn.disabled = true; btn.textContent = 'Entrando…';

    try {
      await login(email, senha);
      fecharModal();
      if (window.__onAuthSuccess) window.__onAuthSuccess();
    } catch (e) {
      erroEl.textContent = traduzirErroFirebase(e.code);
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });

  // Cadastrar
  document.getElementById('btnCadastrar').addEventListener('click', async () => {
    const nome            = document.getElementById('cadNome').value.trim();
    const telefone        = document.getElementById('cadTelefone').value.trim();
    const email           = document.getElementById('cadEmail').value.trim();
    const senha           = document.getElementById('cadSenha').value;
    const confirmarSenha  = document.getElementById('cadConfirmarSenha').value;
    const erroEl          = document.getElementById('cadErro');
    erroEl.textContent = '';

    if (!nome || !email || !senha || !confirmarSenha) { erroEl.textContent = 'Preencha todos os campos obrigatórios.'; return; }
    if (!nome.includes(' ')) { erroEl.textContent = 'Informe nome e sobrenome.'; return; }
    if (senha.length < 6) { erroEl.textContent = 'A senha deve ter no mínimo 6 caracteres.'; return; }
    if (senha !== confirmarSenha) { erroEl.textContent = 'As senhas não coincidem. Verifique e tente novamente.'; return; }

    const btn = document.getElementById('btnCadastrar');
    btn.disabled = true; btn.textContent = 'Criando conta…';

    try {
      await cadastrar({ nome, telefone, email, senha });
      fecharModal();
      if (window.__onAuthSuccess) window.__onAuthSuccess();
    } catch (e) {
      erroEl.textContent = traduzirErroFirebase(e.code);
    } finally {
      btn.disabled = false; btn.textContent = 'Criar conta';
    }
  });
}

// ── Abrir / fechar modal ──────────────────────
export function abrirModal(tabInicial = 'login') {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  if (tabInicial === 'cadastro') {
    document.getElementById('tabCadastro')?.click();
  } else {
    document.getElementById('tabLogin')?.click();
  }
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

// ── Atualiza navbar com nome/logout ──────────
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
    document.getElementById('btnNavLogin')?.addEventListener('click', () => abrirModal());
  }
}

// ── Tradução de erros Firebase ────────────────
function traduzirErroFirebase(code) {
  const msgs = {
    'auth/user-not-found':       'E-mail não cadastrado.',
    'auth/wrong-password':       'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email':        'E-mail inválido.',
    'auth/weak-password':        'Senha muito fraca (mínimo 6 caracteres).',
    'auth/too-many-requests':    'Muitas tentativas. Aguarde alguns minutos.',
    'auth/invalid-credential':   'E-mail ou senha incorretos.',
  };
  return msgs[code] || 'Erro inesperado. Tente novamente.';
}

// ── Init ──────────────────────────────────────
injetarModal();
setupModal();

// Observa mudanças de auth e atualiza navbar
onAuthStateChanged(auth, user => {
  atualizarNavbar(user);
});

export { getUsuarioAtual };