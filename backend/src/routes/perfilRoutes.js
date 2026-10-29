// backend/src/routes/perfilRoutes.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");
const verificarSupabaseToken = require("../authMiddleware");

router.use(verificarSupabaseToken);

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (req.usuario.id !== id) {
            return res.status(403).json({
                mensaje: "No puedes consultar el perfil de otro usuario."
            });
        }

        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select(`
                id,
                nombre,
                correo,
                rol,
                estado,
                username,
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
        console.error("Error al obtener perfil:", error);

        res.status(500).json({
            mensaje: "Error al cargar el perfil."
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, username } = req.body;

        if (req.usuario.id !== id) {
            return res.status(403).json({
                mensaje: "No puedes modificar el perfil de otro usuario."
            });
        }

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                mensaje: "El nombre es obligatorio."
            });
        }

        if (!username || !username.trim()) {
            return res.status(400).json({
                mensaje: "El username es obligatorio."
            });
        }

        if (username.trim().length < 4) {
            return res.status(400).json({
                mensaje: "El username debe tener mínimo 4 caracteres."
            });
        }

        const { data: usernameExistente } = await supabaseAdmin
            .from("usuarios")
            .select("id")
            .eq("username", username.trim())
            .neq("id", id)
            .maybeSingle();

        if (usernameExistente) {
            return res.status(400).json({
                mensaje: "Ese username ya está en uso."
            });
        }

        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .update({
                nombre: nombre.trim(),
                username: username.trim()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json({
            mensaje: "Perfil actualizado correctamente.",
            usuario: data
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);

        res.status(500).json({
            mensaje: "Error al actualizar el perfil."
        });
    }
});

module.exports = router;