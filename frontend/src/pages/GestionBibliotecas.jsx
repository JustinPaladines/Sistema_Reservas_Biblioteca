import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const GestionBibliotecas = () => {
    const navigate = useNavigate();

    const [bibliotecas, setBibliotecas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [nombre, setNombre] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [horarioApertura, setHorarioApertura] = useState("");
    const [horarioCierre, setHorarioCierre] = useState("");

    const [modoEdicion, setModoEdicion] = useState(false);
    const [bibliotecaEditando, setBibliotecaEditando] = useState(null);

    useEffect(() => {
        obtenerBibliotecas();
    }, []);

    const obtenerBibliotecas = async () => {
        const { data, error } = await supabase
            .from("bibliotecas")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error(error);
            return;
        }

        setBibliotecas(data);
        setLoading(false);
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

        if (!ubicacion.trim()) {
            alert("La ubicación es obligatoria");
            return false;
        }

        if (!horarioApertura) {
            alert("Debe ingresar la hora de apertura");
            return false;
        }

        if (!horarioCierre) {
            alert("Debe ingresar la hora de cierre");
            return false;
        }

        if (horarioApertura >= horarioCierre) {
            alert("La hora de apertura debe ser menor a la hora de cierre");
            return false;
        }

        return true;
    };

    const limpiarFormulario = () => {
        setNombre("");
        setUbicacion("");
        setHorarioApertura("");
        setHorarioCierre("");

        setModoEdicion(false);
        setBibliotecaEditando(null);
    };

    const crearBiblioteca = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        const { error } = await supabase
            .from("bibliotecas")
            .insert([
                {
                    nombre,
                    ubicacion,
                    horario_apertura: horarioApertura,
                    horario_cierre: horarioCierre,
                    estado: "activa"
                }
            ]);

        if (error) {
            alert(error.message);
            return;
        }

        limpiarFormulario();
        obtenerBibliotecas();
    };

    const cargarEdicion = (biblioteca) => {
        setModoEdicion(true);

        setBibliotecaEditando(biblioteca.id);

        setNombre(biblioteca.nombre);
        setUbicacion(biblioteca.ubicacion);
        setHorarioApertura(biblioteca.horario_apertura);
        setHorarioCierre(biblioteca.horario_cierre);
    };

    const actualizarBiblioteca = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        const { error } = await supabase
            .from("bibliotecas")
            .update({
                nombre,
                ubicacion,
                horario_apertura: horarioApertura,
                horario_cierre: horarioCierre
            })
            .eq("id", bibliotecaEditando);

        if (error) {
            alert(error.message);
            return;
        }

        limpiarFormulario();
        obtenerBibliotecas();
    };

    const eliminarBiblioteca = async (id) => {
        const confirmar = window.confirm(
            "¿Desea eliminar esta biblioteca?"
        );

        if (!confirmar) return;

        const { error } = await supabase
            .from("bibliotecas")
            .delete()
            .eq("id", id);

        if (error) {
            alert(error.message);
            return;
        }

        obtenerBibliotecas();
    };

    return (
        <div className="gestion-container">
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
                }

                .btn {
                    padding: 10px 18px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    color: white;
                    font-size: 14px;
                    margin: 4px;
                }

                .btn-morado {
                    background-color: #673ab7;
                }

                .btn-verde {
                    background-color: #2e7d32;
                }

                .btn-rojo {
                    background-color: #d32f2f;
                }

                .contenedor-tabla {
                    overflow-x: auto;
                    margin-top: 20px;
                }

                .tabla {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }

                .tabla th {
                    background-color: #673ab7;
                    color: white;
                    padding: 14px;
                }

                .tabla td {
                    padding: 14px;
                    border-bottom: 1px solid #eee;
                }

                .tabla tbody tr:nth-child(even) {
                    background-color: #fcfaff;
                }

                .tabla tbody tr:hover {
                    background-color: #f1f8e9;
                }
            `}</style>

            <h1 className="titulo-principal">
                Gestión de Bibliotecas
            </h1>

            <button
                className="btn btn-rojo"
                onClick={() => navigate(-1)}
            >
                Regresar
            </button>

            <form
                className="formulario-gestion"
                onSubmit={
                    modoEdicion
                        ? actualizarBiblioteca
                        : crearBiblioteca
                }
            >
                <input
                    type="text"
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Ubicación"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                />

                <input
                    type="time"
                    value={horarioApertura}
                    onChange={(e) =>
                        setHorarioApertura(e.target.value)
                    }
                />

                <input
                    type="time"
                    value={horarioCierre}
                    onChange={(e) =>
                        setHorarioCierre(e.target.value)
                    }
                />

                <button
                    type="submit"
                    className={`btn ${
                        modoEdicion
                            ? "btn-verde"
                            : "btn-morado"
                    }`}
                >
                    {modoEdicion
                        ? "Actualizar Biblioteca"
                        : "Crear Biblioteca"}
                </button>

                {modoEdicion && (
                    <button
                        type="button"
                        className="btn btn-rojo"
                        onClick={limpiarFormulario}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <div className="contenedor-tabla">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Ubicación</th>
                            <th>Apertura</th>
                            <th>Cierre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {!loading &&
                            bibliotecas.map((biblioteca) => (
                                <tr key={biblioteca.id}>
                                    <td>{biblioteca.id}</td>
                                    <td>{biblioteca.nombre}</td>
                                    <td>{biblioteca.ubicacion}</td>
                                    <td>{biblioteca.horario_apertura}</td>
                                    <td>{biblioteca.horario_cierre}</td>
                                    <td>{biblioteca.estado}</td>

                                    <td>
                                        <button
                                            className="btn btn-verde"
                                            onClick={() =>
                                                cargarEdicion(biblioteca)
                                            }
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="btn btn-rojo"
                                            onClick={() =>
                                                eliminarBiblioteca(
                                                    biblioteca.id
                                                )
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
        </div>
    );
};

export default GestionBibliotecas;