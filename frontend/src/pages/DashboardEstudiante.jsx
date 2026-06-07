import {useNavigate} from "react-router-dom";
import "../styles/dashboard.css";

const DashboardEstudiante = () =>{
    const navigate = useNavigate();
    const modulos = [
        { titulo: "Buscar Espacios", desc: "Consulta disponibilidad por biblioteca, fecha y hora." },
        { titulo: "Mis Reservas", desc: "Visualiza tus reservas activas, historial y cancelaciones." },
        { titulo: "Nueva Reserva", desc: "Selecciona un cubículo o sala de estudio disponible." }
    ];

    return (
        <div className="dashboard-container">
            <h2>Panel del Estudiante</h2>
            <p className="welcome-text">Hola!, ¿Qué deseas hacer hoy?</p>
            <div className="modules-grid">
                {modulos.map((mod, index)=> (
                    <div key={index} className="module-card">
                        <h3>{mod.titulo}</h3>
                        <p>{mod.desc}</p>
                        <button className="module-btn" onClick={() => navigate ("/modulo/${mod.titulo}")}>Ingresar</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardEstudiante;