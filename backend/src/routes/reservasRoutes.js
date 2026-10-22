//backend/src/routes/reservasRoutes.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");

// crear una reserva y validar disponibilidad, usuario y horario
router.post("/", async (req, res) => {
    try {
        const { usuario_id, espacio_id, fecha, hora_inicio } = req.body;

        if (!usuario_id || !espacio_id || !fecha || !hora_inicio) {
            return res.status(400).json({
                mensaje: "Debe seleccionar un espacio, una fecha y una hora."
            });
        }

        const ahora = new Date();
        const inicioReserva = new Date(`${fecha}T${hora_inicio}:00`);
        if (Number.isNaN(inicioReserva.getTime()) || inicioReserva <= ahora) {
            return res.status(400).json({
                mensaje: "La fecha y hora de la reserva deben ser futuras."
            });
        }

        const { data: usuario, error: usuarioError } = await supabaseAdmin
            .from("usuarios")
            .select("id, rol, estado")
            .eq("id", usuario_id)
            .maybeSingle();

        if (usuarioError || !usuario || usuario.rol !== "estudiante" || usuario.estado !== "activo") {
            return res.status(403).json({
                mensaje: "Solo un estudiante activo puede realizar reservas."
            });
        }

        const { data: reservaUsuario, error: reservaUsuarioError } = await supabaseAdmin
            .from("reservas")
            .select("id, estado, fecha, hora_inicio")
            .eq("usuario_id", usuario_id)
            .in("estado", ["activa", "en progreso"])
            .limit(1);

        if (reservaUsuarioError) {
            return res.status(500).json({ mensaje: reservaUsuarioError.message });
        }

        if (reservaUsuario?.length) {
            return res.status(409).json({
                mensaje: "Ya tienes una reserva activa. Finalízala antes de crear otra."
            });
        }

        const { data: espacio, error: espacioConsultaError } = await supabaseAdmin
            .from("espacios")
            .select("id, nombre, estado, biblioteca")
            .eq("id", espacio_id)
            .maybeSingle();

        if (espacioConsultaError) {
            return res.status(500).json({ mensaje: espacioConsultaError.message });
        }

        if (!espacio) {
            return res.status(404).json({ mensaje: "El espacio seleccionado no existe." });
        }

        if (espacio.estado !== "disponible") {
            return res.status(409).json({
                mensaje: "Este espacio ya no está disponible. Selecciona otro."
            });
        }

        const { data: reservaEspacio, error: reservaEspacioError } = await supabaseAdmin
            .from("reservas")
            .select("id")
            .eq("espacio_id", espacio_id)
            .in("estado", ["activa", "en progreso"])
            .limit(1);

        if (reservaEspacioError) {
            return res.status(500).json({ mensaje: reservaEspacioError.message });
        }

        if (reservaEspacio?.length) {
            return res.status(409).json({
                mensaje: "Este espacio ya tiene una reserva vigente."
            });
        }

        const { data: biblioteca, error: bibliotecaError } = await supabaseAdmin
            .from("bibliotecas")
            .select("nombre, horario_apertura, horario_cierre, estado")
            .ilike("nombre", espacio.biblioteca || "")
            .maybeSingle();

        if (bibliotecaError) {
            return res.status(500).json({ mensaje: bibliotecaError.message });
        }

        if (!biblioteca) {
            return res.status(400).json({
                mensaje: "No se encontró el horario de la biblioteca de este espacio."
            });
        }

        if (biblioteca.estado && !["activa", "activo"].includes(biblioteca.estado.toLowerCase())) {
            return res.status(400).json({
                mensaje: "La biblioteca no está habilitada para reservas."
            });
        }

        const horaSolicitada = String(hora_inicio).slice(0, 5);
        const apertura = String(biblioteca.horario_apertura || "").slice(0, 5);
        const cierre = String(biblioteca.horario_cierre || "").slice(0, 5);

        if (!apertura || !cierre || horaSolicitada < apertura || horaSolicitada >= cierre) {
            return res.status(400).json({
                mensaje: `La reserva debe iniciar dentro del horario de atención de la biblioteca (${apertura || "sin definir"} a ${cierre || "sin definir"}).`
            });
        }

        // reservar el espacio solo si continúa disponible
        const { data: espacioOcupado, error: ocuparError } = await supabaseAdmin
            .from("espacios")
            .update({ estado: "ocupado" })
            .eq("id", espacio_id)
            .eq("estado", "disponible")
            .select("id")
            .maybeSingle();

        if (ocuparError) {
            return res.status(500).json({ mensaje: ocuparError.message });
        }

        if (!espacioOcupado) {
            return res.status(409).json({
                mensaje: "Otro usuario acaba de reservar este espacio. Actualiza la lista."
            });
        }

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .insert([{
                usuario_id,
                espacio_id,
                fecha,
                hora_inicio,
                estado: "activa"
            }])
            .select();

        if (error) {
            await supabaseAdmin
                .from("espacios")
                .update({ estado: "disponible" })
                .eq("id", espacio_id);
            return res.status(500).json({ mensaje: error.message });
        }

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
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

// iniciar una reserva activa
router.patch("/:id/check-in", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({ estado: "en progreso" })
            .eq("id", id)
            .eq("estado", "activa")
            .select()
            .single();

        if (error || !data) {
            return res.status(400).json({
                mensaje: error?.message || "La reserva no está activa o no existe."
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