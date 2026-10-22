import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionUsuarios = () => {
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    const [buscar, setBuscar] = useState("");
    const [rol, setRol] = useState("");
    const [estado, setEstado] = useState("");

    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [rolEditar, setRolEditar] = useState("");
    const [estadoEditar, setEstadoEditar] = useState("");

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    const obtenerUsuarios = async () => {
        try {
            setLoading(true);

            const parametros = new URLSearchParams();

            if (buscar.trim()) {
                parametros.append("buscar", buscar.trim());
            }

            if (rol) {
                parametros.append("rol", rol);
            }

            if (estado) {
                parametros.append("estado", estado);
            }

            const query = parametros.toString();

            const data = await api(
                `/api/usuarios${query ? `?${query}` : ""}`
            );

            setUsuarios(data);

        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            alert("No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        setBuscar("");
        setRol("");
        setEstado("");
        obtenerUsuarios();
    };

    const editarUsuario = (usuario) => {
        setUsuarioEditando(usuario);
        setRolEditar(usuario.rol);
        setEstadoEditar(usuario.estado);
    };

    const cancelarEdicion = () => {
        setUsuarioEditando(null);
        setRolEditar("");
        setEstadoEditar("");
    };

    const actualizarUsuario = async () => {
        if (!usuarioEditando) return;

        try {
            await api(`/api/usuarios/${usuarioEditando.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    rol: rolEditar,
                    estado: estadoEditar
                })
            });

            alert("Usuario actualizado correctamente");

            cancelarEdicion();
            obtenerUsuarios();

        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            alert(error.message || "No se pudo actualizar el usuario");
        }
    };

    const desactivarUsuario = async (id) => {
        const confirmar = window.confirm(
            "¿Desea desactivar este usuario?"
        );

        if (!confirmar) return;

        try {
            await api(`/api/usuarios/${id}`, {
                method: "DELETE"
            });

            alert("Usuario desactivado correctamente");

            obtenerUsuarios();

        } catch (error) {
            console.error("Error al desactivar usuario:", error);
            alert(error.message || "No se pudo desactivar el usuario");
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">
                Gestión de Usuarios
            </h1>

            <div className="page-actions">
                <button
                    className="btn btn-danger btn-back"
                    onClick={() => navigate(-1)}
                >
                    Regresar
                </button>
            </div>

            <hr className="section-divider" />

            <div className="filtros">
                <input
                    className="form-input"
                    type="text"
                    placeholder="Buscar por nombre, correo o rol"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />

                <select
                    className="form-input"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                >
                    <option value="">
                        Todos los roles
                    </option>

                    <option value="administrador">
                        Administrador
                    </option>

                    <option value="bibliotecario">
                        Bibliotecario
                    </option>

                    <option value="estudiante">
                        Estudiante
                    </option>
                </select>

                <select
                    className="form-input"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                >
                    <option value="">
                        Todos los estados
                    </option>

                    <option value="activo">
                        Activo
                    </option>

                    <option value="suspendido">
                        Suspendido
                    </option>

                    <option value="bloqueado">
                        Bloqueado
                    </option>

                    <option value="inactivo">
                        Inactivo
                    </option>
                </select>

                <button
                    className="btn btn-primary"
                    onClick={obtenerUsuarios}
                >
                    Buscar
                </button>

                <button
                    className="btn btn-success"
                    onClick={limpiarFiltros}
                >
                    Limpiar
                </button>
            </div>

            {loading ? (
                <p className="loading">
                    Cargando usuarios...
                </p>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Intentos fallidos</th>
                                <th>Fecha de creación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {usuarios.length > 0 ? (
                                usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td>
                                            {usuario.nombre}
                                        </td>

                                        <td>
                                            {usuario.correo}
                                        </td>

                                        <td>
                                            {usuario.rol}
                                        </td>

                                        <td>
                                            {usuario.estado}
                                        </td>

                                        <td>
                                            {usuario.intentos_fallidos}
                                        </td>

                                        <td>
                                            {usuario.created_at
                                                ? new Date(
                                                    usuario.created_at
                                                ).toLocaleDateString(
                                                    "es-ES"
                                                )
                                                : "Sin fecha"}
                                        </td>

                                        {/* Separación aplicada mediante flex y gap */}
                                        <td style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className="btn btn-success"
                                                onClick={() =>
                                                    editarUsuario(
                                                        usuario
                                                    )
                                                }
                                            >
                                                Editar
                                            </button>

                                            {usuario.estado !== "inactivo" && (
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() =>
                                                        desactivarUsuario(
                                                            usuario.id
                                                        )
                                                    }
                                                >
                                                    Desactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {usuarioEditando && (
                <div className="form-card formulario-gestion">
                    <h2>
                        Editar Usuario
                    </h2>

                    <p>
                        <strong>
                            Usuario:
                        </strong>{" "}
                        {usuarioEditando.nombre}
                    </p>

                    <p>
                        <strong>
                            Correo:
                        </strong>{" "}
                        {usuarioEditando.correo}
                    </p>

                    <label>
                        Rol:
                    </label>

                    <select
                        className="form-input"
                        value={rolEditar}
                        onChange={(e) =>
                            setRolEditar(e.target.value)
                        }
                    >
                        <option value="administrador">
                            Administrador
                        </option>

                        <option value="bibliotecario">
                            Bibliotecario
                        </option>

                        <option value="estudiante">
                            Estudiante
                        </option>
                    </select>

                    <label>
                        Estado:
                    </label>

                    <select
                        className="form-input"
                        value={estadoEditar}
                        onChange={(e) =>
                            setEstadoEditar(e.target.value)
                        }
                    >
                        <option value="activo">
                            Activo
                        </option>

                        <option value="suspendido">
                            Suspendido
                        </option>

                        <option value="bloqueado">
                            Bloqueado
                        </option>

                        <option value="inactivo">
                            Inactivo
                        </option>
                    </select>

                    <button
                        className="btn btn-primary"
                        onClick={actualizarUsuario}
                    >
                        Guardar Cambios
                    </button>

                    <button
                        className="btn btn-danger spacer-xs"
                        onClick={cancelarEdicion}
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;