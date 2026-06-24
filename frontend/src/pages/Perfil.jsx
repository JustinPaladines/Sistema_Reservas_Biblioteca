import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import adminImg from "../assets/administrador.png";
import bibliotecarioImg from "../assets/bibliotecario.png";
import estudianteImg from "../assets/estudiante.png";
import "../styles/perfil.css";


const formatearFecha = (fechaIso) => {
  if (!fechaIso) return "Sin fecha";
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(fechaIso));
};

function obtenerImagenRol(rol) {

  if (rol === "administrador") {
    return adminImg;
  }

  if (rol === "bibliotecario") {
    return bibliotecarioImg;
  }

  return estudianteImg;
};

function Profile() {
    const [perfil, setPerfil] = useState(null);
    const [nombre, setNombre] = useState("");
    const [username, setUsername] = useState("");
    const [editando, setEditando] = useState(false);
    const navigate = useNavigate();

    const regresarAlDashboard = () => {
    if (!perfil || !perfil.rol) {
      console.log("No se pudo obtener el rol del usuario");
      navigate("/"); 
      return;
    }

    switch (perfil.rol) {
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
  };

    async function obtenerUsuario() {

    const { data: authData, error: authError } =
    await supabase.auth.getUser();

    if (authError) {
        console.log(authError);
        return;
    }

    const user = authData.user;

    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

    setPerfil(data);
    setNombre(data.nombre || "");
    setUsername(data.username || "");

    console.log(error);
}
    async function actualizarPerfil() {
        
    if (!nombre.trim()) {
      alert("El nombre no puede estar vacío");
      return;
    }

    if (!username.trim()) {
      alert("El username no puede estar vacío");
      return;
    }

    if (username.length < 4) {
      alert("El username debe tener mínimo 4 caracteres");
      return;
    }

    const { data: usernameExistente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (
      usernameExistente &&
      usernameExistente.id !== perfil.id
    ) {
      alert("Ese username ya está en uso");
      return;
    }

      const { data: authData } =
      await supabase.auth.getUser();

      const user = authData.user;

      const { error } = await supabase
        .from("usuarios")
        .update({
          nombre: nombre,
          username: username
        })
        .eq("id", user.id);

      if (error) {
        console.log(error);
        return;
      }

      alert("Perfil actualizado");

      setPerfil({
        ...perfil,
        nombre: nombre,
        username: username
      });

      setEditando(false);
    }

  useEffect(() => {
    async function cargarPerfil() {
    await obtenerUsuario();
  }
  cargarPerfil();

}, []);

  return (
    <div className="perfil-pagina-container">
    
    <div className="top-bar">
      <button onClick={regresarAlDashboard}>
        Regresar
      </button>
    </div>

    <h1>Mi Perfil</h1>

    {perfil && (
      <div>
        <img src={obtenerImagenRol(perfil.rol)} alt="Perfil" width="150" />
        <p>Nombre: {perfil.nombre}</p>
        <p>Correo: {perfil.correo}</p>
        <p>Rol: {perfil.rol}</p>
        <p>Username: {perfil.username}</p>
        <p>Fecha de creación: {formatearFecha(perfil.created_at)}</p>
        
        <button onClick={() => setEditando(true)}>
          Editar Perfil
        </button>

        {editando && (
          <div>
            <h2>Actualizar Perfil</h2>
            <div>
              <label>Nombre Completo:</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nuevo username"
              />
            </div>

            <button onClick={actualizarPerfil}>
              Guardar Cambios
            </button>
          </div>
        )} 
      </div>
    )}
  </div>
);
}

export default Profile;