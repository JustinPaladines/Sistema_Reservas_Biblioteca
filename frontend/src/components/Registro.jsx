// src/components/Registro.jsx
import { useState } from "react"
import { supabase } from "../services/supabase"
import { useNavigate } from "react-router-dom"
import "../styles/registro.css"; 

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
      // 1. Crear usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: password
      })

      if (error) {
        setMensaje(error.message)
        setLoading(false)
        return
      }

      const userId = data?.user?.id

      if (!userId) {
        setMensaje("Revisa tu correo para confirmar el registro")
        setLoading(false)
        return
      }

      // 2. Insertar en tabla usuarios
      const { error: insertError } = await supabase
        .from("usuarios")
        .insert([
          {
            id: userId,
            nombre: nombre,
            correo: correo,
            username: user,
            rol: "estudiante"
          }
        ])

      if (insertError) {
        setMensaje(insertError.message)
        setLoading(false)
        return
      }

      setMensaje("Registro exitoso.")

      // 3. Redirección
      setTimeout(() => {
        navigate("/")
      }, 1500)

    } catch (err) {
      console.log(err)
      setMensaje("Error inesperado en el registro")
    }

    setLoading(false)
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