// src/components/Registro.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom"
import "../styles/registro.css";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Registro() {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState("")
  const [user, setUser] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [loading, setLoading] = useState(false)

  // Validación básica
  const validarCampos = () => {
    if (!nombre || !correo || !password) {
      setMensaje("Todos los campos son obligatorios")
      return false
    }

    if (!correo.includes("@")) {
      setMensaje("Correo inválido")
      return false
    }

    if (password.length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres")
      return false
    }

    return true
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setMensaje("")

    if (!validarCampos()) return

    setLoading(true)

    try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre,
            username: user,
            email: correo,
            password
        })
    });

    const resultado = await response.json();

    if (!response.ok) {
        setMensaje(resultado.error || "Error en el registro.");
        return;
    }

    setMensaje(
        resultado.requiereConfirmacionCorreo
            ? "Registro creado. Revisa tu correo para confirmar la cuenta."
            : "Registro exitoso."
    );

    setTimeout(() => {
        navigate("/");
    }, 1500);

    } catch (error) {
        console.error("Error en registro:", error);
        setMensaje("No se pudo conectar con el servidor.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="registro-container">
      <h2 className="registro-title">Registro</h2>

      <form onSubmit={handleRegistro} className="registro-form">

        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="registro-input"
        />

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="registro-input"
        />

        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="registro-input"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="registro-input"
        />

        <button type="submit" disabled={loading} className="registro-button">
          {loading ? "Creando cuenta..." : "Registrarse"}
        </button>
      </form>

      {mensaje && <p className="registro-mensaje">{mensaje}</p>}
    </div>
  )
}