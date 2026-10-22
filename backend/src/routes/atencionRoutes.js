// backend/src/routes/atencionRoutes.js

const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../supabaseClients");
const verificarSupabaseToken = require("../authMiddleware");

router.use(verificarSupabaseToken);

const verificarPersonalAutorizado = async (req, res, next) => {
    try {
        const { data: usuario, error } = await supabaseAdmin
            .from("usuarios")
            .select("id, rol, estado")
            .eq("id", req.usuario.id)
            .single();

        if (error || !usuario) {
            return res.status(401).json({
                mensaje: "Usuario no encontrado."
            });
        }

        if (
            usuario.rol !== "bibliotecario" &&
            usuario.rol !== "administrador"
        ) {
            return res.status(403).json({
                mensaje: "No tienes permisos para acceder a esta sección."
            });
        }

        if (usuario.estado !== "activo") {
            return res.status(403).json({
                mensaje: "El usuario no está activo."
            });
        }

        req.usuario = usuario;

        next();

    } catch (error) {
        console.error("Error verificando permisos:", error);

        return res.status(500).json({
            mensaje: "Error al verificar permisos."
        });
    }
};

router.use(verificarPersonalAutorizado);

router.get("/reservas", async (req, res) => {
    try {
        const { buscar, estado, fecha } = req.query;

        let query = supabaseAdmin
            .from("reservas")
            .select(`
                id,
                usuario_id,
                espacio_id,
                fecha,
                hora_inicio,
                estado,
                observacion,
                finalizada_at
            `)
            .order("id", { ascending: false });

        if (estado) {
            query = query.eq("estado", estado);
        }

        if (fecha) {
            query = query.eq("fecha", fecha);
        }

        const { data: reservas, error } = await query;

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        let resultado = reservas;

        if (buscar && buscar.trim()) {
            const texto = buscar.toLowerCase().trim();

            const { data: usuarios, error: usuariosError } =
                await supabaseAdmin
                    .from("usuarios")
                    .select("id, nombre, correo, username")
                    .or(
                        `nombre.ilike.%${texto}%,correo.ilike.%${texto}%,username.ilike.%${texto}%`
                    );

            if (usuariosError) {
                return res.status(500).json({
                    mensaje: usuariosError.message
                });
            }

            const idsUsuarios = usuarios.map(
                (usuario) => usuario.id
            );

            resultado = reservas.filter(
                (reserva) =>
                    idsUsuarios.includes(reserva.usuario_id) ||
                    String(reserva.id).includes(texto) ||
                    String(reserva.espacio_id).includes(texto)
            );
        }

        const usuariosIds = [
            ...new Set(
                resultado.map(
                    (reserva) => reserva.usuario_id
                )
            )
        ];

        const espaciosIds = [
            ...new Set(
                resultado.map(
                    (reserva) => reserva.espacio_id
                )
            )
        ];

        let usuarios = [];
        let espacios = [];

        if (usuariosIds.length > 0) {
            const { data } = await supabaseAdmin
                .from("usuarios")
                .select("id, nombre, correo, username")
                .in("id", usuariosIds);

            usuarios = data || [];
        }

        if (espaciosIds.length > 0) {
            const { data } = await supabaseAdmin
                .from("espacios")
                .select("id, nombre, ubicacion, biblioteca")
                .in("id", espaciosIds);

            espacios = data || [];
        }

        const reservasCompletas = resultado.map((reserva) => ({
            ...reserva,
            usuario:
                usuarios.find(
                    (usuario) =>
                        usuario.id === reserva.usuario_id
                ) || null,
            espacio:
                espacios.find(
                    (espacio) =>
                        espacio.id === reserva.espacio_id
                ) || null
        }));

        res.json(reservasCompletas);

    } catch (error) {
        console.error("Error al obtener reservas:", error);

        res.status(500).json({
            mensaje: "Error al cargar reservas."
        });
    }
});

router.patch("/reservas/:id/incidente", async (req, res) => {
    try {
        const { id } = req.params;
        const { observacion } = req.body;

        if (!observacion || !observacion.trim()) {
            return res.status(400).json({
                mensaje: "La observación es obligatoria."
            });
        }

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({
                observacion: observacion.trim()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                mensaje: error.message
            });
        }

        res.json({
            mensaje: "Incidente registrado correctamente.",
            reserva: data
        });

    } catch (error) {
        console.error("Error al registrar incidente:", error);

        res.status(500).json({
            mensaje: "No se pudo registrar el incidente."
        });
    }
});

module.exports = router;