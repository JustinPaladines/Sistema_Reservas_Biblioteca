import { useState } from 'react';
import { login, registrar } from '../services/authService';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarSubmit = async (accion) => {
    try {
      setMensaje('Procesando...');
      const { error } = accion === 'login'
        ? await login(email, password)
        : await registrar(email, password);

      if (error) throw error;
      setMensaje(accion === 'login' ? 'Sesión iniciada correctamente' : 'Usuario registrado. Revisa confirmación de email si está activada.');
    } catch (error) {
      setMensaje(error.message);
    }
  };

  return (
    <section className="card auth-card">
      <h2>Login Supabase</h2>
      <p>Ingresa con usuario y clave. Si no tienes cuenta, presiona Registrarse.</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@correo.com" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Clave" type="password" />
      <div className="row">
        <button onClick={() => manejarSubmit('login')}>Ingresar</button>
        <button className="secondary" onClick={() => manejarSubmit('registro')}>Registrarse</button>
      </div>
      {mensaje && <p className="message">{mensaje}</p>}
    </section>
  );
}
