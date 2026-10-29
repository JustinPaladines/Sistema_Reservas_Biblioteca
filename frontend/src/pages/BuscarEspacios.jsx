import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/buscarEspacios.css";
import "../styles/global.css";
import api from "../services/api";

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

    try {

        const data = await api("/api/espacios/available");


        setEspacios(data);
        setEspaciosFiltrados(data);


    } catch (error) {

        console.error(error);
        alert("Error al cargar espacios");

    } finally {

        setLoading(false);

    }
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
        <div className="page-container">
            <h1 className="page-title">
                Buscar Espacios
            </h1>

            <button
                className="btn btn-danger btn-back"
                onClick={() => navigate(-1)}
            >
                Regresar
            </button>

            <div className="filtros">
                <input
                    className="form-input"
                    type="text"
                    placeholder="Biblioteca"
                    value={biblioteca}
                    onChange={(e) => setBiblioteca(e.target.value)}
                />

                <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="Capacidad mínima"
                    value={capacidadMinima}
                    onChange={(e) =>
                        setCapacidadMinima(e.target.value)
                    }
                />

                <button
                    className="btn btn-primary"
                    onClick={buscarEspacios}
                >
                    Buscar
                </button>

                <button
                    className="btn btn-success"
                    onClick={limpiarFiltros}
                >
                    Limpiar
                </button>
            </div>

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