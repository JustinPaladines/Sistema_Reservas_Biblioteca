import { useState } from 'react';
import { login, registrar } from '../services/authService';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const manejarSubmit = async (accion) => {
    try {
      setMensaje('Procesando...');
      if (accion === 'login') await login(email, password);
      if (accion === 'registro') await registrar(email, password);
      setMensaje('Sesión iniciada correctamente');
    } catch (error) {
      setMensaje(error.message);
    }
  };

  return (
    <section className="card auth-card">
      <h2>Login Firebase</h2>
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
