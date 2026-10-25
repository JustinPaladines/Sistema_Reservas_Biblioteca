// backend/src/routes/espaciosRoutes.js:
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");

// caducar reservas que no fueron confirmadas dentro de los 15 minutos posteriores a su inicio
async function caducarReservasVencidas() {
    const { data: reservas, error } = await supabaseAdmin
        .from("reservas")
        .select("id, espacio_id, fecha, hora_inicio, cantidad_estudiantes")
        .eq("estado", "activa");

    if (error) throw error;

    const ahora = Date.now();
    const margen = 15 * 60 * 1000;

    for (const reserva of reservas || []) {
        const hora = String(reserva.hora_inicio || "").slice(0, 8);
        const horaCompleta = hora.length === 5 ? `${hora}:00` : hora;
        const inicio = new Date(`${reserva.fecha}T${horaCompleta}-05:00`).getTime();

        if (!Number.isFinite(inicio) || ahora <= inicio + margen) continue;

        const { data: actualizada, error: actualizarError } = await supabaseAdmin
            .from("reservas")
            .update({ estado: "caducada", finalizada_at: new Date().toISOString() })
            .eq("id", reserva.id)
            .eq("estado", "activa")
            .select("id")
            .maybeSingle();

        if (actualizarError) throw actualizarError;
        if (!actualizada) continue;

        const { data: otrasReservas, error: otrasError } = await supabaseAdmin
            .from("reservas")
            .select("id")
            .eq("espacio_id", reserva.espacio_id)
            .in("estado", ["activa", "en progreso"])
            .limit(1);

        if (otrasError) throw otrasError;

        const { data: espacioActual, error: espacioError } = await supabaseAdmin
            .from("espacios")
            .select("sillas_ocupadas_externas")
            .eq("id", reserva.espacio_id)
            .maybeSingle();

        if (espacioError) throw espacioError;

        if (espacioActual) {
            const { error: sillasError } = await supabaseAdmin
                .from("espacios")
                .update({
                    sillas_ocupadas_externas: Math.max(
                        0,
                        Number(espacioActual.sillas_ocupadas_externas || 0) - Number(reserva.cantidad_estudiantes || 1)
                    )
                })
                .eq("id", reserva.espacio_id);

            if (sillasError) throw sillasError;
        }
    }

    const { data: reservasTerminadas, error: terminadasError } = await supabaseAdmin
        .from("reservas")
        .select("id, espacio_id, fecha, hora_fin, cantidad_estudiantes")
        .eq("estado", "en progreso")
        .not("hora_fin", "is", null);

    if (terminadasError) throw terminadasError;

    for (const reserva of reservasTerminadas || []) {
        const fin = String(reserva.hora_fin || "").slice(0, 8);
        const finCompleto = fin.length === 5 ? `${fin}:00` : fin;
        const finReserva = new Date(`${reserva.fecha}T${finCompleto}-05:00`).getTime();

        if (!Number.isFinite(finReserva) || ahora < finReserva) continue;

        const { data: finalizada, error: finalizarError } = await supabaseAdmin
            .from("reservas")
            .update({ estado: "finalizada", finalizada_at: new Date().toISOString() })
            .eq("id", reserva.id)
            .eq("estado", "en progreso")
            .select("id")
            .maybeSingle();

        if (finalizarError) throw finalizarError;
        if (!finalizada) continue;

        const { data: espacioActual, error: espacioError } = await supabaseAdmin
            .from("espacios")
            .select("sillas_ocupadas_externas")
            .eq("id", reserva.espacio_id)
            .maybeSingle();

        if (espacioError) throw espacioError;

        if (espacioActual) {
            const { error: sillasError } = await supabaseAdmin
                .from("espacios")
                .update({
                    sillas_ocupadas_externas: Math.max(
                        0,
                        Number(espacioActual.sillas_ocupadas_externas || 0) - Number(reserva.cantidad_estudiantes || 1)
                    )
                })
                .eq("id", reserva.espacio_id);

            if (sillasError) throw sillasError;
        }
    }
}

