// backend/src/routes/espaciosRoutes.js:
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");

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

// Obtener espacios disponibles y excluir los que tienen reservas vigentes.
router.get("/available", async (req, res) => {
    try {
        const hoy = new Date().toISOString().slice(0, 10);
        const { data: vencidas, error: vencidasError } = await supabaseAdmin
            .from("reservas").select("id, espacio_id").eq("estado", "activa").lt("fecha", hoy);
        if (vencidasError) return res.status(500).json({ mensaje: vencidasError.message });
        for (const r of vencidas || []) {
            await supabaseAdmin.from("reservas").update({ estado: "caducada" }).eq("id", r.id).eq("estado", "activa");
            const { data: otras } = await supabaseAdmin.from("reservas").select("id")
                .eq("espacio_id", r.espacio_id).in("estado", ["activa", "en progreso"]);
            if (!otras || otras.length === 0) await supabaseAdmin.from("espacios").update({ estado: "disponible" }).eq("id", r.espacio_id);
        }
        const { data: todosEspacios, error: espaciosError } = await supabaseAdmin
            .from("espacios").select("*").order("id", { ascending: true });
        if (espaciosError) return res.status(500).json({ mensaje: espaciosError.message });

        const { data: reservas, error: errorReservas } = await supabaseAdmin.from("reservas")
            .select("espacio_id").in("estado", ["activa", "en progreso"]);
        if (errorReservas) return res.status(500).json({ mensaje: errorReservas.message });

        const reservados = new Set((reservas || []).map((r) => String(r.espacio_id)));
        for (const espacio of todosEspacios || []) {
            if (espacio.estado === "ocupado" && !reservados.has(String(espacio.id))) {
                const { error: liberarError } = await supabaseAdmin.from("espacios")
                    .update({ estado: "disponible" }).eq("id", espacio.id);
                if (!liberarError) espacio.estado = "disponible";
            }
        }

        return res.json((todosEspacios || []).filter((espacio) =>
            espacio.estado === "disponible" && !reservados.has(String(espacio.id))
        ));
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
        biblioteca
    } = req.body;

    const { data, error } = await supabaseAdmin
        .from("espacios")
        .insert([
            {
                nombre,
                descripcion,
                capacidad,
                ubicacion,
                estado,
                biblioteca
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