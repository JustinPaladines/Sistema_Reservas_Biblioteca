import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const MisReservas = () => {
    const navigate = useNavigate();

    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        obtenerReservas();
    }, []);

    const obtenerReservas = async () => {
        const {
            data: { user }
        } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from("reservas")
            .select("*")
            .eq("usuario_id", user.id)
            .order("id", { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        setReservas(data);
        setLoading(false);
    };

    const cancelarReserva = async (id) => {
        const confirmar = window.confirm(
            "¿Desea cancelar esta reserva?"
        );

        if (!confirmar) return;

        const { error } = await supabase
            .from("reservas")
            .update({
                estado: "cancelada",
                finalizada_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) {
            alert(error.message);
            return;
        }

        obtenerReservas();
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
                .btn-rojo { 
                    background-color: #d32f2f; 
                }
                .separador {
                    margin: 35px 0;
                    border: 0;
                    border-top: 1px solid #e0e0e0;
                }
                .contenedor-tabla {
                    overflow-x: auto;
                    margin-top: 20px;
                }
                .tabla-espacios {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #ffffff;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .tabla-espacios th {
                    background-color: #673ab7;
                    color: white;
                    padding: 14px;
                    font-weight: 600;
                    text-align: center;
                }
                .tabla-espacios td {
                    padding: 14px;
                    border-bottom: 1px solid #eeeeee;
                    text-align: center;
                    font-size: 14px;
                }
                .tabla-espacios tbody tr:nth-child(even) {
                    background-color: #fcfaff;
                }
                .tabla-espacios tbody tr:hover {
                    background-color: #f1f8e9;
                }
                .cargando {
                    font-size: 16px;
                    color: #666;
                    font-style: italic;
                }
            `}</style>

            <h1 className="titulo-principal">Mis Reservas</h1>

            <button className="btn btn-rojo" onClick={() => navigate(-1)}>
                Regresar
            </button>

            <hr className="separador" />

            {loading ? (
                <p className="cargando">Cargando reservas...</p>
            ) : (
                <div className="contenedor-tabla">
                    <table className="tabla-espacios">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Espacio ID</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Estado</th>
                                <th>Observación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {reservas.map((reserva) => (
                                <tr key={reserva.id}>
                                    <td>{reserva.id}</td>
                                    <td>{reserva.espacio_id}</td>
                                    <td>{reserva.fecha}</td>
                                    <td>{reserva.hora_inicio}</td>
                                    <td>{reserva.estado}</td>
                                    <td>{reserva.observacion}</td>

                                    <td>
                                        {reserva.estado === "activa" && (
                                            <button
                                                className="btn btn-rojo"
                                                onClick={() =>
                                                    cancelarReserva(reserva.id)
                                                }
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MisReservas;