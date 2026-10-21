import { API_BASE } from './config.js';

const TOKEN_KEY = 'arte_auth_token';
const USER_KEY = 'arte_auth_user';

const listeners = new Set();

function lerUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistir(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  listeners.forEach((fn) => fn(user || null));
}

function limparSessao() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  listeners.forEach((fn) => fn(null));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = {};
  try {
    data = await resp.json();
  } catch {
    data = {};
  }

  if (resp.status === 401) {
    limparSessao();
  }

  if (!resp.ok) {
    const err = new Error(data.erro || 'Erro inesperado. Tente novamente.');
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function cadastrar({ nome, telefone, email, senha }) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, telefone, email, senha }),
  });
  persistir(data.token, data.user);
  return data.user;
}

export async function login(email, senha) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  persistir(data.token, data.user);
  return data.user;
}

export async function logout() {
  limparSessao();
}

export function getUsuarioAtual() {
  return Promise.resolve(lerUser());
}

export function getUsuarioAtualSync() {
  return lerUser();
}

export function onAuthStateChanged(_authOrCb, maybeCb) {
  const fn = typeof _authOrCb === 'function' ? _authOrCb : maybeCb;
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  fn(lerUser());
  return () => listeners.delete(fn);
}

export function redirecionarPorRole(user) {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }
  window.location.href = 'meus-pedidos.html';
}

export function exigirRole(role) {
  const user = lerUser();
  if (!user || !getToken()) {
    window.location.replace('login.html');
    return null;
  }
  if (role && user.role !== role) {
    redirecionarPorRole(user);
    return null;
  }
  return user;
}

export const auth = { currentUser: lerUser() };
