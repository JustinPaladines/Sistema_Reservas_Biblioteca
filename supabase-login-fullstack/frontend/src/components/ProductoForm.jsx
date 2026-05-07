import { useState } from 'react';

const inicial = { nombre: '', categoria: '', precio: '', stock: '' };

export default function ProductoForm({ onCrear }) {
  const [form, setForm] = useState(inicial);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    await onCrear(form);
    setForm(inicial);
  };

  return (
    <form className="card" onSubmit={enviar}>
      <h2>Nuevo producto</h2>
      <input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Nombre" required />
      <input name="categoria" value={form.categoria} onChange={cambiar} placeholder="Categoría" required />
      <input name="precio" value={form.precio} onChange={cambiar} placeholder="Precio" type="number" min="0" step="0.01" required />
      <input name="stock" value={form.stock} onChange={cambiar} placeholder="Stock" type="number" min="0" required />
      <button>Guardar producto</button>
    </form>
  );
}
