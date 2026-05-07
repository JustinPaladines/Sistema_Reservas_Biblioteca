import { supabase } from '../supabaseClient';

export async function registrar(email, password) {
  return await supabase.auth.signUp({ email, password });
}

export async function login(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
  return await supabase.auth.signOut();
}

export async function obtenerSesion() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function escucharSesion(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

export async function obtenerToken() {
  const session = await obtenerSesion();
  return session?.access_token || null;
}
