// backend/src/routes/bibliotecasRoutes.js
const express = require("express");
const router = express.Router();

const { supabaseAdmin, supabaseAuth } = require("../supabaseClients");

async function obtenerUsuarioAutenticado(req) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user) return null;
    const { data: usuario, error } = await supabaseAdmin.from("usuarios")
        .select("id, rol, estado, biblioteca_id").eq("id", authData.user.id).maybeSingle();
    if (error || !usuario || usuario.estado !== "activo") return null;
    return usuario;
}

router.get("/mi-biblioteca", async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);
        if (!usuario) return res.status(401).json({ mensaje: "Usuario no autorizado." });
        if (usuario.rol !== "bibliotecario" || !usuario.biblioteca_id) return res.status(403).json({ mensaje: "No tienes una biblioteca asignada." });
        const { data, error } = await supabaseAdmin.from("bibliotecas").select("id, nombre").eq("id", usuario.biblioteca_id).maybeSingle();
        if (error || !data) return res.status(404).json({ mensaje: error?.message || "Biblioteca no encontrada." });
        return res.json({ biblioteca_id: data.id, nombre: data.nombre });
    } catch (error) { return res.status(500).json({ mensaje: error.message }); }
});

router.get("/:id/parametros", async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);
        if (!usuario) return res.status(401).json({ mensaje: "Usuario no autorizado." });
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensaje: "Biblioteca no válida." });
        if (usuario.rol === "bibliotecario" && Number(usuario.biblioteca_id) !== id) return res.status(403).json({ mensaje: "No puedes consultar parámetros de otra biblioteca." });
        if (!["administrador", "bibliotecario", "estudiante"].includes(usuario.rol)) return res.status(403).json({ mensaje: "No tienes permisos para consultar estos parámetros." });
        const { data, error } = await supabaseAdmin.from("parametros_biblioteca")
            .select("biblioteca_id, minutos_caducidad_reserva, max_personas_reserva, max_modificaciones_reserva")
            .eq("biblioteca_id", id).maybeSingle();
        if (error) return res.status(500).json({ mensaje: error.message });
        return res.json(data || { biblioteca_id: id, minutos_caducidad_reserva: 15, max_personas_reserva: 4, max_modificaciones_reserva: 2 });
    } catch (error) { return res.status(500).json({ mensaje: error.message }); }
});

router.put("/:id/parametros", async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);
        if (!usuario) return res.status(401).json({ mensaje: "Usuario no autorizado." });
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensaje: "Biblioteca no válida." });
        if (usuario.rol !== "administrador" && !(usuario.rol === "bibliotecario" && Number(usuario.biblioteca_id) === id)) {
            return res.status(403).json({ mensaje: "No puedes modificar los parámetros de esta biblioteca." });
        }
        const minutos = Number(req.body.minutos_caducidad_reserva);
        const personas = Number(req.body.max_personas_reserva);
        const modificaciones = Number(req.body.max_modificaciones_reserva);
        if (!Number.isInteger(minutos) || minutos < 1 || !Number.isInteger(personas) || personas < 1 ||
            !Number.isInteger(modificaciones) || modificaciones < 0) {
            return res.status(400).json({ mensaje: "Los parámetros deben contener números enteros válidos." });
        }
        const { data, error } = await supabaseAdmin.from("parametros_biblioteca").upsert({
            biblioteca_id: id, minutos_caducidad_reserva: minutos, max_personas_reserva: personas,
            max_modificaciones_reserva: modificaciones, updated_at: new Date().toISOString()
        }, { onConflict: "biblioteca_id" }).select("biblioteca_id, minutos_caducidad_reserva, max_personas_reserva, max_modificaciones_reserva").single();
        if (error) return res.status(500).json({ mensaje: error.message });
        return res.json(data);
    } catch (error) { return res.status(500).json({ mensaje: error.message }); }
});

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