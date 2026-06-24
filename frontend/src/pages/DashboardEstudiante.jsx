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
    }
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                    <h2>Panel de Estudiante</h2>
                    <UserMenu />
                </div>

            <p className="welcome-text">Hola!, ¿Qué deseas hacer hoy?</p>
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