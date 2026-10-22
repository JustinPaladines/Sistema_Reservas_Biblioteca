import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const MisReservas = () => {
    const navigate = useNavigate();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        obtenerReservas();
    }, []);

    const obtenerReservas = async () => {
        try {
        const user = JSON.parse(
            localStorage.getItem("user")
        );
        if (!user) {
            console.error("No existe usuario en sesión");
            return;
        }
        const data = await api(
            `/api/reservations/user/${user.id}`
        );

        setReservas(data);
        } catch (error) {
        console.error(
            "Error al cargar reservas:",
            error
        );
        } finally {
        setLoading(false);
        }
    };

    const cancelarReserva = async (id) => {
        const confirmar = window.confirm(
        "¿Desea cancelar esta reserva?"
        );
        if (!confirmar) return;
        try {
        await api(
            `/api/reservations/${id}/cancel`,
            {
            method: "PATCH"
            }
        );
        alert(
            "Reserva cancelada correctamente"
        );
        obtenerReservas();
        } catch(error) {
        console.error(error);
        alert(
            "No se pudo cancelar la reserva"
        );
        }
    };

    return (
        <div className="page-container">
        <h1 className="page-title">
            Mis Reservas
        </h1>
        <div className="page-actions">
            <button
            className="btn btn-danger btn-back"
            onClick={() => navigate(-1)}
            >
            Regresar
            </button>
        </div>
        <hr className="section-divider" />
        {loading ? (
            <p className="loading">
            Cargando reservas...
            </p>
        ) : (
            <div className="table-container">
            <table className="data-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Espacio ID</th>
                    <th>Fecha</th>
                    <th>Hora inicio</th>
                    <th>Estado</th>
                    <th>Observación</th>
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
                        {reserva.espacio_id}
                        </td>
                        <td>
                        {reserva.fecha}
                        </td>
                        <td>
                        {reserva.hora_inicio}
                        </td>
                        <td>
                        {reserva.estado}
                        </td>
                        <td>
                        {reserva.observacion}
                        </td>
                        <td>
                        {(reserva.estado === "pendiente" || reserva.estado === "activa") && (
                            <button
                            className="btn btn-danger"
                            onClick={() =>
                                cancelarReserva(
                                reserva.id
                                )
                            }
                            >
                            Cancelar
                            </button>
                        )}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="8">
                        No tienes reservas registradas.
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

export default MisReservas;