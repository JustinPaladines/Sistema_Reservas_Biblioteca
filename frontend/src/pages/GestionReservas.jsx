import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const GestionReservas = () => {
    const navigate = useNavigate();

    const [espacios, setEspacios] = useState([]);

    const [espacioId, setEspacioId] = useState("");
    const [fecha, setFecha] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [observacion, setObservacion] = useState("");

    useEffect(() => {
        obtenerEspacios();
    }, []);

    const obtenerEspacios = async () => {
        const { data, error } = await supabase
            .from("espacios")
            .select("*")
            .neq("estado", "mantenimiento")
            .order("id", { ascending: true });

        if (error) {
            console.error(error);
            return;
        }

        setEspacios(data);
    };

    const validarFormulario = () => {
        if (!espacioId) {
            alert("Debe seleccionar un espacio");
            return false;
        }

        if (!fecha) {
            alert("Debe seleccionar una fecha");
            return false;
        }

        if (!horaInicio) {
            alert("Debe seleccionar una hora");
            return false;
        }

        const hoy = new Date().toISOString().split("T")[0];

        if (fecha < hoy) {
            alert("No puede reservar fechas pasadas");
            return false;
        }

        return true;
    };

    const limpiarFormulario = () => {
        setEspacioId("");
        setFecha("");
        setHoraInicio("");
        setObservacion("");
    };

    const crearReserva = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        const {
            data: { user }
        } = await supabase.auth.getUser();

        const { error } = await supabase
            .from("reservas")
            .insert([
                {
                    usuario_id: user.id,
                    espacio_id: Number(espacioId),
                    fecha,
                    hora_inicio: horaInicio,
                    estado: "activa",
                    observacion
                }
            ]);

        if (error) {
            alert(error.message);
            return;
        }

        alert("Reserva creada correctamente");

        limpiarFormulario();
    };

    return (
        <div className="gestion-container">
            {/* Estilos CSS embebidos integrados */}
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
                .formulario-gestion {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    max-width: 450px;
                    margin: 25px auto;
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    text-align: left;
                }
                .grupo-campo {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .grupo-campo label {
                    font-weight: 600;
                    font-size: 14px;
                    color: #444;
                }
                .formulario-gestion input,
                .formulario-gestion select {
                    padding: 12px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                    background-color: #fff;
                    width: 100%;
                    box-sizing: border-box;
                }
                .formulario-gestion input:focus,
                .formulario-gestion select:focus {
                    border-color: #512da8;
                    outline: none;
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
                    display: inline-block;
                }
                .btn:hover {
                    opacity: 0.9;
                }
                .btn-morado { 
                    background-color: #673ab7; 
                    width: 100%;
                    margin: 10px 0 0 0;
                    padding: 12px;
                }
                .btn-rojo { 
                    background-color: #d32f2f; 
                }
                .separador {
                    margin: 35px 0;
                    border: 0;
                    border-top: 1px solid #e0e0e0;
                }
            `}</style>

            <h1 className="titulo-principal">Nueva Reserva</h1>

            <button className="btn btn-rojo" onClick={() => navigate(-1)}>
                Regresar
            </button>

            <hr className="separador" />

            <form className="formulario-gestion" onSubmit={crearReserva}>
                <div className="grupo-campo">
                    <label>Espacio:</label>
                    <select
                        value={espacioId}
                        onChange={(e) => setEspacioId(e.target.value)}
                        required
                    >
                        <option value="">Seleccione un espacio</option>
                        {espacios.map((espacio) => (
                            <option key={espacio.id} value={espacio.id}>
                                {espacio.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grupo-campo">
                    <label>Fecha:</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                    />
                </div>

                <div className="grupo-campo">
                    <label>Hora de inicio:</label>
                    <input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        required
                    />
                </div>

                <div className="grupo-campo">
                    <label>Observación:</label>
                    <input
                        type="text"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Opcional"
                    />
                </div>

                <button type="submit" className="btn btn-morado">
                    Reservar
                </button>
            </form>
        </div>
    );
};

export default GestionReservas;