import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../services/supabase";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  // VALIDACIÓN
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
    }
  };

  // REGISTRO
  const handleRegister = async () => {
    setMensaje("");

    if (!validarCampos()) return;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:5173",
      },
    });

    if (error) {
      setMensaje(error.message);
      setTipoMensaje("error");
    } else {
      setMensaje("Revisa tu correo para verificar tu cuenta");
      setTipoMensaje("success");
    }
  };

  return (
    <div
      className="
        w-full max-w-[540px]
        h-[580px]
        bg-white
        rounded-[20px]
        shadow-[0_20px_50px_rgba(0,0,0,0.08)]
        flex items-center justify-center
        ml-16
      "
    >
      <div className="w-full max-w-[380px] flex flex-col justify-center">

        {/* TITULO */}
        <div className="mb-8">
          <h1 className="text-[30px] font-bold text-[#6D28D9]">
            ¡Bienvenido!
          </h1>

          <p className="text-[#6B7280] mt-2">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* MENSAJE */}
        {mensaje && (
          <div
            className={`
              mb-6 text-sm px-4 py-3 rounded-lg
              ${tipoMensaje === "error" ? "bg-red-100 text-red-600" : ""}
              ${tipoMensaje === "success" ? "bg-green-100 text-green-600" : ""}
            `}
          >
            {mensaje}
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* EMAIL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#374151]">
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                bg-white
                border border-[#E5E7EB]
                rounded-[10px]
                px-4 py-3
                text-sm
                outline-none
                focus:ring-2 focus:ring-[#6D28D9]/10
              "
            />
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#374151]">
              Contraseña
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full
                  bg-white
                  border border-[#E5E7EB]
                  rounded-[10px]
                  px-4 py-3
                  text-sm
                  outline-none
                  focus:ring-2 focus:ring-[#6D28D9]/10
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-gray-400
                "
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {/* OPCIONES */}
          <div className="flex justify-between items-center text-sm pt-2">
            <label className="flex items-center gap-2 text-[#6B7280]">
              <input type="checkbox" />
              Recordarme
            </label>

            <button className="text-[#6D28D9] font-medium">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col items-center gap-3 pt-2">

            <button
              onClick={handleLogin}
              className="
                w-[75%]
                py-3
                rounded-[8px]
                text-white font-semibold
                bg-[#22C55E]
                hover:bg-[#16A34A]
                transition
              "
            >
              Iniciar sesión
            </button>

            <button
              onClick={handleRegister}
              className="
                w-[75%]
                py-2.5
                rounded-[8px]
                text-[#6D28D9]
                border border-[#6D28D9]
                font-medium
                hover:bg-[#6D28D9] hover:text-white
                transition
              "
            >
              Registrarse
            </button>

          </div>

          {/* DIVIDER */}
          <p className="text-center text-[#6B7280] text-sm pt-2">
            o continúa con
          </p>

          {/* SOCIAL */}
          <div className="flex gap-3 pt-1">
            <button className="
              flex-1 py-2.5
              border border-[#E5E7EB]
              rounded-[10px]
              bg-white
              text-sm
            ">
              G
            </button>

            <button className="
              flex-1 py-2.5
              border border-[#E5E7EB]
              rounded-[10px]
              bg-white
              text-sm
            ">
              ☐
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}