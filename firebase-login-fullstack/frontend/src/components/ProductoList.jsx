export default function ProductoList({ productos, onEliminar, onActualizar }) {
  if (productos.length === 0) return <p>No hay productos registrados.</p>;

  return (
    <section className="grid">
      {productos.map((p) => (
        <article className="card" key={p.id}>
          <h3>{p.nombre}</h3>
          <p><strong>Categoría:</strong> {p.categoria}</p>
          <p><strong>Precio:</strong> ${p.precio}</p>
          <p><strong>Stock:</strong> {p.stock}</p>
          <div className="row">
            <button className="secondary" onClick={() => {
              const precio = prompt('Nuevo precio:', p.precio);
              if (precio !== null) onActualizar(p.id, { precio });
            }}>Editar precio</button>
            <button className="danger" onClick={() => onEliminar(p.id)}>Eliminar</button>
          </div>
        </article>
      ))}
    </section>
  );
}
