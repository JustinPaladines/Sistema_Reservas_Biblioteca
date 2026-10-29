const { supabaseAdmin } = require("./supabaseClients");

const verificarAdministrador = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Usuario no autenticado."
            });
        }

        const token = authHeader.split(" ")[1];

        const {
            data: { user },
            error: authError
        } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                error: "Token inválido o expirado."
            });
        }

        const { data: usuario, error: usuarioError } = await supabaseAdmin
            .from("usuarios")
            .select("id, nombre, correo, rol, estado")
            .eq("id", user.id)
            .single();

        if (usuarioError || !usuario) {
            return res.status(401).json({
                error: "Usuario no encontrado."
            });
        }

        if (usuario.rol !== "administrador") {
            return res.status(403).json({
                error: "Solo los administradores pueden realizar esta acción."
            });
        }

        if (usuario.estado !== "activo") {
            return res.status(403).json({
                error: "El usuario no está activo."
            });
        }

        req.usuario = usuario;

        next();

    } catch (error) {
        console.error("Error en adminMiddleware:", error);

        return res.status(500).json({
            error: "Error al verificar administrador."
        });
    }
};

module.exports = verificarAdministrador;