import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/global.css";

const GestionUsuarios = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [bibliotecas, setBibliotecas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buscar, setBuscar] = useState("");
    const [rol, setRol] = useState("");
    const [estado, setEstado] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [estadoEditar, setEstadoEditar] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [nombreNuevo, setNombreNuevo] = useState("");
    const [correoNuevo, setCorreoNuevo] = useState("");
    const [bibliotecaNueva, setBibliotecaNueva] = useState("");
    const [creando, setCreando] = useState(false);

    useEffect(() => {
        obtenerUsuarios();
        obtenerBibliotecas();
    }, []);

    const obtenerUsuarios = async () => {
        try {
            setLoading(true);
            const parametros = new URLSearchParams();
            if (buscar.trim()) parametros.append("buscar", buscar.trim());
            if (rol) parametros.append("rol", rol);
            if (estado) parametros.append("estado", estado);
            const query = parametros.toString();
            const data = await api(`/api/usuarios${query ? `?${query}` : ""}`);
            setUsuarios(data.filter((usuario) => !["administrador", "admin"].includes(String(usuario.rol).toLowerCase())));
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            alert("No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    const obtenerBibliotecas = async () => {
        try {
            const data = await api("/api/libraries");
            setBibliotecas(data.filter((biblioteca) => String(biblioteca.estado || "").toLowerCase() === "activa"));
        } catch (error) {
            alert(error.message || "No se pudieron cargar las bibliotecas.");
        }
    };

    const limpiarFiltros = () => {
        setBuscar("");
        setRol("");
        setEstado("");
        obtenerUsuarios();
    };

    const abrirFormularioBibliotecario = () => {
        setMostrarFormulario(true);
        window.setTimeout(() => {
            document.getElementById("formulario-bibliotecario")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    };

    const cancelarCreacion = () => {
        setMostrarFormulario(false);
        setNombreNuevo("");
        setCorreoNuevo("");
        setBibliotecaNueva("");
    };

    const crearBibliotecario = async (e) => {
        e.preventDefault();
        if (!nombreNuevo.trim() || !correoNuevo.trim() || !bibliotecaNueva) {
            alert("Completa el nombre, correo y biblioteca.");
            return;
        }

        const confirmar = window.confirm(
            `¿Crear el bibliotecario ${nombreNuevo.trim()} con el correo ${correoNuevo.trim()} y enviarle el enlace para establecer su contraseña?`
        );
        if (!confirmar) return;

        try {
            setCreando(true);
            const respuesta = await api("/api/usuarios/bibliotecarios", {
                method: "POST",
                body: JSON.stringify({
                    nombre: nombreNuevo.trim(),
                    correo: correoNuevo.trim(),
                    biblioteca_id: Number(bibliotecaNueva)
                })
            });
            alert(respuesta.mensaje || "Bibliotecario creado correctamente.");
            cancelarCreacion();
            await obtenerUsuarios();
        } catch (error) {
            alert(error.message || "No se pudo crear el bibliotecario.");
        } finally {
            setCreando(false);
        }
    };

    const editarUsuario = (usuario) => {
        setUsuarioEditando(usuario);
        setEstadoEditar(usuario.estado);
        window.setTimeout(() => {
            document.getElementById("formulario-estado")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    };

    const cancelarEdicion = () => {
        setUsuarioEditando(null);
        setEstadoEditar("");
    };

    const actualizarUsuario = async () => {
        if (!usuarioEditando) return;
        if (!window.confirm("¿Guardar el nuevo estado de este usuario?")) return;

        try {
            await api(`/api/usuarios/${usuarioEditando.id}`, {
                method: "PUT",
                body: JSON.stringify({ estado: estadoEditar })
            });
            alert("Usuario actualizado correctamente");
            cancelarEdicion();
            obtenerUsuarios();
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            alert(error.message || "No se pudo actualizar el usuario");
        }
    };

    return (
        <div className="page-container">
            <div className="page-actions">
                <button className="btn btn-danger btn-back" onClick={() => navigate(-1)}>Regresar</button>
            </div>

            <h1 className="page-title">Gestión de Usuarios</h1>

            <div className="usuarios-crear-accion">
                <button className="btn btn-primary" onClick={abrirFormularioBibliotecario}>
                    Crear Bibliotecario
                </button>
            </div>

            {mostrarFormulario && (
                <form id="formulario-bibliotecario" className="form-card formulario-gestion" onSubmit={crearBibliotecario}>
                    <h2>Crear Bibliotecario</h2>
                    <label htmlFor="nombre-bibliotecario">Nombre</label>
                    <input id="nombre-bibliotecario" className="form-input" type="text" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} placeholder="Nombre completo" required />

                    <label htmlFor="correo-bibliotecario">Correo</label>
                    <input id="correo-bibliotecario" className="form-input" type="email" value={correoNuevo} onChange={(e) => setCorreoNuevo(e.target.value)} placeholder="correo@dominio.com" required />

                    <label htmlFor="biblioteca-bibliotecario">Biblioteca</label>
                    <select id="biblioteca-bibliotecario" className="form-input" value={bibliotecaNueva} onChange={(e) => setBibliotecaNueva(e.target.value)} required>
                        <option value="">Selecciona una biblioteca</option>
                        {bibliotecas.map((biblioteca) => (
                            <option key={biblioteca.id} value={biblioteca.id}>{biblioteca.nombre}</option>
                        ))}
                    </select>

                    {bibliotecas.length === 0 && <p>No hay bibliotecas activas disponibles.</p>}
                    <button type="submit" className="btn btn-primary" disabled={creando || bibliotecas.length === 0}>
                        {creando ? "Creando..." : "Crear Bibliotecario"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={cancelarCreacion}>Cancelar</button>
                </form>
            )}

            <hr className="section-divider" />

            <div className="filtros">
                <input className="form-input" type="text" placeholder="Buscar por nombre, correo o rol" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                <select className="form-input" value={rol} onChange={(e) => setRol(e.target.value)}>
                    <option value="">Todos los roles</option>
                    <option value="bibliotecario">Bibliotecario</option>
                    <option value="estudiante">Estudiante</option>
                </select>
                <select className="form-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="bloqueado">Bloqueado</option>
                    <option value="inactivo">Inactivo</option>
                </select>
                <button className="btn btn-primary" onClick={obtenerUsuarios}>Buscar</button>
                <button className="btn btn-success" onClick={limpiarFiltros}>Limpiar</button>
            </div>

            {loading ? (
                <p className="loading">Cargando usuarios...</p>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th>
                                <th>Intentos fallidos</th><th>Fecha de creación</th><th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.length > 0 ? usuarios.map((usuario) => (
                                <tr key={usuario.id}>
                                    <td>{usuario.nombre}</td><td>{usuario.correo}</td><td>{usuario.rol}</td>
                                    <td>{usuario.estado}</td><td>{usuario.intentos_fallidos}</td>
                                    <td>{usuario.created_at ? new Date(usuario.created_at).toLocaleDateString("es-ES") : "Sin fecha"}</td>
                                    <td><button className="btn btn-success" onClick={() => editarUsuario(usuario)}>Editar estado</button></td>
                                </tr>
                            )) : <tr><td colSpan="7">No se encontraron usuarios.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {usuarioEditando && (
                <div id="formulario-estado" className="form-card formulario-gestion">
                    <h2>Editar estado del usuario</h2>
                    <p><strong>Usuario:</strong> {usuarioEditando.nombre}</p>
                    <p><strong>Correo:</strong> {usuarioEditando.correo}</p>
                    <label>Estado:</label>
                    <select className="form-input" value={estadoEditar} onChange={(e) => setEstadoEditar(e.target.value)}>
                        <option value="activo">Activo</option><option value="suspendido">Suspendido</option>
                        <option value="bloqueado">Bloqueado</option><option value="inactivo">Inactivo</option>
                    </select>
                    <button className="btn btn-primary" onClick={actualizarUsuario}>Guardar Cambios</button>
                    <button className="btn btn-danger spacer-xs" onClick={cancelarEdicion}>Cancelar</button>
                </div>
            )}
        </div>
    );
};

export default GestionUsuarios;
