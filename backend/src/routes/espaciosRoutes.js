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