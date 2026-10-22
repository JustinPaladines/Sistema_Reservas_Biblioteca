// src/components/LoginCard.jsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/loginCard.css";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const validarCampos = () => {
    if (!email || !password) {
      setMensaje("Todos los campos son obligatorios");
      setTipoMensaje("error");
      return false;
    }
    if (!email.includes("@")) {
      setMensaje("Correo electrónico inválido");
      setTipoMensaje("error");
      return false;
    }
    if (password.length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres");
      setTipoMensaje("error");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setMensaje("");
    setCargando(true);

    if (!validarCampos()) {
      setCargando(false);
      return;
    }

    try {
      // enviar credenciales al Backend (no a Supabase directamente)
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // El backend ya validó el estado, intentos y bloqueos
        setMensaje(data.error || "Error al iniciar sesión");
        setTipoMensaje("error");
        return;
      }

      // login exitoso, backend reinicia los intentos y verifica el estado
      setMensaje("Inicio de sesión exitoso");
      setTipoMensaje("success");

      // Guardar datos en localStorage (o Context)
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // redirigir según el rol que devuelve el backend
      switch (data.user.rol) {
      case "administrador":
        navigate("/admin/dashboard");
        break;

      case "bibliotecario":
        navigate("/bibliotecario/dashboard");
        break;

      case "estudiante":
        navigate("/estudiante/dashboard");
        break;

      default:
        navigate("/unauthorized");
}

    } catch (err) {
      console.error("Error de conexión:", err);
      setMensaje("No se pudo conectar con el servidor. Intenta más tarde.");
      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  };

  const handleRegister = () => {
    navigate("/Registro");
  };

  return (
    <div className="card-wrapper">
      <div className="card-inner">
        <div className="card-header">
          <h1 className="card-title">¡Bienvenido!</h1>
          <p className="card-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        {mensaje && (
          <div className={`message-box ${tipoMensaje === "error" ? "message-error" : "message-success"}`}>
            {mensaje}
          </div>
        )}

        <div className="form-group-container">
          <div className="input-group">
            <label className="input-label">Correo electrónico</label>
            <input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              disabled={cargando}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className="input-field-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                disabled={cargando}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
                disabled={cargando}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="options-container">
            <a href="/olvide-contrasena" className="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="action-buttons-container">
            <button onClick={handleLogin} className="primary-btn" disabled={cargando}>
              {cargando ? "Procesando..." : "Iniciar sesión"}
            </button>

            <button onClick={handleRegister} className="secondary-btn" disabled={cargando}>
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}