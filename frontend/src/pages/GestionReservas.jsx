import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionReservas = () => {
    const navigate = useNavigate();

    const [espacios, setEspacios] = useState([]);

    const [espacioId, setEspacioId] = useState("");
    const [fecha, setFecha] = useState("");
    const [horaInicio, setHoraInicio] = useState("");

    useEffect(() => {
        obtenerEspacios();
    }, []);

    const obtenerEspacios = async () => {
        try {
        const data = await api(
            "/api/espacios"
        );

        const disponibles = data.filter(
            espacio => espacio.estado === "disponible"
        );

        setEspacios(disponibles);
        } catch(error) {
        console.error(
            "Error cargando espacios:",
            error
        );
        }
    };

    const validarFormulario = () => {
        if (!espacioId) {
        alert("Seleccione un espacio");
        return false;
        }

        if (!fecha) {
        alert("Seleccione una fecha");
        return false;
        }

        if (!horaInicio) {
        alert("Ingrese horario completo");
        return false;
        }

        const hoy = new Date()
        .toISOString()
        .split("T")[0];

        if(fecha < hoy){
        alert(
            "No puede reservar fechas pasadas"
        );
        return false;
        }

        return true;
    };

    const crearReserva = async(e)=>{
        e.preventDefault();

        if(!validarFormulario())
        return;

        try {
        const user = JSON.parse(
            localStorage.getItem("user")
        );

        await api(
            "/api/reservations",
            {
            method:"POST",
            body:JSON.stringify({
                usuario_id:user.id,
                espacio_id:Number(espacioId),
                fecha,
                hora_inicio:horaInicio
            })
            }
        );

        alert(
            "Reserva creada correctamente"
        );

        setEspacioId("");
        setFecha("");
        setHoraInicio("");
        }catch(error){
        console.error(error);
        alert(
            error.message
        );
        }
    };

    return (
        <div className="page-container">
        <h1 className="page-title">
            Nueva Reserva
        </h1>

        <button
            className="btn btn-danger btn-back"
            onClick={()=>navigate(-1)}
        >
            Regresar
        </button>

        <hr className="section-divider"/>

        <form
            className="form-card formulario-gestion"
            onSubmit={crearReserva}
        >
            <label>
            Espacio:
            </label>

            <select
            className="form-input"
            value={espacioId}
            onChange={
                e=>setEspacioId(e.target.value)
            }
            >
            <option value="">
                Seleccione espacio
            </option>

            {espacios.map(espacio=>(
                <option
                key={espacio.id}
                value={espacio.id}
                >
                {espacio.nombre}
                </option>
            ))}
            </select>

            <label>
            Fecha:
            </label>

            <input
            className="form-input"
            type="date"
            value={fecha}
            onChange={
                e=>setFecha(e.target.value)
            }
            />

            <label>
            Hora inicio:
            </label>

            <input
            className="form-input"
            type="time"
            value={horaInicio}
            onChange={
                e=>setHoraInicio(e.target.value)
            }
            />

            <button
            className="btn btn-primary btn-full"
            type="submit"
            >
            Reservar
            </button>
        </form>
        </div>
    );
};

export default GestionReservas;