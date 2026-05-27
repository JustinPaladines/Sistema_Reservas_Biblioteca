// src/App.jsx
import { Routes, Route } from "react-router-dom";

// 1. Importamos tu componente contenedor Login
import Login from "./components/Login"; 


import OlvideContrasena from "./components/OlvideContrasena";
import ActualizarContrasena from "./components/ActualizarContrasena";
import Registro from "./components/Registro";

import Profile from "./pages/Perfil";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/olvide-contrasena"
        element={<OlvideContrasena />}
      />

      <Route
        path="/ActualizarContrasena"
        element={<ActualizarContrasena />}
      />

      <Route path="/registro" element={<Registro />} />
      
      <Route path="/perfil" element={<Profile />} />

    </Routes>
  );
}