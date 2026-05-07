import { obtenerToken } from './authService';

const API_URL = '/api/productos';

async function request(url, options = {}) {
  const token = await obtenerToken();
  if (!token) throw new Error('No existe una sesión activa');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error en la API');
  return data;
}

export const obtenerProductos = () => request(API_URL);
export const crearProducto = (producto) => request(API_URL, { method: 'POST', body: JSON.stringify(producto) });
export const actualizarProducto = (id, producto) => request(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(producto) });
export const eliminarProducto = (id) => request(`${API_URL}/${id}`, { method: 'DELETE' });
