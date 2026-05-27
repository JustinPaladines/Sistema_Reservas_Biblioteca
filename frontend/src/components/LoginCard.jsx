// src/components/LoginCard.jsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../services/supabase";
import { Link, useNavigate } from "react-router-dom";
import "../styles/loginCard.css"; 

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const navigate = useNavigate();

  // VALIDACIÓN CAMPOS
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

  // LOGIN
  const handleLogin = async () => {
    setMensaje("");

    if (!validarCampos()) return;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje(error.message);
      setTipoMensaje("error");
    } else {
      setMensaje("Inicio de sesión exitoso");
      setTipoMensaje("success");

      navigate("/perfil");
    }
  };

  // REGISTRO
  const handleRegister = () => {
    navigate("/Registro");
  };

  return (
    <div className="card-wrapper">
      <div className="card-inner">

        {/* TITULO */}
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

          {/* EMAIL */}
          <div className="input-group">
            <label className="input-label">Correo electrónico</label>
            <input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className="input-field-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {/* OPCIONES */}
          <div className="options-container">
            <Link to="/olvide-contrasena" className="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* BOTONES */}
          <div className="action-buttons-container">
            <button onClick={handleLogin} className="primary-btn">
              Iniciar sesión
            </button>

            <button onClick={handleRegister} className="secondary-btn">
              Registrarse
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}