//backend/src/routes/reservasRoutes.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");

// Crear reserva
router.post("/", async (req, res) => {
    try {
        const {
            usuario_id,
            espacio_id,
            fecha,
            hora_inicio,
        } = req.body;

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .insert([{
                usuario_id,
                espacio_id,
                fecha,
                hora_inicio,
                estado: "activa",
            }])
            .select();

        if (error) {
            return res.status(500).json({ mensaje: error.message });
        }
        // cambiar estado del espacio a "ocupado"
        const { error: espacioError } = await supabaseAdmin
            .from("espacios")
            .update({
                estado: "ocupado"
            })
            .eq("id", espacio_id);

        // si falla la actualización del espacio, es un error del servidor
        if (espacioError) {
            console.error("Error al actualizar el espacio:", espacioError);
            return res.status(500).json({ mensaje: espacioError.message });
        }

        // respuesta exitosa
        res.status(201).json(data);

    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// Obtener todas las reservas
router.get("/", async (req, res) => {
    try {
        const { data: reservas, error } = await supabaseAdmin
            .from("reservas")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return res.status(500).json({ mensaje: error.message });
        }

        if (!reservas || reservas.length === 0) {
            return res.json([]);
        }

        const usuarioIds = [
            ...new Set(reservas.map((reserva) => reserva.usuario_id))
        ];

        const espacioIds = [
            ...new Set(reservas.map((reserva) => reserva.espacio_id))
        ];

        const { data: usuarios, error: usuariosError } = await supabaseAdmin
            .from("usuarios")
            .select("id, nombre, correo")
            .in("id", usuarioIds);

        if (usuariosError) {
            return res.status(500).json({
                mensaje: usuariosError.message
            });
        }

        const { data: espacios, error: espaciosError } = await supabaseAdmin
            .from("espacios")
            .select("id, nombre, ubicacion")
            .in("id", espacioIds);

        if (espaciosError) {
            return res.status(500).json({
                mensaje: espaciosError.message
            });
        }

        const reservasCompletas = reservas.map((reserva) => {
            const usuario = usuarios.find(
                (u) => u.id === reserva.usuario_id
            );

            const espacio = espacios.find(
                (e) => e.id === reserva.espacio_id
            );

            return {
                ...reserva,
                usuario_nombre: usuario?.nombre || "Usuario no encontrado",
                usuario_correo: usuario?.correo || "Sin correo",
                espacio_nombre: espacio?.nombre || "Espacio no encontrado",
                espacio_ubicacion: espacio?.ubicacion || "Sin ubicación"
            };
        });

        res.json(reservasCompletas);
    } catch (error) {
        console.error("Error obteniendo reservas:", error);
        res.status(500).json({ mensaje: error.message });
    }
});

// Obtener reserva por ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: reserva, error } = await supabaseAdmin
            .from("reservas")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !reserva) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada"
            });
        }

        const { data: usuario } = await supabaseAdmin
            .from("usuarios")
            .select("id, nombre, correo")
            .eq("id", reserva.usuario_id)
            .single();

        const { data: espacio } = await supabaseAdmin
            .from("espacios")
            .select("id, nombre, ubicacion")
            .eq("id", reserva.espacio_id)
            .single();

        res.json({
            ...reserva,
            usuario_nombre: usuario?.nombre || "Usuario no encontrado",
            usuario_correo: usuario?.correo || "Sin correo",
            espacio_nombre: espacio?.nombre || "Espacio no encontrado",
            espacio_ubicacion: espacio?.ubicacion || "Sin ubicación"
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// Obtener reservas de un usuario
router.get("/user/:usuario_id", async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .select("*")
            .eq("usuario_id", usuario_id)
            .order("id", { ascending: false });

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// Actualizar reserva
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update(req.body)
            .eq("id", id)
            .select();

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// Cancelar reserva
router.patch("/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;

        // obtener el espacio asociado a la reserva
        const { data: reserva, error: reservaError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id")
            .eq("id", id)
            .single();

        if (reservaError) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada"
            });
        }

        // cambiar estado de la reserva
        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({
                estado: "cancelada",
                finalizada_at: new Date().toISOString()
            })
            .eq("id", id)
            .select();

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        // liberar el espacio
        const { error: espacioError } = await supabaseAdmin
            .from("espacios")
            .update({
                estado: "disponible"
            })
            .eq("id", reserva.espacio_id);

        if (espacioError) {
            return res.status(500).json({
                mensaje: espacioError.message
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({
            mensaje: error.message
        });
    }
});

// Finalizar reserva
router.patch("/:id/finish", async (req, res) => {
    try {
        const { id } = req.params;

        // obtener el espacio asociado a la reserva
        const { data: reserva, error: reservaError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id")
            .eq("id", id)
            .single();

        if (reservaError) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada"
            });
        }

        // cambiar estado de la reserva
        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({
                estado: "finalizada",
                finalizada_at: new Date().toISOString()
            })
            .eq("id", id)
            .select();

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        // liberar el espacio
        const { error: espacioError } = await supabaseAdmin
            .from("espacios")
            .update({
                estado: "disponible"
            })
            .eq("id", reserva.espacio_id);

        if (espacioError) {
            return res.status(500).json({
                mensaje: espacioError.message
            });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({
            mensaje: error.message
        });
    }
});

module.exports = router;