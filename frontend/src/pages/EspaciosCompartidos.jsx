import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const fechaEcuador = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const EspaciosCompartidos = () => {
    const navigate = useNavigate();
    const [espacios, setEspacios] = useState([]);
    const [reservasCompartidas, setReservasCompartidas] = useState({});
    const [loading, setLoading] = useState(true);
    const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
    const [responsable, setResponsable] = useState("");
    const [horaFin, setHoraFin] = useState("");

    const obtenerEspacios = async () => {
        try {
            const data = await api("/api/espacios");
            setEspacios(data);
            try {
                const reservas = await api("/api/atencion/reservas");
                const activas = (reservas || []).filter((r) =>
                    String(r.observacion || "").startsWith("Reserva_Compartida") &&
                    r.estado === "en progreso" && r.fecha === fechaEcuador()
                );
                setReservasCompartidas(Object.fromEntries(activas.map((r) => [r.espacio_id, r])));
            } catch {
                setReservasCompartidas({});
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { obtenerEspacios(); }, []);

    const actualizarSillas = async (id, accion, datos = {}) => {
        try {
            await api(`/api/espacios/${id}/sillas-compartidas`, { method: "PATCH", body: JSON.stringify({ accion, ...datos }) });
            setEspacioSeleccionado(null);
            setResponsable("");
            setHoraFin("");
            await obtenerEspacios();
        } catch (error) {
            alert(error.message);
        }
    };

    const ocuparSilla = (espacio) => {
        if (reservasCompartidas[espacio.id]) return actualizarSillas(espacio.id, "ocupar");
        setEspacioSeleccionado(espacio);
    };

    const registrarReserva = (e) => {
        e.preventDefault();
        if (!espacioSeleccionado) return;
        actualizarSillas(espacioSeleccionado.id, "ocupar", { responsable_nombre: responsable, hora_fin: horaFin });
    };

    const totalSillas = espacios.reduce((t, e) => t + Number(e.capacidad || 0), 0);
    const sillasOcupadas = espacios.reduce((t, e) => t + Number(e.sillas_ocupadas_externas || 0), 0);

    return (
        <div className="page-container">
            <button className="btn btn-danger btn-back" onClick={() => navigate(-1)}>Regresar</button>
            <h1 className="page-title">Espacios compartidos</h1>
            <hr className="section-divider" />
            {loading ? <p>Cargando espacios...</p> : <>
                <p>Total de sillas registradas: {totalSillas}</p>
                <p>Sillas ocupadas por personas sin acceso al sistema: {sillasOcupadas}</p>
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr>
                            <th>Espacio</th><th>Total de sillas</th><th>Ocupadas temporalmente</th>
                            <th>Disponibles</th><th>Responsable</th><th>Hora de finalización</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            {espacios.map((espacio) => {
                                const total = Number(espacio.capacidad || 0);
                                const ocupadas = Number(espacio.sillas_ocupadas_externas || 0);
                                const reserva = reservasCompartidas[espacio.id];
                                const nombre = reserva?.observacion?.split("Responsable:")[1]?.trim();
                                return <tr key={espacio.id}>
                                    <td>{espacio.nombre}</td><td>{total}</td><td>{ocupadas}</td>
                                    <td>{Math.max(0, total - ocupadas)}</td><td>{nombre || "—"}</td>
                                    <td>{reserva?.hora_fin || "—"}</td><td>
                                        <button className="btn btn-primary" onClick={() => ocuparSilla(espacio)} disabled={ocupadas >= total}>Ocupar silla</button>{" "}
                                        <button className="btn btn-success" onClick={() => actualizarSillas(espacio.id, "liberar")} disabled={ocupadas <= 0}>Liberar silla</button>
                                    </td>
                                </tr>;
                            })}
                            {!espacios.length && <tr><td colSpan="7">No hay espacios registrados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </>}
            {espacioSeleccionado && <form className="form-card formulario-gestion" onSubmit={registrarReserva}>
                <h2>Registrar espacio compartido</h2>
                <p><strong>Espacio:</strong> {espacioSeleccionado.nombre}</p>
                <label htmlFor="responsable-compartido">Nombre de la persona responsable</label>
                <input id="responsable-compartido" className="form-input" type="text" maxLength="100" value={responsable} onChange={(e) => setResponsable(e.target.value)} required />
                <label htmlFor="hora-fin-compartida">Hora de finalización</label>
                <input id="hora-fin-compartida" className="form-input" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
                <button className="btn btn-primary" type="submit">Registrar primera silla</button>
                <button className="btn btn-danger spacer-xs" type="button" onClick={() => setEspacioSeleccionado(null)}>Cancelar</button>
            </form>}
        </div>
    );
};

export default EspaciosCompartidos;
