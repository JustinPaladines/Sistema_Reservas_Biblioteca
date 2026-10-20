import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionReservasBibliotecario = () => {
    const navigate = useNavigate();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        obtenerReservas();
    }, []);

    const obtenerReservas = async () => {
        try {
            const data = await api("/api/reservations");
            // se muestran las reservas activas y las que están en progreso
            setReservas(data.filter((reserva) => {
                const estado = String(reserva.estado).toLowerCase();
                return estado === "activa" || estado === "en progreso";
            }));
        } catch (error) {
            console.error("Error cargando reservas:", error);
        } finally {
            setLoading(false);
        }
    };

    const marcarAsistencia = async (id) => {
        try {
            await api(`/api/reservations/${id}/attendance`, {
                method: "PATCH"
            });
            // se actualiza la lista cuando se registra la asistencia
            obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const registrarInconveniente = async (id) => {
        const observacion = window.prompt("Escribe el inconveniente observado:");

        if (observacion === null) return;

        try {
            await api(`/api/reservations/${id}/incident`, {
                method: "PATCH",
                body: JSON.stringify({
                    inconvenientes: observacion.trim() || "Sin inconvenientes"
                })
            });
            // se guarda la observación del bibliotecario
            obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const cancelarReserva = async (id) => {
        if (!window.confirm("¿Cancelar reserva?")) return;

        try {
            await api(`/api/reservations/${id}/cancel`, {
                method: "PATCH"
            });
            obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const confirmarReserva = async (id) => {
        try {
            await api(`/api/reservations/${id}/check-in`, {
                method: "PATCH"
            });
            obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const finalizarReserva = async (id) => {
        try {
            await api(`/api/reservations/${id}/finish`, {
                method: "PATCH"
            });
            obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">
                Gestión de Reservas
            </h1>

            <button
                className="btn btn-danger btn-back"
                onClick={() => navigate(-1)}
            >
                Regresar
            </button>

            <hr className="section-divider" />

            {loading ? (
                <p>
                    Cargando reservas...
                </p>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Espacio</th>
                                <th>Fecha</th>
                                <th>Inicio</th>
                                <th>Observación</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {reservas.length > 0 ? (
                                reservas.map((reserva) => (
                                    <tr key={reserva.id}>
                                        <td>
                                            {reserva.id}
                                        </td>

                                        <td>
                                            {reserva.usuario_nombre || reserva.usuario_correo || reserva.usuario_id}
                                        </td>

                                        <td>
                                            {reserva.espacio_nombre || reserva.espacio_id}
                                        </td>

                                        <td>
                                            {reserva.fecha}
                                        </td>

                                        <td>
                                            {reserva.hora_inicio}
                                        </td>

                                        <td>
                                            {reserva.observacion || "Sin observación"}
                                        </td>

                                        <td>
                                            {reserva.estado}
                                        </td>

                                        <td>
                                            {String(reserva.estado).toLowerCase() === "activa" && (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => marcarAsistencia(reserva.id)}
                                                >
                                                    Asistencia
                                                </button>
                                            )}

                                            {(String(reserva.estado).toLowerCase() === "activa" ||
                                                String(reserva.estado).toLowerCase() === "en progreso") && (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => finalizarReserva(reserva.id)}
                                                >
                                                    Finalizar
                                                </button>
                                            )}

                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => registrarInconveniente(reserva.id)}
                                            >
                                                Inconveniente
                                            </button>

                                            <button
                                                className="btn btn-danger"
                                                onClick={() => cancelarReserva(reserva.id)}
                                            >
                                                Cancelar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8">
                                        No existen reservas activas o en progreso.
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

export default GestionReservasBibliotecario;