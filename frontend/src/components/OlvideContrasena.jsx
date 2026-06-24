// src/components/OlvideContrasena.jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import "../styles/olvideContrasena.css"; 

export default function OlvideContrasena() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  const enviarCorreo = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://roomly-despliegue-svd6.vercel.app/ActualizarContrasena",
    });

    if (error) {
      setMensaje(error.message);
      return;
    }

    setMensaje("Correo enviado correctamente");
  };

  return (
    <div className="olvide-container">
      <form onSubmit={enviarCorreo} className="olvide-form">
        <h2 className="olvide-title">
          Recuperar contraseña
        </h2>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="olvide-input"
        />

        <button type="submit" className="olvide-button">
          Enviar correo
        </button>

        {mensaje && <p className="olvide-mensaje">{mensaje}</p>}
      </form>
    </div>
  );
}