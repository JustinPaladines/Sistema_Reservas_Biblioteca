import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const EspaciosCompartidos = () => {
    const navigate = useNavigate();
    const [espacios, setEspacios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        obtenerEspacios();
    }, []);

    const obtenerEspacios = async () => {
        try {
            const data = await api("/api/espacios");
            setEspacios(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const actualizarSillas = async (id, accion) => {
        try {
            await api(`/api/espacios/${id}/sillas-externas`, {
                method: "PATCH",
                body: JSON.stringify({ accion })
            });
            // se actualizan las sillas disponibles después del cambio
            obtenerEspacios();
        } catch (error) {
            alert(error.message);
        }
    };

    const totalSillas = espacios.reduce((total, espacio) => total + Number(espacio.capacidad || 0), 0);
    const sillasOcupadas = espacios.reduce((total, espacio) => total + Number(espacio.sillas_ocupadas_externas || 0), 0);

    return (
        <div className="page-container">
            <h1 className="page-title">Espacios compartidos</h1>

            <button
                className="btn btn-danger btn-back"
                onClick={() => navigate(-1)}
            >
                Regresar
            </button>

            <hr className="section-divider" />

            {loading ? (
                <p>Cargando espacios...</p>
            ) : (
                <>
                    <p>Total de sillas registradas: {totalSillas}</p>
                    <p>Sillas ocupadas por personas sin acceso al sistema: {sillasOcupadas}</p>
                    <p>Sillas disponibles para reserva: {totalSillas - sillasOcupadas}</p>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Espacio</th>
                                    <th>Total de sillas</th>
                                    <th>Ocupadas temporalmente</th>
                                    <th>Disponibles</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {espacios.map((espacio) => {
                                    const total = Number(espacio.capacidad || 0);
                                    const ocupadas = Number(espacio.sillas_ocupadas_externas || 0);

                                    return (
                                        <tr key={espacio.id}>
                                            <td>{espacio.nombre}</td>
                                            <td>{total}</td>
                                            <td>{ocupadas}</td>
                                            <td>{total - ocupadas}</td>
                                            <td>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => actualizarSillas(espacio.id, "ocupar")}
                                                    disabled={ocupadas >= total}
                                                >
                                                    Ocupar silla
                                                </button>
                                                {" "}
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => actualizarSillas(espacio.id, "liberar")}
                                                    disabled={ocupadas <= 0}
                                                >
                                                    Liberar silla
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {espacios.length === 0 && (
                                    <tr>
                                        <td colSpan="5">No existen espacios registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default EspaciosCompartidos;