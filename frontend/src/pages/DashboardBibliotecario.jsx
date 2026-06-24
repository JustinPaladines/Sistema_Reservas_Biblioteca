import {useNavigate} from "react-router-dom";
import '../styles/dashboard.css';
import UserMenu from "../components/UserMenu";

const DashboardBibliotecario = () => {
    const navigate = useNavigate();
    const modulos = [
        {titulo: "Gestión de espacios", desc: "Ver espacios disponibles y reportar mantenimientos o daños.", ruta: "/bibliotecario/espacios"},
        {titulo: "Gestión de Reservas", desc: "Ver reservas de la biblioteca y marcar asistencia o no-show.", ruta: "/bibliotecario/reservas"},
        {titulo: "Atención a Estudiantes", desc: "Buscar reservas y registrar incidentes.", ruta: "/bibliotecario/estudiantes"}
    ];

    return(
        <div className="dashboard-container">
        
            <div className="dashboard-header">
                <h2>Panel de Bibliotecario</h2>
                <UserMenu />
            </div>

            <p className="welcome-text">Bienvenido al sistema de gestión de Biblioteca</p>
            <div className="modules-grid">
                {modulos.map((mod, index) =>(
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

export default DashboardBibliotecario;