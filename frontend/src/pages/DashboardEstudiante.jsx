import {useNavigate} from "react-router-dom";
import "../styles/dashboard.css";
import UserMenu from "../components/UserMenu";

const DashboardEstudiante = () =>{
    const navigate = useNavigate();
    const modulos = [
        {
        titulo: "Buscar Espacios",
        desc: "Consulta disponibilidad por biblioteca, fecha y hora.",
        ruta: "/estudiante/buscar-espacios"
    },
    {
        titulo: "Mis Reservas",
        desc: "Visualiza tus reservas activas, historial y cancelaciones.",
        ruta: "/estudiante/mis-reservas"
    },
    {
        titulo: "Nueva Reserva",
        desc: "Selecciona un cubículo o sala de estudio disponible.",
        ruta: "/estudiante/reservas"
    },
    {
        titulo: "Asistente IA",
        desc: "Consulta dudas sobre biblioteca, libros y el sistema de reservas.",
        ruta: "/estudiante/chat"
    }
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
            <div>
                <h1 className="dashboard-title">
                    Panel de Estudiante
                </h1>

                <p className="welcome-text">
                    Hola, ¿qué deseas hacer hoy?
                </p>
            </div>
            <UserMenu />
        </div>

            <div className="modules-grid">
                {modulos.map((mod, index)=> (
                    <div key={index} className="module-card">
                        <h3>{mod.titulo}</h3>
                        <p>{mod.desc}</p>
                        <button className="module-btn" onClick={() => navigate(mod.ruta)}> Ingresar </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardEstudiante;