// ══════════════════════════════════════════════
//  auth.js — Firebase Auth módulo compartilhado
//  Arte Pharmaceutica
// ══════════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAbL_EBo9RJjBB07dpP6WdAPy3zOFGn-0Y",
  authDomain: "arte-pharmaceutica.firebaseapp.com",
  projectId: "arte-pharmaceutica",
  storageBucket: "arte-pharmaceutica.firebasestorage.app",
  messagingSenderId: "797979383872",
  appId: "1:797979383872:web:43982e446dd5e20af4a7a5",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Cadastro ──────────────────────────────────
export async function cadastrar({ nome, telefone, email, senha }) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  await updateProfile(cred.user, { displayName: nome });
  await setDoc(doc(db, 'usuarios', cred.user.uid), {
    nome,
    telefone,
    email,
    criadoEm: new Date().toISOString(),
  });
  return cred.user;
}

// ── Login ─────────────────────────────────────
export async function login(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

// ── Logout ────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── Usuário atual (Promise) ───────────────────
export function getUsuarioAtual() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      resolve(user);
    });
  });
}

// ── Dados extras do usuário (Firestore) ──────
export async function getDadosUsuario(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Observer de estado ────────────────────────
export { onAuthStateChanged, auth };