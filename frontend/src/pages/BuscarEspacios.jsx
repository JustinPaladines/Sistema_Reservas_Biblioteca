import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const BuscarEspacios = () => {
    const navigate = useNavigate();

    const [espacios, setEspacios] = useState([]);
    const [espaciosFiltrados, setEspaciosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);

    const [biblioteca, setBiblioteca] = useState("");
    const [capacidadMinima, setCapacidadMinima] = useState("");

    useEffect(() => {
        obtenerEspacios();
    }, []);

    const obtenerEspacios = async () => {
        const { data, error } = await supabase
            .from("espacios")
            .select("*")
            .eq("estado", "disponible")
            .order("id", { ascending: true });

        if (error) {
            console.error(error);
            alert("Error al cargar espacios");
            return;
        }

        setEspacios(data);
        setEspaciosFiltrados(data);
        setLoading(false);
    };

    const buscarEspacios = () => {
        let resultado = [...espacios];

        if (biblioteca.trim() !== "") {
            resultado = resultado.filter((espacio) =>
                espacio.biblioteca
                    .toLowerCase()
                    .includes(biblioteca.toLowerCase())
            );
        }

        if (capacidadMinima !== "") {
            resultado = resultado.filter(
                (espacio) =>
                    espacio.capacidad >= Number(capacidadMinima)
            );
        }

        setEspaciosFiltrados(resultado);
    };

    const limpiarFiltros = () => {
        setBiblioteca("");
        setCapacidadMinima("");
        setEspaciosFiltrados(espacios);
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

                .filtros {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                    margin: 25px 0;
                }

                .filtros input {
                    padding: 12px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    min-width: 220px;
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
                    transition: opacity 0.2s;
                    margin: 4px;
                }

                .btn:hover {
                    opacity: 0.9;
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

            <h1 className="titulo-principal">
                Buscar Espacios
            </h1>

            <button
                className="btn btn-rojo"
                onClick={() => navigate(-1)}
            >
                Regresar
            </button>

            <div className="filtros">
                <input
                    type="text"
                    placeholder="Biblioteca"
                    value={biblioteca}
                    onChange={(e) => setBiblioteca(e.target.value)}
                />

                <input
                    type="number"
                    min="1"
                    placeholder="Capacidad mínima"
                    value={capacidadMinima}
                    onChange={(e) =>
                        setCapacidadMinima(e.target.value)
                    }
                />

                <button
                    className="btn btn-morado"
                    onClick={buscarEspacios}
                >
                    Buscar
                </button>

                <button
                    className="btn btn-verde"
                    onClick={limpiarFiltros}
                >
                    Limpiar
                </button>
            </div>

            {loading ? (
                <p className="cargando">
                    Cargando espacios...
                </p>
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
                                <th>Biblioteca</th>
                                <th>Estado</th>
                            </tr>
                        </thead>

                        <tbody>
                            {espaciosFiltrados.length > 0 ? (
                                espaciosFiltrados.map((espacio) => (
                                    <tr key={espacio.id}>
                                        <td>{espacio.id}</td>
                                        <td>{espacio.nombre}</td>
                                        <td>{espacio.descripcion}</td>
                                        <td>{espacio.capacidad}</td>
                                        <td>{espacio.ubicacion}</td>
                                        <td>{espacio.biblioteca}</td>
                                        <td>{espacio.estado}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7">
                                        No se encontraron espacios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BuscarEspacios;