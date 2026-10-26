import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/gestionEspacios.css";
import "../styles/global.css";

const GestionEspacios = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const esBibliotecario = location.pathname.startsWith("/bibliotecario/");

  const [espacios, setEspacios] = useState([]);
  const [bibliotecas, setBibliotecas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [biblioteca, setBiblioteca] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [espacioEditando, setEspacioEditando] = useState(null);

  useEffect(() => {
    obtenerEspacios();
    obtenerBibliotecas();
  }, []);

  const obtenerBibliotecas = async () => {
    try {
      const data = await api("/api/libraries");
      setBibliotecas(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar las bibliotecas");
    }
  };

  const seleccionarBiblioteca = (id) => {
    setBiblioteca(id);
    const seleccionada = bibliotecas.find((item) => String(item.id) === String(id));
    setUbicacion(seleccionada?.ubicacion || "");
  };

  const obtenerEspacios = async () => {
    try {
      const data = await api("/api/espacios");
      setEspacios(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar los espacios");
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    if (!nombre.trim()) {
      alert("El nombre es obligatorio");
      return false;
    }

    if (nombre.trim().length < 3) {
      alert("El nombre debe tener al menos 3 caracteres");
      return false;
    }

    if (!descripcion.trim()) {
      alert("La descripción es obligatoria");
      return false;
    }

    if (!ubicacion.trim()) {
      alert("La ubicación es obligatoria");
      return false;
    }

    if (!biblioteca.trim()) {
      alert("La biblioteca es obligatoria");
      return false;
    }

    if (!capacidad || Number(capacidad) <= 0) {
      alert("La capacidad debe ser mayor a 0");
      return false;
    }

    if (Number(capacidad) > 500) {
      alert("La capacidad no puede ser mayor a 500");
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setCapacidad("");
    setUbicacion("");
    setBiblioteca("");
    setModoEdicion(false);
    setEspacioEditando(null);
  };

  const crearEspacio = async (e) => {
    e.preventDefault();

    // Solo el administrador puede crear espacios.
    if (esBibliotecario) {
      alert("No tienes permisos para crear espacios");
      return;
    }

    if (!validarFormulario()) return;

    try {
      await api("/api/espacios", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          descripcion,
          capacidad: Number(capacidad),
          ubicacion,
          estado: "disponible",
          biblioteca_id: Number(biblioteca),
        }),
      });

      limpiarFormulario();
      obtenerEspacios();
    } catch (error) {
      console.error(error);
      alert(error.message || "Error al crear el espacio");
    }
  };

  const cargarEdicion = (espacio) => {
    setModoEdicion(true);
    setEspacioEditando(espacio.id);

    setNombre(espacio.nombre);
    setDescripcion(espacio.descripcion);
    setCapacidad(espacio.capacidad);
    setUbicacion(espacio.ubicacion);
    const bibliotecaActual = bibliotecas.find((item) => String(item.id) === String(espacio.biblioteca_id ?? espacio.biblioteca) || item.nombre === espacio.biblioteca);
    setBiblioteca(bibliotecaActual ? String(bibliotecaActual.id) : String(espacio.biblioteca_id ?? espacio.biblioteca));
  };

  const actualizarEspacio = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      await api(`/api/espacios/${espacioEditando}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre,
          descripcion,
          capacidad: Number(capacidad),
          ubicacion,
          biblioteca_id: Number(biblioteca),
        }),
      });

      limpiarFormulario();
      obtenerEspacios();
    } catch (error) {
      console.error(error);
      alert(error.message || "Error al actualizar el espacio");
    }
  };

  const eliminarEspacio = async (id) => {
    const confirmar = window.confirm(
      "¿Deseas eliminar este espacio?"
    );

    if (!confirmar) return;

    try {
      await api(`/api/espacios/${id}`, {
        method: "DELETE",
      });

      obtenerEspacios();
    } catch (error) {
      console.error(error);
      alert(error.message || "Error al eliminar el espacio");
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">
        Gestión de Espacios
      </h1>

      <button
        className="btn btn-danger btn-back"
        onClick={() => navigate(-1)}
      >
        Regresar
      </button>

      {(!esBibliotecario || modoEdicion) && (
      <form
        className="form-card formulario-gestion"
        onSubmit={modoEdicion ? actualizarEspacio : crearEspacio}
      >
        <input
          className="form-input"
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          className="form-input"
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />

        <input
          className="form-input"
          type="number"
          min="1"
          max="500"
          placeholder="Capacidad"
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          required
        />

        <select
          className="form-input"
          value={biblioteca}
          onChange={(e) => seleccionarBiblioteca(e.target.value)}
          required
        >
          <option value="">Seleccione una biblioteca</option>
          {bibliotecas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>

        <input
          className="form-input"
          type="text"
          placeholder="Ubicación"
          value={ubicacion}
          readOnly
          required
        />

        <button
          type="submit"
          className={`btn ${
            modoEdicion ? "btn-success" : "btn-primary"
          }`}
        >
          {modoEdicion ? "Actualizar Espacio" : "Crear Espacio"}
        </button>

        {modoEdicion && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={limpiarFormulario}
          >
            Cancelar
          </button>
        )}
      </form>
      )}

      <hr className="section-divider" />

      {loading ? (
        <p className="loading">
          Cargando espacios...
        </p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Capacidad</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Biblioteca</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {espacios.map((espacio) => (
                <tr key={espacio.id}>
                  <td>{espacio.id}</td>
                  <td>{espacio.nombre}</td>
                  <td>{espacio.descripcion}</td>
                  <td>{espacio.capacidad}</td>
                  <td>{espacio.ubicacion}</td>
                  <td>{espacio.estado}</td>
                  <td>{bibliotecas.find((item) => String(item.id) === String(espacio.biblioteca_id ?? espacio.biblioteca))?.nombre || espacio.biblioteca_id || espacio.biblioteca}</td>

                  {/* Separación aplicada mediante flex y gap */}
                  <td style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-success"
                      onClick={() =>
                        cargarEdicion(espacio)
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        eliminarEspacio(espacio.id)
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestionEspacios;