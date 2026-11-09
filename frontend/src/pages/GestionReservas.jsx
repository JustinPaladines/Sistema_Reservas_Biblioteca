import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const fechaEcuador = () => new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
}).format(new Date());

const consultarEspaciosDisponibles = async (fecha, horaInicio, horaFin, cantidad) => {
    const parametros = new URLSearchParams({
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        cantidad_estudiantes: String(cantidad)
    });
    return api(`/api/espacios/available?${parametros.toString()}`);
};

const GestionReservas = () => {
    const navigate = useNavigate();

    const [espacios, setEspacios] = useState([]);
    const [espacioId, setEspacioId] = useState("");
    const [fecha, setFecha] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFin, setHoraFin] = useState("");
    const [cantidad, setCantidad] = useState("1");
    const [loading, setLoading] = useState(false);
    const [consultado, setConsultado] = useState(false);

    useEffect(() => {
        let vigente = true;

        const obtenerDisponibilidad = async () => {
            const cantidadNumero = Number(cantidad);
            if (!fecha || !horaInicio || !horaFin || !Number.isInteger(cantidadNumero) || cantidadNumero < 1) {
                setEspacios([]);
                setEspacioId("");
                setConsultado(false);
                setLoading(false);
                return;
            }

            if (horaFin <= horaInicio) {
                setEspacios([]);
                setEspacioId("");
                setConsultado(false);
                setLoading(false);
                return;
            }

            setLoading(true);
            setConsultado(true);
            try {
                const data = await consultarEspaciosDisponibles(fecha, horaInicio, horaFin, cantidadNumero);
                if (vigente) {
                    setEspacios(data || []);
                    setEspacioId((actual) =>
                        (data || []).some((espacio) => String(espacio.id) === actual) ? actual : ""
                    );
                }
            } catch (error) {
                if (vigente) {
                    setEspacios([]);
                    setEspacioId("");
                    console.error("Error consultando disponibilidad:", error);
                    alert(error.message);
                }
            } finally {
                if (vigente) setLoading(false);
            }
        };

        obtenerDisponibilidad();
        return () => {
            vigente = false;
        };
    }, [fecha, horaInicio, horaFin, cantidad]);

    const validarFormulario = () => {
        if (!fecha || !horaInicio || !horaFin || !espacioId) {
            alert("Completa la fecha, el horario y selecciona un espacio disponible.");
            return false;
        }

        if (horaFin <= horaInicio) {
            alert("La hora de fin debe ser posterior a la hora de inicio.");
            return false;
        }

        if (fecha < fechaEcuador()) {
            alert("No puedes reservar en una fecha pasada.");
            return false;
        }

        const inicioReserva = new Date(`${fecha}T${horaInicio}:00-05:00`);
        if (Number.isNaN(inicioReserva.getTime()) || inicioReserva <= new Date()) {
            alert("La fecha y hora de la reserva deben ser futuras.");
            return false;
        }

        const cantidadNumero = Number(cantidad);
        if (!Number.isInteger(cantidadNumero) || cantidadNumero < 1) {
            alert("Indica una cantidad válida de estudiantes.");
            return false;
        }

        return true;
    };

    const crearReserva = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        try {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (!user?.id) {
                alert("No se encontró la sesión del usuario. Inicia sesión nuevamente.");
                return;
            }

            await api("/api/reservations", {
                method: "POST",
                body: JSON.stringify({
                    usuario_id: user.id,
                    espacio_id: Number(espacioId),
                    fecha,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    cantidad_estudiantes: Number(cantidad)
                })
            });

            alert("Reserva creada correctamente.");
            setEspacioId("");

            const disponibles = await consultarEspaciosDisponibles(fecha, horaInicio, horaFin, Number(cantidad));
            setEspacios(disponibles || []);
        } catch (error) {
            console.error("Error creando reserva:", error);
            alert(error.message);
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Nueva Reserva</h1>

            <button className="btn btn-danger btn-back" onClick={() => navigate(-1)}>
                Regresar
            </button>

            <hr className="section-divider" />

            <form className="form-card formulario-gestion" onSubmit={crearReserva}>
                <label htmlFor="fecha-reserva">Fecha:</label>
                <input
                    id="fecha-reserva"
                    className="form-input"
                    type="date"
                    min={fechaEcuador()}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                />

                <label htmlFor="hora-inicio-reserva">Hora de inicio:</label>
                <input
                    id="hora-inicio-reserva"
                    className="form-input"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                />

                <label htmlFor="hora-fin-reserva">Hora de fin:</label>
                <input
                    id="hora-fin-reserva"
                    className="form-input"
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    required
                />

                <label htmlFor="cantidad-estudiantes">Cantidad de estudiantes:</label>
                <input
                    id="cantidad-estudiantes"
                    className="form-input"
                    type="number"
                    min="1"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                />

                {horaInicio && horaFin && horaFin <= horaInicio && (
                    <p className="error-message">La hora de fin debe ser posterior a la hora de inicio.</p>
                )}

                <label htmlFor="espacio-reserva">Espacio disponible:</label>
                <select
                    id="espacio-reserva"
                    className="form-input"
                    value={espacioId}
                    onChange={(e) => setEspacioId(e.target.value)}
                    disabled={loading || !consultado || espacios.length === 0}
                    required
                >
                    <option value="">
                        {loading ? "Consultando disponibilidad..." :
                            !consultado ? "Selecciona fecha, horario y cantidad" :
                                espacios.length === 0 ? "No hay espacios con suficientes sillas" :
                                    "Selecciona un espacio"}
                    </option>
                    {espacios.map((espacio) => (
                        <option key={espacio.id} value={espacio.id}>
                            {espacio.nombre} — {espacio.sillas_disponibles} sillas disponibles de {espacio.capacidad}
                        </option>
                    ))}
                </select>

                <button
                    className="btn btn-primary btn-full"
                    type="submit"
                    disabled={loading || !espacioId || espacios.length === 0}
                >
                    Reservar
                </button>
            </form>
        </div>
    );
};

export default GestionReservas;
