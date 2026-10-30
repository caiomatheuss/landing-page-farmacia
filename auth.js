import { supabase } from './config.js';

const listeners = new Set();
let usuarioCache = null;

function exigirCliente() {
  if (!supabase) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js.');
  }
}

function traduzirErro(error) {
  const msg = error?.message || '';
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/already registered|already been registered/i.test(msg)) return 'Este e-mail já está cadastrado.';
  if (/email not confirmed/i.test(msg)) return 'Confirme o e-mail antes de entrar.';
  return msg || 'Erro inesperado. Tente novamente.';
}

function perfilDe(authUser, cliente) {
  const nome = cliente?.nome || authUser?.user_metadata?.nome || '';
  return {
    id: cliente?.id || null,
    authId: authUser?.id || null,
    email: cliente?.email || authUser?.email || '',
    nome,
    displayName: nome || authUser?.email || '',
    role: cliente?.role || null,
    telefone: cliente?.telefone || authUser?.user_metadata?.telefone || null,
  };
}

export async function montarUsuario(authUser) {
  exigirCliente();
  if (!authUser) return null;

  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, email, nome, telefone, role')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) return perfilDe(authUser, data);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return perfilDe(authUser, null);
}

function avisar(user) {
  usuarioCache = user || null;
  listeners.forEach((fn) => fn(usuarioCache));
}

export async function cadastrar({ nome, telefone, email, senha }) {
  exigirCliente();
  const { data, error } = await supabase.auth.signUp({
    email: String(email || '').trim().toLowerCase(),
    password: senha,
    options: {
      data: {
        nome: String(nome || '').trim(),
        telefone: String(telefone || '').trim(),
      },
    },
  });

  if (error) throw new Error(traduzirErro(error));
  if (!data.session || !data.user) {
    throw new Error('Conta criada. Confirme o e-mail antes de entrar. No Supabase, em Authentication → Providers → Email, desligue "Confirm email" para entrar na hora.');
  }

  const user = await montarUsuario(data.user);
  avisar(user);
  return user;
}

export async function login(email, senha) {
  exigirCliente();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password: senha,
  });
  if (error) throw new Error(traduzirErro(error));
  const user = await montarUsuario(data.user);
  avisar(user);
  return user;
}

export async function logout() {
  usuarioCache = null;
  if (supabase) await supabase.auth.signOut();
  listeners.forEach((fn) => fn(null));
}

export async function getUsuarioAtual() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    avisar(null);
    return null;
  }
  const user = await montarUsuario(session.user);
  usuarioCache = user;
  return user;
}

export function getUsuarioAtualSync() {
  return usuarioCache;
}

export function onAuthStateChanged(_authOrCb, maybeCb) {
  const fn = typeof _authOrCb === 'function' ? _authOrCb : maybeCb;
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  fn(usuarioCache);
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

export async function exigirRole(role) {
  const user = await getUsuarioAtual();
  if (!user) {
    window.location.replace('login.html');
    return null;
  }
  if (role && user.role !== role) {
    redirecionarPorRole(user);
    return null;
  }
  return user;
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(async () => {
      if (!session?.user) {
        avisar(null);
        return;
      }
      try {
        avisar(await montarUsuario(session.user));
      } catch {
        avisar(null);
      }
    }, 0);
  });
}
