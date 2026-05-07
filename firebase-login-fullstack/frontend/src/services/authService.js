import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseClient';

export const registrar = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const escucharSesion = (callback) => onAuthStateChanged(auth, callback);
export const obtenerToken = async () => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
};
