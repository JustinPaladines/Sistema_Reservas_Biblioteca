// src/components/ActualizarContrasena.jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/actualizarContrasena.css"; //  importamos los estilos

export default function ActualizarContrasena() {
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const actualizarPassword = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMensaje(error.message);
      return;
    }

    setMensaje("Contraseña actualizada correctamente");
  };

  return (
    <div className="actualizar-container">

      <form onSubmit={actualizarPassword} className="actualizar-form">

        <h2 className="actualizar-title">
          Nueva contraseña
        </h2>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="actualizar-input"
        />

        <button type="submit" className="actualizar-button">
          Actualizar contraseña
        </button>

        {mensaje && <p className="actualizar-mensaje">{mensaje}</p>}

      </form>

    </div>
  );
}