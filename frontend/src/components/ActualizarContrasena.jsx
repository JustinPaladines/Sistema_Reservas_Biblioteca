import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../services/supabase";
import "../styles/actualizarContrasena.css";

export default function ActualizarContrasena() {
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

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
        <h2 className="actualizar-title">Nueva contraseña</h2>

        <div className="actualizar-input-wrapper">
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="actualizar-input"
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            className="actualizar-toggle"
            onClick={() => setMostrarPassword((visible) => !visible)}
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarPassword}
            title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button type="submit" className="actualizar-button">
          Actualizar contraseña
        </button>

        {mensaje && <p className="actualizar-mensaje">{mensaje}</p>}
      </form>
    </div>
  );
}
