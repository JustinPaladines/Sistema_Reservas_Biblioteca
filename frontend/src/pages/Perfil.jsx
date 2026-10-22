import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import adminImg from "../assets/administrador.png";
import bibliotecarioImg from "../assets/bibliotecario.png";
import estudianteImg from "../assets/estudiante.png";
import "../styles/perfil.css";

const formatearFecha = (fechaIso) => {
    if (!fechaIso) return "Sin fecha";

    return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(fechaIso));
};

const obtenerImagenRol = (rol) => {
    if (rol === "administrador") return adminImg;
    if (rol === "bibliotecario") return bibliotecarioImg;
    return estudianteImg;
};

const Profile = () => {
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState(null);
    const [nombre, setNombre] = useState("");
    const [username, setUsername] = useState("");
    const [editando, setEditando] = useState(false);
    const [loading, setLoading] = useState(true);

    const regresarAlDashboard = () => {
        if (!perfil || !perfil.rol) {
            navigate("/login");
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

    const obtenerUsuario = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));

            if (!user || !user.id) {
                console.error("No existe usuario en sesión");
                navigate("/login");
                return;
            }

            const data = await api(`/api/perfil/${user.id}`);

            setPerfil(data);
            setNombre(data.nombre || "");
            setUsername(data.username || "");

        } catch (error) {
            console.error("Error al cargar perfil:", error);
            alert("No se pudo cargar el perfil");
        } finally {
            setLoading(false);
        }
    };

    const actualizarPerfil = async () => {
        if (!nombre.trim()) {
            alert("El nombre no puede estar vacío");
            return;
        }

        if (!username.trim()) {
            alert("El username no puede estar vacío");
            return;
        }

        if (username.trim().length < 4) {
            alert("El username debe tener mínimo 4 caracteres");
            return;
        }

        try {
            const data = await api(`/api/perfil/${perfil.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    username: username.trim()
                })
            });

            alert("Perfil actualizado correctamente");

            setPerfil(data.usuario);
            setNombre(data.usuario.nombre);
            setUsername(data.usuario.username);
            setEditando(false);

            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...JSON.parse(localStorage.getItem("user")),
                    nombre: data.usuario.nombre,
                    username: data.usuario.username
                })
            );

        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert(error.message || "No se pudo actualizar el perfil");
        }
    };

    useEffect(() => {
        obtenerUsuario();
    }, []);

    if (loading) {
        return (
            <div className="perfil-pagina-container">
                <p>Cargando perfil...</p>
            </div>
        );
    }

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
                    <img
                        src={obtenerImagenRol(perfil.rol)}
                        alt="Perfil"
                        width="150"
                    />

                    <p>
                        <strong>Nombre:</strong> {perfil.nombre}
                    </p>

                    <p>
                        <strong>Correo:</strong> {perfil.correo}
                    </p>

                    <p>
                        <strong>Rol:</strong> {perfil.rol}
                    </p>

                    <p>
                        <strong>Username:</strong> {perfil.username}
                    </p>

                    <p>
                        <strong>Estado:</strong> {perfil.estado}
                    </p>

                    <p>
                        <strong>Fecha de creación:</strong>{" "}
                        {formatearFecha(perfil.created_at)}
                    </p>

                    {!editando && (
                        <button onClick={() => setEditando(true)}>
                            Editar Perfil
                        </button>
                    )}

                    {editando && (
                        <div>
                            <h2>Actualizar Perfil</h2>

                            <div>
                                <label>Nombre Completo:</label>

                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) =>
                                        setNombre(e.target.value)
                                    }
                                    placeholder="Nombre completo"
                                />
                            </div>

                            <div>
                                <label>Username:</label>

                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    placeholder="Nuevo username"
                                />
                            </div>

                            <button onClick={actualizarPerfil}>
                                Guardar Cambios
                            </button>

                            <button
                                onClick={() => {
                                    setEditando(false);
                                    setNombre(perfil.nombre || "");
                                    setUsername(perfil.username || "");
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;