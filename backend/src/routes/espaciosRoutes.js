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

    const { data, error } = await supabaseAdmin
        .from("espacios")
        .select("*")
        .eq("estado", "disponible")
        .order("id", { ascending: true });


    if (error) {
        return res.status(500).json({
            mensaje: error.message
        });
    }

    res.json(data);
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
router.patch("/:id/sillas-externas", async (req, res) => {
    const { id } = req.params;
    const { accion } = req.body;

    const { data: espacio, error: consultaError } = await supabaseAdmin
        .from("espacios")
        .select("id, capacidad, sillas_ocupadas_externas")
        .eq("id", id)
        .single();

    if (consultaError || !espacio) {
        return res.status(404).json({ mensaje: "Espacio no encontrado" });
    }

    const total = Number(espacio.capacidad || 0);
    const ocupadas = Number(espacio.sillas_ocupadas_externas || 0);
    let nuevaCantidad = ocupadas;

    if (accion === "ocupar") {
        if (ocupadas >= total) {
            return res.status(400).json({ mensaje: "No quedan sillas disponibles" });
        }
        nuevaCantidad += 1;
    } else if (accion === "liberar") {
        if (ocupadas <= 0) {
            return res.status(400).json({ mensaje: "No hay sillas ocupadas para liberar" });
        }
        nuevaCantidad -= 1;
    } else {
        return res.status(400).json({ mensaje: "Acción no válida" });
    }

    const { data, error } = await supabaseAdmin
        .from("espacios")
        .update({ sillas_ocupadas_externas: nuevaCantidad })
        .eq("id", id)
        .select();

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.json(data);
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