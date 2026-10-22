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

// obtener espacios disponibles para estudiantes
router.get("/available", async (req, res) => {
    try {
        const { data: espacios, error: espaciosError } = await supabaseAdmin
            .from("espacios")
            .select("*")
            .eq("estado", "disponible")
            .order("id", { ascending: true });

        if (espaciosError) {
            return res.status(500).json({ mensaje: espaciosError.message });
        }

        if (!espacios?.length) return res.json([]);

        // ocultar espacios con reservas que todavía están vigentes
        const { data: reservas, error: reservasError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id")
            .in("estado", ["activa", "en progreso"]);

        if (reservasError) {
            return res.status(500).json({ mensaje: reservasError.message });
        }

        const espaciosReservados = new Set(
            (reservas || []).map((reserva) => Number(reserva.espacio_id))
        );

        return res.json(
            espacios.filter((espacio) => !espaciosReservados.has(Number(espacio.id)))
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