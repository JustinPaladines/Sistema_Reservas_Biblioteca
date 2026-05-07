import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import ProductoForm from './components/ProductoForm';
import ProductoList from './components/ProductoList';
import { escucharSesion, logout } from './services/authService';
import { actualizarProducto, crearProducto, eliminarProducto, obtenerProductos } from './services/productosService';
import './styles.css';

console.log("API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cancelar = escucharSesion((user) => setUsuario(user));
    return () => cancelar();
  }, []);

  const cargarProductos = async () => {
    try {
      setMensaje('Cargando productos...');
      const data = await obtenerProductos();
      setProductos(data);
      setMensaje('');
    } catch (error) {
      setMensaje(error.message);
    }
  };

  useEffect(() => {
    if (usuario) cargarProductos();
    else setProductos([]);
  }, [usuario]);

  const manejarCrear = async (producto) => {
    await crearProducto(producto);
    await cargarProductos();
  };

  const manejarEliminar = async (id) => {
    if (!confirm('¿Eliminar producto?')) return;
    await eliminarProducto(id);
    await cargarProductos();
  };

  const manejarActualizar = async (id, cambios) => {
    await actualizarProducto(id, cambios);
    await cargarProductos();
  };

  return (
    <main>
      <header className="hero">
        <h1>Firebase Auth + Firestore</h1>
        <p>Ejercicio fullstack con formulario de usuario y clave.</p>
      </header>

      {!usuario ? (
        <LoginForm />
      ) : (
        <>
          <section className="card session-card">
            <p><strong>Usuario:</strong> {usuario.email}</p>
            <div className="row">
              <button onClick={cargarProductos}>Recargar</button>
              <button className="danger" onClick={logout}>Cerrar sesión</button>
            </div>
          </section>
          <ProductoForm onCrear={manejarCrear} />
          {mensaje && <p className="message">{mensaje}</p>}
          <ProductoList productos={productos} onEliminar={manejarEliminar} onActualizar={manejarActualizar} />
        </>
      )}
    </main>
  );
}
