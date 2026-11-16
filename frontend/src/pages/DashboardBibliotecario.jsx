import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import '../styles/dashboard.css';
import UserMenu from "../components/UserMenu";

const DashboardBibliotecario = () => {
    const navigate = useNavigate();
    const [biblioteca, setBiblioteca] = useState("");
    const modulos = [
        {titulo: "Espacios compartidos", desc: "Consultar las sillas y actualizar su disponibilidad temporal.", ruta: "/bibliotecario/espacios-compartidos"},
        {titulo: "Gestión de Reservas", desc: "Buscar y filtrar reservas, gestionar su estado y registrar incidentes.", ruta: "/bibliotecario/reservas"},
        {titulo: "Gestión de Parámetros", desc: "Configurar las reglas de reserva de tu biblioteca.", ruta: "/bibliotecario/parametros"}
    ];

    useEffect(() => {
        api("/api/libraries/mi-biblioteca")
            .then((data) => setBiblioteca(data.nombre || "Sin biblioteca asignada"))
            .catch(() => setBiblioteca("No se pudo consultar la biblioteca"));
    }, []);

    return(
        <div className="dashboard-container">
        
            <div className="dashboard-header">
                        <div>
                            <h1 className="dashboard-title">
                                Panel de Bibliotecario
                            </h1>
            
                            <p className="welcome-text">
                                Hola, ¿qué deseas hacer hoy?
                            </p>
                        </div>
                    <UserMenu />
            </div>

            <p className="welcome-text">Bienvenido al sistema de gestión de Biblioteca</p>
            <p className="welcome-text"><strong>Biblioteca asignada:</strong> {biblioteca || "Cargando..."}</p>
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
