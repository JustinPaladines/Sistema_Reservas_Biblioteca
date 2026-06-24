import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const GestionEspacios = () => {
  const navigate = useNavigate();

  const [espacios, setEspacios] = useState([]);
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
  }, []);

  const obtenerEspacios = async () => {
    const { data, error } = await supabase
      .from("espacios")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setEspacios(data);
    loading && setLoading(false);
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
    if (!validarFormulario()) return;

    const { error } = await supabase
      .from("espacios")
      .insert([
        {
          nombre,
          descripcion,
          capacidad: Number(capacidad),
          ubicacion,
          estado: "disponible",
          biblioteca
        }
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    limpiarFormulario();
    obtenerEspacios();
  };

  const cargarEdicion = (espacio) => {
    setModoEdicion(true);
    setEspacioEditando(espacio.id);
    setNombre(espacio.nombre);
    setDescripcion(espacio.descripcion);
    setCapacidad(espacio.capacidad);
    setUbicacion(espacio.ubicacion);
    setBiblioteca(espacio.biblioteca);
  };

  const actualizarEspacio = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const { error } = await supabase
      .from("espacios")
      .update({
        nombre,
        descripcion,
        capacidad: Number(capacidad),
        ubicacion,
        biblioteca
      })
      .eq("id", espacioEditando);

    if (error) {
      alert(error.message);
      return;
    }

    limpiarFormulario();
    obtenerEspacios();
  };

  const eliminarEspacio = async (id) => {
    const confirmar = window.confirm("¿Deseas eliminar este espacio?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("espacios")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    obtenerEspacios();
  };

  return (
    <div className="gestion-container">
      {/* Estilos embebidos para evitar la necesidad de archivos CSS externos adicionales */}
      <style>{`
        .gestion-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 30px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: center;
          color: #333;
        }
        .titulo-principal {
          color: #512da8;
          margin-bottom: 25px;
          font-size: 2.2rem;
        }
        .formulario-gestion {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 450px;
          margin: 25px auto;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .formulario-gestion input {
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .formulario-gestion input:focus {
          border-color: #512da8;
          outline: none;
        }
        .btn {
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          color: white;
          font-size: 14px;
          transition: opacity 0.2s;
          margin: 4px;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .btn-morado { background-color: #673ab7; }
        .btn-verde { background-color: #2e7d32; }
        .btn-rojo { background-color: #d32f2f; }
        
        .separador {
          margin: 35px 0;
          border: 0;
          border-top: 1px solid #e0e0e0;
        }
        .contenedor-tabla {
          overflow-x: auto;
          margin-top: 20px;
        }
        .tabla-espacios {
          width: 100%;
          border-collapse: collapse;
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border-radius: 8px;
          overflow: hidden;
        }
        .tabla-espacios th {
          background-color: #673ab7;
          color: white;
          padding: 14px;
          font-weight: 600;
          text-align: center;
        }
        .tabla-espacios td {
          padding: 14px;
          border-bottom: 1px solid #eeeeee;
          text-align: center;
          font-size: 14px;
        }
        .tabla-espacios tbody tr:nth-child(even) {
          background-color: #fcfaff;
        }
        .tabla-espacios tbody tr:hover {
          background-color: #f1f8e9;
        }
        .cargando {
          font-size: 16px;
          color: #666;
          font-style: italic;
        }
      `}</style>

      <h1 className="titulo-principal">Gestión de Espacios</h1>

      <button className="btn btn-rojo" onClick={() => navigate(-1)}>
        Regresar
      </button>

      <form
        className="formulario-gestion"
        onSubmit={modoEdicion ? actualizarEspacio : crearEspacio}
      >
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />

        <input
          type="number"
          min="1"
          max="500"
          placeholder="Capacidad"
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Ubicación"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Biblioteca"
          value={biblioteca}
          onChange={(e) => setBiblioteca(e.target.value)}
          required
        />

        <button type="submit" className={`btn ${modoEdicion ? "btn-verde" : "btn-morado"}`}>
          {modoEdicion ? "Actualizar Espacio" : "Crear Espacio"}
        </button>

        {modoEdicion && (
          <button type="button" className="btn btn-rojo" onClick={limpiarFormulario}>
            Cancelar
          </button>
        )}
      </form>

      <hr className="separador" />

      {loading ? (
        <p className="cargando">Cargando espacios...</p>
      ) : (
        <div className="contenedor-tabla">
          <table className="tabla-espacios">
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
                  <td>{espacio.biblioteca}</td>

                  <td>
                    <button className="btn btn-verde" onClick={() => cargarEdicion(espacio)}>
                      Editar
                    </button>

                    <button className="btn btn-rojo" onClick={() => eliminarEspacio(espacio.id)}>
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