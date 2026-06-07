import {useNavigate} from "react-router-dom";
import '../styles/dashboard.css';

const DashboardBibliotecario = () => {
    const navigate = useNavigate();
    const modulos = [
        {titulo: "Gestión de espacios", desc: "Ver espacios disponibles y reportar mantenimientos o daños."},
        {titulo: "Gestión de Reservas", desc: "Ver reservas de la biblioetca y marcar asistencia o no-show."},
        {titulo: "Atención a Estudiantes", desc: "Buscar reservas y registrar incidentes."}
    ];

    return(
        <div className="dashboard-container">
            <h2> Panel de Bibliotecario</h2>
            <p className="welcome-text">Bienvenido al sistema de gestión de Biblioteca</p>
            <div className="modules-grid">
                {modulos.map((mod, index) =>(
                    <div key={index} className="module-card">
                        <h3>{mod.titulo}</h3>
                        <p>{mod.desc}</p>
                        <button className="module-btn" onClick={() => navigate(`/modulo/${mod.titulo}`)}> Ingresar </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardBibliotecario;