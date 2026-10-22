import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionReservas = () => {
    const navigate = useNavigate();
    const [espacios, setEspacios] = useState([]);
    const [bibliotecas, setBibliotecas] = useState([]);
    const [tieneReservaActiva, setTieneReservaActiva] = useState(false);
    const [espacioId, setEspacioId] = useState("");
    const [fecha, setFecha] = useState("");
    const [horaInicio, setHoraInicio] = useState("");

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const [espaciosData, bibliotecasData, reservas] = await Promise.all([
                api("/api/espacios/available"),
                api("/api/libraries"),
                user ? api("/api/reservations/user/" + user.id) : Promise.resolve([])
            ]);
            setEspacios(espaciosData || []);
            setBibliotecas(bibliotecasData || []);
            setTieneReservaActiva((reservas || []).some((r) => ["activa", "en progreso"].includes(r.estado)));
        } catch (error) {
            console.error("Error al cargar datos de reserva:", error);
            alert(error.message || "No se pudieron cargar los espacios disponibles.");
        }
    };

    const validarFormulario = () => {
        if (!espacioId) {
            alert("Seleccione un espacio.");
            return false;
        }
        if (!fecha || !horaInicio) {
            alert("Seleccione fecha y hora de inicio.");
            return false;
        }

        const hoy = new Date().toISOString().slice(0, 10);
        if (fecha < hoy) {
            alert("No puede reservar fechas pasadas.");
            return false;
        }

        const seleccionado = espacios.find((e) => String(e.id) === String(espacioId));
        const biblioteca = bibliotecas.find((b) =>
            String(b.nombre || "").trim().toLowerCase() === String(seleccionado && seleccionado.biblioteca || "").trim().toLowerCase()
        );
        if (biblioteca) {
            const hora = horaInicio.slice(0, 5);
            const apertura = String(biblioteca.horario_apertura || "").slice(0, 5);
            const cierre = String(biblioteca.horario_cierre || "").slice(0, 5);
            if (!apertura || !cierre || hora < apertura || hora >= cierre) {
                alert("La reserva debe iniciar dentro del horario de la biblioteca (" + (apertura || "no definido") + "–" + (cierre || "no definido") + ").");
                return false;
            }
        }

        if (tieneReservaActiva) {
            alert("Ya tienes una reserva activa. Finalízala antes de crear otra.");
            return false;
        }
        return true;
    };

    const crearReserva = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user || !user.id) {
                alert("No se encontró una sesión de usuario válida.");
                return;
            }

            await api("/api/reservations", {
                method: "POST",
                body: JSON.stringify({
                    usuario_id: user.id,
                    espacio_id: Number(espacioId),
                    fecha,
                    hora_inicio: horaInicio
                })
            });

            alert("Reserva creada correctamente.");
            setTieneReservaActiva(true);
            setEspacioId("");
            setFecha("");
            setHoraInicio("");
            await cargarDatos();
        } catch (error) {
            console.error(error);
            alert(error.message || "No se pudo crear la reserva.");
            await cargarDatos();
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
                {tieneReservaActiva && (
                    <p className="aviso-reserva-activa" role="alert">
                        Ya tienes una reserva activa. Debes finalizarla antes de realizar otra.
                    </p>
                )}

                <label htmlFor="espacio-reserva">Espacio:</label>
                <select id="espacio-reserva" className="form-input" value={espacioId}
                    onChange={(e) => setEspacioId(e.target.value)} required>
                    <option value="">Seleccione un espacio disponible</option>
                    {espacios.map((espacio) => (
                        <option key={espacio.id} value={espacio.id}>
                            {espacio.nombre} — {espacio.biblioteca}
                        </option>
                    ))}
                </select>

                {espacios.length === 0 && !tieneReservaActiva && (
                    <p>No hay espacios disponibles para reservar en este momento.</p>
                )}

                <label htmlFor="fecha-reserva">Fecha:</label>
                <input id="fecha-reserva" className="form-input" type="date" min={new Date().toISOString().slice(0, 10)}
                    value={fecha} onChange={(e) => setFecha(e.target.value)} required />

                <label htmlFor="hora-reserva">Hora de inicio:</label>
                <input id="hora-reserva" className="form-input" type="time" value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)} required />

                <button className="btn btn-primary btn-full" type="submit"
                    disabled={tieneReservaActiva || espacios.length === 0}>
                    Reservar
                </button>
            </form>
        </div>
    );
};

export default GestionReservas;
