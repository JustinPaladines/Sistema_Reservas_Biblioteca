import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionReservasBibliotecario = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const esBibliotecario = location.pathname.startsWith("/bibliotecario/");

    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buscar, setBuscar] = useState("");
    const [estado, setEstado] = useState("");
    const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
    const [observacion, setObservacion] = useState("");

    useEffect(() => {
        obtenerReservas();
    }, []);

    const obtenerReservas = async (filtros = {}) => {
        try {
            setLoading(true);

            const parametros = new URLSearchParams();
            const textoBuscar = filtros.buscar ?? buscar;
            const estadoSeleccionado = filtros.estado ?? estado;

            if (textoBuscar.trim()) {
                parametros.append("buscar", textoBuscar.trim());
            }

            if (estadoSeleccionado) {
                parametros.append("estado", estadoSeleccionado);
            }

            const query = parametros.toString();
            const data = await api(
                `/api/atencion/reservas${query ? `?${query}` : ""}`
            );

            setReservas(data);
        } catch (error) {
            console.error("Error cargando reservas:", error);
            alert(error.message || "No se pudieron cargar las reservas.");
        } finally {
            setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        setBuscar("");
        setEstado("");
        obtenerReservas({ buscar: "", estado: "" });
    };

    const cancelarReserva = async (id) => {
        if (!window.confirm("¿Cancelar reserva?")) return;

        try {
            await api(`/api/reservations/${id}/cancel`, {
                method: "PATCH"
            });
            await obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const confirmarReserva = async (id) => {
        try {
            await api(`/api/reservations/${id}/check-in`, {
                method: "PATCH"
            });
            await obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const finalizarReserva = async (id) => {
        try {
            await api(`/api/reservations/${id}/finish`, {
                method: "PATCH"
            });
            await obtenerReservas();
        } catch (error) {
            alert(error.message);
        }
    };

    const abrirIncidente = (reserva) => {
        setReservaSeleccionada(reserva);
        setObservacion(reserva.observacion || "");
    };

    const cerrarIncidente = () => {
        setReservaSeleccionada(null);
        setObservacion("");
    };

    const registrarIncidente = async () => {
        if (!observacion.trim()) {
            alert("Debe escribir una observación.");
            return;
        }

        try {
            await api(
                `/api/atencion/reservas/${reservaSeleccionada.id}/incidente`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ observacion })
                }
            );

            alert("Incidente registrado correctamente.");
            cerrarIncidente();
            await obtenerReservas();
        } catch (error) {
            console.error("Error al registrar incidente:", error);
            alert(error.message || "No se pudo registrar el incidente.");
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">{esBibliotecario ? "Gestión de Reservas" : "Historial de Reservas"}</h1>

            <div className="page-actions">
                <button
                    className="btn btn-danger btn-back"
                    onClick={() => navigate(-1)}
                >
                    Regresar
                </button>
            </div>

            <hr className="section-divider" />

            <div className="filtros">
                <input
                    className="form-input"
                    type="text"
                    placeholder="Buscar estudiante, correo o reserva"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") obtenerReservas();
                    }}
                />

                <select
                    className="form-input"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                >
                    <option value="">Todos los estados</option>
                    {esBibliotecario ? (
                        <>
                            <option value="activa">Activa</option>
                            <option value="en progreso">En progreso</option>
                        </>
                    ) : (
                        <>
                            <option value="activa">Activa</option>
                            <option value="en progreso">En progreso</option>
                            <option value="finalizada">Finalizada</option>
                            <option value="caducada">Caducada</option>
                        </>
                    )}
                </select>

                <button
                    className="btn btn-primary"
                    onClick={() => obtenerReservas()}
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
                <p className="loading">Cargando reservas...</p>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Estudiante</th>
                                <th>Correo</th>
                                <th>Espacio</th>
                                <th>Fecha</th>
                                <th>Hora inicio</th>
                                <th>Hora fin</th>
                                <th>Cantidad de estudiantes</th>
                                <th>Estado</th>
                                <th>Observación</th>
                                {esBibliotecario && <th>Acciones</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {reservas.length > 0 ? (
                                reservas.map((reserva) => (
                                    <tr key={reserva.id}>
                                        <td>{reserva.id}</td>
                                        <td>{reserva.usuario?.nombre || reserva.usuario_nombre || "Sin usuario"}</td>
                                        <td>{reserva.usuario?.correo || reserva.usuario_correo || "Sin correo"}</td>
                                        <td>{reserva.espacio?.nombre || reserva.espacio_nombre || reserva.espacio_id}</td>
                                        <td>{reserva.fecha}</td>
                                        <td>{reserva.hora_inicio}</td>
                                        <td>{reserva.hora_fin || "Sin hora"}</td>
                                        <td>{reserva.cantidad_estudiantes ?? "No especificado"}</td>
                                        <td>{reserva.estado}</td>
                                        <td>{reserva.observacion || "Sin observación"}</td>
                                        {esBibliotecario && <td>
                                            <div className="acciones-reserva">
                                                {reserva.estado === "activa" && (
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={() => confirmarReserva(reserva.id)}
                                                    >
                                                        Confirmar Asistencia
                                                    </button>
                                                )}

                                                {reserva.estado === "en progreso" && (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => finalizarReserva(reserva.id)}
                                                    >
                                                        Finalizar
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => abrirIncidente(reserva)}
                                                >
                                                    Registrar incidente
                                                </button>
                                            </div>
                                        </td>}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={esBibliotecario ? 11 : 10}>No se encontraron reservas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {reservaSeleccionada && (
                <div className="form-card formulario-gestion">
                    <h2>Registrar incidente</h2>

                    <p>
                        <strong>Estudiante:</strong>{" "}
                        {reservaSeleccionada.usuario?.nombre ||
                            reservaSeleccionada.usuario_nombre ||
                            "Sin usuario"}
                    </p>

                    <p>
                        <strong>Reserva:</strong> #{reservaSeleccionada.id}
                    </p>

                    <label htmlFor="observacion-incidente">
                        Observación / Incidente:
                    </label>

                    <textarea
                        id="observacion-incidente"
                        className="form-input"
                        rows="5"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Escriba el incidente u observación..."
                    />

                    <button
                        className="btn btn-primary"
                        onClick={registrarIncidente}
                    >
                        Guardar observación
                    </button>

                    <button
                        className="btn btn-danger spacer-xs"
                        onClick={cerrarIncidente}
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

export default GestionReservasBibliotecario;
