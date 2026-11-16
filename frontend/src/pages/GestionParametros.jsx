import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionParametros = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const esBibliotecario = location.pathname.startsWith("/bibliotecario/");
    const [bibliotecas, setBibliotecas] = useState([]);
    const [bibliotecaId, setBibliotecaId] = useState("");
    const [bibliotecaNombre, setBibliotecaNombre] = useState("");
    const [minutos, setMinutos] = useState(15);
    const [maxPersonas, setMaxPersonas] = useState(4);
    const [maxModificaciones, setMaxModificaciones] = useState(2);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => { cargarBibliotecas(); }, []);

    const cargarParametros = async (id) => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await api(`/api/libraries/${id}/parametros`);
            setMinutos(data.minutos_caducidad_reserva ?? 15);
            setMaxPersonas(data.max_personas_reserva ?? 4);
            setMaxModificaciones(data.max_modificaciones_reserva ?? 2);
        } catch (error) {
            alert(error.message || "No se pudieron cargar los parámetros.");
        } finally { setLoading(false); }
    };

    const cargarBibliotecas = async () => {
        try {
            if (esBibliotecario) {
                const data = await api("/api/libraries/mi-biblioteca");
                setBibliotecaId(String(data.biblioteca_id));
                setBibliotecaNombre(data.nombre);
                await cargarParametros(data.biblioteca_id);
            } else {
                const data = await api("/api/libraries");
                setBibliotecas(data);
                if (data.length) {
                    setBibliotecaId(String(data[0].id));
                    setBibliotecaNombre(data[0].nombre);
                    await cargarParametros(data[0].id);
                } else setLoading(false);
            }
        } catch (error) {
            alert(error.message || "No se pudo cargar la biblioteca.");
            setLoading(false);
        }
    };

    const seleccionarBiblioteca = async (id) => {
        setBibliotecaId(id);
        const seleccionada = bibliotecas.find((b) => String(b.id) === String(id));
        setBibliotecaNombre(seleccionada?.nombre || "");
        await cargarParametros(id);
    };

    const guardarParametros = async (e) => {
        e.preventDefault();
        if (!bibliotecaId) return;
        try {
            setGuardando(true);
            await api(`/api/libraries/${bibliotecaId}/parametros`, {
                method: "PUT",
                body: JSON.stringify({
                    minutos_caducidad_reserva: Number(minutos),
                    max_personas_reserva: Number(maxPersonas),
                    max_modificaciones_reserva: Number(maxModificaciones)
                })
            });
            alert("Parámetros actualizados correctamente.");
        } catch (error) {
            alert(error.message || "No se pudieron guardar los parámetros.");
        } finally { setGuardando(false); }
    };

    return (
        <div className="page-container">
            <button className="btn btn-danger btn-back" onClick={() => navigate(-1)}>Regresar</button>
            <h1 className="page-title">Gestión de Parámetros</h1>
            {!esBibliotecario && <>
                <label htmlFor="biblioteca-parametros">Biblioteca</label>
                <select id="biblioteca-parametros" className="form-input" value={bibliotecaId} onChange={(e) => seleccionarBiblioteca(e.target.value)}>
                    {bibliotecas.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
            </>}
            {esBibliotecario && <p><strong>Biblioteca:</strong> {bibliotecaNombre || "Cargando..."}</p>}
            {loading ? <p className="loading">Cargando parámetros...</p> : (
                <form className="form-card formulario-gestion" onSubmit={guardarParametros}>
                    <label htmlFor="minutos-caducidad">Minutos de tolerancia antes de caducar</label>
                    <input id="minutos-caducidad" className="form-input" type="number" min="1" value={minutos} onChange={(e) => setMinutos(e.target.value)} required />
                    <label htmlFor="max-personas">Máximo de personas por reserva</label>
                    <input id="max-personas" className="form-input" type="number" min="1" value={maxPersonas} onChange={(e) => setMaxPersonas(e.target.value)} required />
                    <label htmlFor="max-modificaciones">Máximo de modificaciones por reserva</label>
                    <input id="max-modificaciones" className="form-input" type="number" min="0" value={maxModificaciones} onChange={(e) => setMaxModificaciones(e.target.value)} required />
                    <button className="btn btn-primary" type="submit" disabled={guardando || !bibliotecaId}>{guardando ? "Guardando..." : "Guardar parámetros"}</button>
                </form>
            )}
        </div>
    );
};

export default GestionParametros;
