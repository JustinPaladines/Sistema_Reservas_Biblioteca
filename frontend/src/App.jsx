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
//pagina temporal
import VistaModulo from "./pages/VistaModulo";

//gestión espacios
import GestionEspacios from "./pages/GestionEspacios";

//gestión reservas
import GestionReservas from "./pages/GestionReservas";

import MisReservas from "./pages/MisReservas";

import GestionReservasBibliotecario from "./pages/GestionReservasBibliotecario";

// buscar espacios
import BuscarEspacios from "./pages/BuscarEspacios";

// gestionar bibliotecas (solo admin)
import GestionBibliotecas from "./pages/GestionBibliotecas";


export default function App() {
  return (
    <Routes>
      {/* "/" y "/login" llevarán a la pantalla de inicio de sesión */}
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

      {/* páginas de rutas protegidas, para los usuarios */}
      
      {/* administrador */}
      <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/admin/espacios" element={<GestionEspacios />} />
        <Route path="/admin/reservas" element={<GestionReservasBibliotecario/>} />
        <Route path="/admin/bibliotecas" element={<GestionBibliotecas />} />
      </Route>

      {/* bibliotecario */}
      <Route element={<ProtectedRoute allowedRoles={['bibliotecario']} />}>
        <Route path="/bibliotecario/dashboard" element={<DashboardBibliotecario />} />
        <Route path="/bibliotecario/espacios" element={<GestionEspacios />} />
        <Route path="/bibliotecario/reservas" element={<GestionReservasBibliotecario/>} />
      </Route>

      {/* estudiante */}
      <Route element={<ProtectedRoute allowedRoles={['estudiante']} />}>
        <Route path="/estudiante/dashboard" element={<DashboardEstudiante />} />
        <Route path="/estudiante/reservas" element={<GestionReservas />} />
        <Route path="/estudiante/mis-reservas" element={<MisReservas />} />
        <Route path="/estudiante/buscar-espacios" element={<BuscarEspacios />} />
      </Route>

      {/* ruta de perfil por usuarios */}
      <Route element={<ProtectedRoute allowedRoles={['administrador', 'bibliotecario', 'estudiante']} />}>
        <Route path="/perfil" element={<Profile />} />
      </Route>

      {/* redirección por defecto si la ruta ingresada no existe */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    

    </Routes>
  );
}