router.get("/", async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from("espacios")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.json(data);
});

// obtener espacios disponibles para estudiantes
router.get("/available", async (req, res) => {
    try {
        await caducarReservasVencidas();

        const { fecha, hora_inicio, hora_fin } = req.query;
        const tieneHorario = Boolean(fecha || hora_inicio || hora_fin);

        if (tieneHorario && (!fecha || !hora_inicio || !hora_fin)) {
            return res.status(400).json({
                mensaje: "Para consultar disponibilidad debe indicar fecha, hora de inicio y hora de fin."
            });
        }

        const inicio = String(hora_inicio || "").slice(0, 5);
        const fin = String(hora_fin || "").slice(0, 5);

        if (tieneHorario && fin <= inicio) {
            return res.status(400).json({
                mensaje: "La hora de fin debe ser posterior a la hora de inicio."
            });
        }

        const { data: espacios, error: espaciosError } = await supabaseAdmin
            .from("espacios")
            .select("*")
            .neq("estado", "mantenimiento")
            .order("id", { ascending: true });

        if (espaciosError) {
            return res.status(500).json({ mensaje: espaciosError.message });
        }

        if (!tieneHorario || !espacios?.length) {
            return res.json(espacios || []);
        }

        const { data: reservas, error: reservasError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id, hora_inicio, hora_fin")
            .eq("fecha", fecha)
            .in("estado", ["activa", "en progreso"]);

        if (reservasError) {
            return res.status(500).json({ mensaje: reservasError.message });
        }

        const espaciosOcupados = new Set(
            (reservas || [])
                .filter((reserva) => {
                    const inicioExistente = String(reserva.hora_inicio || "").slice(0, 5);
                    const finExistente = String(reserva.hora_fin || "").slice(0, 5);
                    return !finExistente || (inicio < finExistente && fin > inicioExistente);
                })
                .map((reserva) => Number(reserva.espacio_id))
        );

        return res.json(
            espacios.filter((espacio) => !espaciosOcupados.has(Number(espacio.id)))
        );
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});

router.post("/", async (req, res) => {
    const {
        nombre,
        descripcion,
        capacidad,
        ubicacion,
        estado,
        biblioteca_id
    } = req.body;

    if (!nombre || !capacidad || !ubicacion || !biblioteca_id) {
        return res.status(400).json({
            mensaje: "Debe indicar nombre, capacidad, ubicación y biblioteca."
        });
    }

    const { data, error } = await supabaseAdmin
        .from("espacios")
        .insert([
            {
                nombre,
                descripcion,
                capacidad,
                ubicacion,
                estado: estado || "disponible",
                biblioteca_id
            }
        ])
        .select();

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.status(201).json(data);
});

// actualizar las sillas ocupadas temporalmente por personas externas
router.patch("/:id/sillas-compartidas", async (req, res) => {
    const { id } = req.params;
    const { accion } = req.body;

    if (!["ocupar", "liberar"].includes(accion)) {
        return res.status(400).json({ mensaje: "Acción no válida" });
    }

    const { data, error } = await supabaseAdmin.rpc("actualizar_sillas_compartidas", {
        espacio_id_param: Number(id),
        accion_param: accion
    });

    if (error) {
        const mensaje = error.message || "No se pudo actualizar la disponibilidad";
        const estado = mensaje.includes("no encontrado") ? 404
            : mensaje.includes("sillas disponibles") || mensaje.includes("sillas ocupadas") ? 400
            : 500;
        return res.status(estado).json({ mensaje });
    }

    res.json(Array.isArray(data) ? data[0] : data);
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
        .from("espacios")
        .update(req.body)
        .eq("id", id)
        .select();

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.json(data);
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from("espacios")
        .delete()
        .eq("id", id);

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.json({
        mensaje: "Espacio eliminado correctamente"
    });
});

module.exports = router;