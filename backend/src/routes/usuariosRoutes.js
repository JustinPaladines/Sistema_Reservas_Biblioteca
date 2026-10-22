// backend/src/routes/usuariosRoutes.js

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");
const verificarSupabaseToken = require("../authMiddleware");
const verificarAdministrador = require("../adminMiddleware");

const ROLES_VALIDOS = ["administrador", "bibliotecario", "estudiante"];
const ESTADOS_VALIDOS = ["activo", "suspendido", "bloqueado", "inactivo"];


// rutas exclusivas para administrador (gestion de usuarios)

router.use(verificarAdministrador);

router.get("/", async (req, res) => {
    try {
        const { buscar, rol, estado } = req.query;

        let query = supabaseAdmin
            .from("usuarios")
            .select(`
                id,
                nombre,
                correo,
                rol,
                estado,
                intentos_fallidos,
                created_at
            `);

        if (rol) {
            query = query.eq("rol", rol);
        }

        if (estado) {
            query = query.eq("estado", estado);
        }

        if (buscar) {
            query = query.or(
                `nombre.ilike.%${buscar}%,correo.ilike.%${buscar}%,rol.ilike.%${buscar}%`
            );
        }

        const { data, error } = await query.order("nombre", {
            ascending: true
        });

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({
            mensaje: error.message
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select(`
                id,
                nombre,
                correo,
                rol,
                estado,
                intentos_fallidos,
                created_at
            `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({
            mensaje: error.message
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, estado } = req.body;

        if (req.usuario.id === id) {
            return res.status(403).json({
                mensaje: "No puedes modificar tu propia cuenta."
            });
        }

        const { data: usuarioExiste } = await supabaseAdmin
            .from("usuarios")
            .select("id")
            .eq("id", id)
            .single();

        if (!usuarioExiste) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
        }

        if (!rol && !estado) {
            return res.status(400).json({
                mensaje: "No se enviaron datos para actualizar."
            });
        }

        if (rol && !ROLES_VALIDOS.includes(rol)) {
            return res.status(400).json({
                mensaje: "Rol no válido."
            });
        }

        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                mensaje: "Estado no válido."
            });
        }

        const datosActualizar = {};

        if (rol) {
            datosActualizar.rol = rol;
        }

        if (estado) {
            datosActualizar.estado = estado;
        }

        if (estado === "activo") {
            datosActualizar.intentos_fallidos = 0;
        }

        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .update(datosActualizar)
            .eq("id", id)
            .select();

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json({
            mensaje: "Usuario actualizado correctamente.",
            usuario: data
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (req.usuario.id === id) {
            return res.status(403).json({
                mensaje: "No puedes desactivar tu propia cuenta."
            });
        }

        const { data: usuarioExiste } = await supabaseAdmin
            .from("usuarios")
            .select("id")
            .eq("id", id)
            .single();

        if (!usuarioExiste) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
        }

        const { error } = await supabaseAdmin
            .from("usuarios")
            .update({
                estado: "inactivo",
                intentos_fallidos: 0
            })
            .eq("id", id);

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json({
            mensaje: "Usuario desactivado correctamente."
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message
        });
    }
});

module.exports = router;