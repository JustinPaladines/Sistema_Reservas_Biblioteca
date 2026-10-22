// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Componentes Públicos / Autenticación
import Login from "./components/login";
import Registro from "./components/Registro";
import OlvideContrasena from "./components/OlvideContrasena";
import ActualizarContrasena from "./components/ActualizarContrasena";

// Páginas y Componentes Protegidos
import Profile from "./pages/Perfil";
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardBibliotecario from './pages/DashboardBibliotecario';
import DashboardEstudiante from './pages/DashboardEstudiante';
import ProtectedRoute from './components/ProtectedRoute';

// página temporal
import VistaModulo from "./pages/VistaModulo";

// gestión de espacios
import GestionEspacios from "./pages/GestionEspacios";

// gestión de reservas
import GestionReservas from "./pages/GestionReservas";
import MisReservas from "./pages/MisReservas";
import GestionReservasBibliotecario from "./pages/GestionReservasBibliotecario";
import EspaciosCompartidos from "./pages/EspaciosCompartidos";

// buscar espacios
import BuscarEspacios from "./pages/BuscarEspacios";

// gestionar bibliotecas (solo admin)
import GestionBibliotecas from "./pages/GestionBibliotecas";

// chat IA
import ChatIA from "./pages/ChatIA";

// gestión de usuarios
import GestionUsuarios from "./pages/GestionUsuarios";

export default function App() {
  return (
    <Routes>
      {/* rutas públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
      <Route path="/ActualizarContrasena" element={<ActualizarContrasena />} />

      {/* página para accesos no autorizados */}
      <Route path="/unauthorized" element={
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para ver esta sección.</p>
        </div>
      } />

      {/* administrador */}
      <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/admin/espacios" element={<GestionEspacios />} />
        <Route path="/admin/reservas" element={<GestionReservasBibliotecario />} />
        <Route path="/admin/bibliotecas" element={<GestionBibliotecas />} />
        <Route path="/admin/usuarios" element={<GestionUsuarios />} />
      </Route>

      {/* bibliotecario */}
      <Route element={<ProtectedRoute allowedRoles={['bibliotecario']} />}>
        <Route path="/bibliotecario/dashboard" element={<DashboardBibliotecario />} />
        <Route path="/bibliotecario/espacios-compartidos" element={<EspaciosCompartidos />} />
        <Route path="/bibliotecario/reservas" element={<GestionReservasBibliotecario />} />
      </Route>

      {/* estudiante */}
      <Route element={<ProtectedRoute allowedRoles={['estudiante']} />}>
        <Route path="/estudiante/dashboard" element={<DashboardEstudiante />} />
        <Route path="/estudiante/reservas" element={<GestionReservas />} />
        <Route path="/estudiante/mis-reservas" element={<MisReservas />} />
        <Route path="/estudiante/buscar-espacios" element={<BuscarEspacios />} />
        <Route path="/estudiante/chat" element={<ChatIA />} />
      </Route>

      {/* ruta de perfil por usuarios */}
      <Route element={<ProtectedRoute allowedRoles={['administrador', 'bibliotecario', 'estudiante']} />}>
        <Route path="/perfil" element={<Profile />} />
      </Route>

      {/* redirección por defecto */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
