//backend/src/routes/reservasRoutes.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");

// Crear reserva con validaciones de horario, disponibilidad y reservas activas.
router.post("/", async (req, res) => {
    try {
        const { usuario_id, espacio_id, fecha, hora_inicio } = req.body;
        if (!usuario_id || !espacio_id || !fecha || !hora_inicio) {
            return res.status(400).json({ mensaje: "Debe completar usuario, espacio, fecha y hora de inicio." });
        }
        const hoy = new Date().toISOString().slice(0, 10);
        if (fecha < hoy) return res.status(400).json({ mensaje: "No puede reservar fechas pasadas." });

        const { data: vencidas, error: vencidasError } = await supabaseAdmin
            .from("reservas").select("id, espacio_id").eq("estado", "activa").lt("fecha", hoy);
        if (vencidasError) return res.status(500).json({ mensaje: vencidasError.message });
        for (const r of vencidas || []) {
            await supabaseAdmin.from("reservas").update({ estado: "caducada" }).eq("id", r.id).eq("estado", "activa");
            const { data: otras } = await supabaseAdmin.from("reservas").select("id")
                .eq("espacio_id", r.espacio_id).in("estado", ["activa", "en progreso"]);
            if (!otras || otras.length === 0) await supabaseAdmin.from("espacios").update({ estado: "disponible" }).eq("id", r.espacio_id);
        }

        const { data: reservasUsuario, error: errorUsuario } = await supabaseAdmin
            .from("reservas").select("id").eq("usuario_id", usuario_id).in("estado", ["activa", "en progreso"]).limit(1);
        if (errorUsuario) return res.status(500).json({ mensaje: errorUsuario.message });
        if (reservasUsuario && reservasUsuario.length) {
            return res.status(409).json({ mensaje: "Ya tienes una reserva activa. Finalízala antes de crear otra." });
        }

        const { data: espacio, error: errorEspacio } = await supabaseAdmin
            .from("espacios").select("id, nombre, estado, biblioteca").eq("id", espacio_id).maybeSingle();
        if (errorEspacio) return res.status(500).json({ mensaje: errorEspacio.message });
        if (!espacio) return res.status(404).json({ mensaje: "El espacio seleccionado no existe." });

        const { data: reservasEspacio, error: errorReservasEspacio } = await supabaseAdmin
            .from("reservas").select("id").eq("espacio_id", espacio_id).in("estado", ["activa", "en progreso"]).limit(1);
        if (errorReservasEspacio) return res.status(500).json({ mensaje: errorReservasEspacio.message });
        if ((reservasEspacio && reservasEspacio.length) || espacio.estado !== "disponible") {
            return res.status(409).json({ mensaje: "Este espacio ya está reservado. Selecciona otro espacio disponible." });
        }

        const { data: biblioteca, error: errorBiblioteca } = await supabaseAdmin
            .from("bibliotecas").select("nombre, horario_apertura, horario_cierre").ilike("nombre", espacio.biblioteca).maybeSingle();
        if (errorBiblioteca) return res.status(500).json({ mensaje: errorBiblioteca.message });
        if (!biblioteca) return res.status(400).json({ mensaje: "No se encontró el horario de la biblioteca de este espacio." });

        const normalizarHora = (valor) => String(valor || "").slice(0, 5);
        const hora = normalizarHora(hora_inicio);
        const apertura = normalizarHora(biblioteca.horario_apertura);
        const cierre = normalizarHora(biblioteca.horario_cierre);
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
            return res.status(400).json({ mensaje: "La hora de inicio no es válida." });
        }
        if (!apertura || !cierre || hora < apertura || hora >= cierre) {
            return res.status(400).json({ mensaje: "La reserva debe iniciar dentro del horario de la biblioteca (" + (apertura || "no definido") + "–" + (cierre || "no definido") + ")." });
        }

        const { data, error } = await supabaseAdmin.from("reservas").insert([{
            usuario_id, espacio_id, fecha, hora_inicio: hora, estado: "activa"
        }]).select().single();
        if (error) {
            if (error.code === "23505") return res.status(409).json({ mensaje: "Ya existe una reserva activa para este usuario o espacio." });
            return res.status(500).json({ mensaje: error.message });
        }
        const { error: actualizarError } = await supabaseAdmin.from("espacios").update({ estado: "ocupado" }).eq("id", espacio_id);
        if (actualizarError) {
            await supabaseAdmin.from("reservas").delete().eq("id", data.id);
            return res.status(500).json({ mensaje: actualizarError.message });
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

// Cancelar una reserva desde el panel del estudiante.
router.patch("/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: reserva, error: reservaError } = await supabaseAdmin
            .from("reservas").select("espacio_id, estado").eq("id", id).maybeSingle();
        if (reservaError) return res.status(500).json({ mensaje: reservaError.message });
        if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada." });
        if (!["activa", "en progreso"].includes(reserva.estado)) {
            return res.status(400).json({ mensaje: "La reserva ya no está activa." });
        }
        const { data, error } = await supabaseAdmin.from("reservas")
            .update({ estado: "caducada", finalizada_at: new Date().toISOString() })
            .eq("id", id).in("estado", ["activa", "en progreso"]).select().single();
        if (error) return res.status(500).json({ mensaje: error.message });
        const { data: otras, error: otrasError } = await supabaseAdmin.from("reservas")
            .select("id").eq("espacio_id", reserva.espacio_id).in("estado", ["activa", "en progreso"]);
        if (otrasError) return res.status(500).json({ mensaje: otrasError.message });
        if (!otras || otras.length === 0) {
            const { error: liberarError } = await supabaseAdmin.from("espacios")
                .update({ estado: "disponible" }).eq("id", reserva.espacio_id);
            if (liberarError) return res.status(500).json({ mensaje: liberarError.message });
        }
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});

// Finalizar una reserva y liberar el espacio.
router.patch("/:id/finish", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: reserva, error: reservaError } = await supabaseAdmin
            .from("reservas").select("espacio_id, estado").eq("id", id).maybeSingle();
        if (reservaError) return res.status(500).json({ mensaje: reservaError.message });
        if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada." });
        if (!["activa", "en progreso"].includes(reserva.estado)) {
            return res.status(400).json({ mensaje: "La reserva ya fue finalizada o caducó." });
        }
        const { data, error } = await supabaseAdmin.from("reservas")
            .update({ estado: "finalizada", finalizada_at: new Date().toISOString() })
            .eq("id", id).in("estado", ["activa", "en progreso"]).select().single();
        if (error) return res.status(500).json({ mensaje: error.message });
        const { data: otras, error: otrasError } = await supabaseAdmin.from("reservas")
            .select("id").eq("espacio_id", reserva.espacio_id).in("estado", ["activa", "en progreso"]);
        if (otrasError) return res.status(500).json({ mensaje: otrasError.message });
        if (!otras || otras.length === 0) {
            const { error: liberarError } = await supabaseAdmin.from("espacios")
                .update({ estado: "disponible" }).eq("id", reserva.espacio_id);
            if (liberarError) return res.status(500).json({ mensaje: liberarError.message });
        }
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});

module.exports = router;