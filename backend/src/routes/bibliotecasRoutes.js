// backend/src/routes/bibliotecasRoutes.js
const express = require("express");
const router = express.Router();

const { supabaseAdmin } = require("../supabaseClients");

//get de todas las bibliotecas
router.get("/", async (req, res) => {

    const { data, error } = await supabaseAdmin
        .from("bibliotecas")
        .select("*")
        .order("id", {
            ascending: true
        });

    if (error) {
        return res.status(500).json({
            mensaje: error.message
        });
    }

    res.json(data);

});


// crear biblioteca
router.post("/", async (req, res) => {

    const {
        nombre,
        ubicacion,
        horario_apertura,
        horario_cierre,
        estado
    } = req.body;

    // verificar si ya existe una biblioteca con ese nombre
    const { data: existente } = await supabaseAdmin
        .from("bibliotecas")
        .select("id")
        .ilike("nombre", nombre)
        .maybeSingle();

    if (existente) {
        return res.status(400).json({
            mensaje: "Ya existe una biblioteca con ese nombre."
        });
    }

    const { data, error } = await supabaseAdmin
        .from("bibliotecas")
        .insert([
            {
                nombre,
                ubicacion,
                horario_apertura,
                horario_cierre,
                estado: estado || "activa"
            }
        ])
        .select();

    if (error) {
        return res.status(500).json({
            mensaje: error.message
        });
    }

    res.status(201).json(data);

});


// actualizar biblioteca
router.put("/:id", async (req, res) => {

    const { id } = req.params;

    const {
        nombre,
        ubicacion,
        horario_apertura,
        horario_cierre
    } = req.body;

    // verificar si el nombre ya existe en otra biblioteca
    const { data: existente } = await supabaseAdmin
        .from("bibliotecas")
        .select("id")
        .ilike("nombre", nombre)
        .neq("id", id)
        .maybeSingle();

    if (existente) {
        return res.status(400).json({
            mensaje: "Ya existe una biblioteca con ese nombre."
        });
    }

    const { data, error } = await supabaseAdmin
        .from("bibliotecas")
        .update({
            nombre,
            ubicacion,
            horario_apertura,
            horario_cierre
        })
        .eq("id", id)
        .select();

    if (error) {
        return res.status(500).json({
            mensaje: error.message
        });
    }

    res.json(data);

});


// eliminar bibliotecas
router.delete("/:id", async (req, res) => {

    const { id } = req.params;
    const { error } = await supabaseAdmin
        .from("bibliotecas")
        .delete()
        .eq("id", id);
    if (error) {
        return res.status(500).json({
            mensaje: error.message
        });
    }
    res.json({
        mensaje: "Biblioteca eliminada correctamente"
    });

});


module.exports = router;