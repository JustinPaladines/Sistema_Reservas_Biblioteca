import {useNavigate} from "react-router-dom";
import '../styles/dashboard.css';
import UserMenu from "../components/UserMenu";

const DashboardAdmin = () =>{
    const navigate = useNavigate();
    const modulos = [
        { titulo: "Gestion de Bibliotecas", desc: "Crear, editar y eliminar bibliotecas del sistema.", ruta: "/admin/bibliotecas"},
        { titulo: "Gestión de Espacios", desc: "Definir capacidad, características y asignación de espacios.", ruta: "/admin/espacios"},
        { titulo: "Gestión de Reservas", desc: "Ver, modificar, aprobar, cancelar o establecer bloqueos de horario.", ruta: "/admin/reservas"},
        { titulo: "Gestión de Usuarios", desc: "Administrar cuentas, cambiar roles y ver historiales.", ruta: "/admin/usuarios"}
    ];
    
    return (
    <div className="dashboard-container">

    <div className="dashboard-header">
        <h2>Panel de Administrador</h2>
        <UserMenu />
    </div>

        <p className="welcome-text">Bienvenido, Administrador</p>
        <div className="modules-grid">
            {modulos.map((mod,index) => (
                <div key = {index} className="module-card">
                    <h3>{mod.titulo}</h3>
                    <p>{mod.desc}</p>
                    <button className="module-btn" onClick={() => navigate(mod.ruta)}>Ingresar</button>
                </div>    
            ))}
        </div>
    </div>
    );
};

export default DashboardAdmin; 