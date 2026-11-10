// backend/src/routes/reservasRoutes.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin, supabaseAuth } = require("../supabaseClients");
const { tieneCapacidadDisponible } = require("../utils/disponibilidadReservas");

// Middleware para verificar rol de bibliotecario o administrador
async function verificarBibliotecaBibliotecario(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return res.status(401).json({ mensaje: "Token requerido." });

        const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
        if (authError || !authData.user) return res.status(401).json({ mensaje: "Token inválido." });

        const { data: usuario } = await supabaseAdmin
            .from("usuarios")
            .select("id, rol, estado, biblioteca_id")
            .eq("id", authData.user.id)
            .maybeSingle();

        if (!usuario || usuario.estado !== "activo") {
            return res.status(403).json({ mensaje: "Usuario no autorizado." });
        }
        if (usuario.rol !== "bibliotecario" && usuario.rol !== "administrador") {
            return res.status(403).json({ mensaje: "No tienes permisos para esta acción." });
        }
        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
}

// Middleware para validar reservas de la misma biblioteca
async function validarReservaDeBiblioteca(req, res, next) {
    if (req.usuario.rol !== "bibliotecario") return next();
    try {
        const { data: reserva } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id")
            .eq("id", req.params.id)
            .maybeSingle();

        if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada." });

        const { data: espacio } = await supabaseAdmin
            .from("espacios")
            .select("biblioteca_id")
            .eq("id", reserva.espacio_id)
            .maybeSingle();

        if (!espacio || Number(espacio.biblioteca_id) !== Number(req.usuario.biblioteca_id)) {
            return res.status(403).json({ mensaje: "No puedes realizar acciones en reservas de otra biblioteca." });
        }
        next();
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
}

// Caducar reservas vencidas de forma segura
async function caducarReservasVencidas() {
    try {
        const { data: reservas, error } = await supabaseAdmin
            .from("reservas")
            .select("id, espacio_id, fecha, hora_inicio, cantidad_estudiantes")
            .eq("estado", "activa");

        if (error || !reservas) return;

        const ahora = Date.now();
        const margen = 15 * 60 * 1000;

        for (const reserva of reservas) {
            const hora = String(reserva.hora_inicio || "").slice(0, 8);
            const horaCompleta = hora.length === 5 ? `${hora}:00` : hora;
            const inicio = new Date(`${reserva.fecha}T${horaCompleta}-05:00`).getTime();

            if (!Number.isFinite(inicio) || ahora < inicio + margen) continue;

            await supabaseAdmin
                .from("reservas")
                .update({
                    estado: "caducada",
                    finalizada_at: new Date().toISOString()
                })
                .eq("id", reserva.id)
                .eq("estado", "activa");
        }

        const { data: reservasTerminadas } = await supabaseAdmin
            .from("reservas")
            .select("id, espacio_id, fecha, hora_fin, cantidad_estudiantes")
            .eq("estado", "en progreso")
            .not("hora_fin", "is", null);

        for (const reserva of reservasTerminadas || []) {
            const fin = String(reserva.hora_fin || "").slice(0, 8);
            const finCompleto = fin.length === 5 ? `${fin}:00` : fin;
            const finReserva = new Date(`${reserva.fecha}T${finCompleto}-05:00`).getTime();

            if (!Number.isFinite(finReserva) || ahora < finReserva) continue;

            const { data: finalizada } = await supabaseAdmin
                .from("reservas")
                .update({ estado: "finalizada", finalizada_at: new Date().toISOString() })
                .eq("id", reserva.id)
                .eq("estado", "en progreso")
                .select("id")
                .maybeSingle();

            if (!finalizada) continue;

            const { data: espacioActual } = await supabaseAdmin
                .from("espacios")
                .select("sillas_ocupadas_externas")
                .eq("id", reserva.espacio_id)
                .maybeSingle();

            if (espacioActual) {
                await supabaseAdmin
                    .from("espacios")
                    .update({
                        sillas_ocupadas_externas: Math.max(
                            0,
                            Number(espacioActual.sillas_ocupadas_externas || 0) - Number(reserva.cantidad_estudiantes || 1)
                        )
                    })
                    .eq("id", reserva.espacio_id);
            }
        }
    } catch (err) {
        console.error("Aviso en caducarReservasVencidas:", err.message);
    }
}

// POST /api/reservas (Crear reserva)
router.post("/", async (req, res) => {
    try {
        await caducarReservasVencidas();

        let {
            usuario_id,
            espacio_id,
            fecha,
            hora_inicio,
            hora_fin,
            cantidad_estudiantes
        } = req.body;

        // Extraer el usuario desde el Token JWT si no viene en el body
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!usuario_id && token) {
            const { data: authData } = await supabaseAuth.auth.getUser(token);
            if (authData?.user) usuario_id = authData.user.id;
        }

        const cantidad = Number(cantidad_estudiantes || 1);
        const inicio = String(hora_inicio || "").slice(0, 5);
        const fin = String(hora_fin || "").slice(0, 5);

        if (!usuario_id || !espacio_id || !fecha || !inicio || !fin || !Number.isInteger(cantidad) || cantidad < 1) {
            return res.status(400).json({
                mensaje: "Debe indicar el espacio, la fecha, la hora de inicio, la hora de fin y una cantidad válida de estudiantes."
            });
        }

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fin)) {
            return res.status(400).json({ mensaje: "Indica un horario válido." });
        }

        if (fin <= inicio) {
            return res.status(400).json({
                mensaje: "La hora de fin debe ser posterior a la hora de inicio."
            });
        }

        const ahora = new Date();
        const inicioReserva = new Date(`${fecha}T${inicio}:00-05:00`);
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
            .select("id")
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
            .select("id, nombre, estado, biblioteca_id, capacidad, sillas_ocupadas_externas")
            .eq("id", espacio_id)
            .maybeSingle();

        if (espacioConsultaError) return res.status(500).json({ mensaje: espacioConsultaError.message });
        if (!espacio) return res.status(404).json({ mensaje: "El espacio seleccionado no existe." });

        if (espacio.estado === "mantenimiento") {
            return res.status(409).json({
                mensaje: "Este espacio está en mantenimiento. Selecciona otro."
            });
        }

        if (cantidad > Number(espacio.capacidad)) {
            return res.status(400).json({
                mensaje: "La cantidad de estudiantes supera la capacidad del espacio."
            });
        }

        const { data: biblioteca, error: bibliotecaError } = await supabaseAdmin
            .from("bibliotecas")
            .select("nombre, horario_apertura, horario_cierre, estado")
            .eq("id", espacio.biblioteca_id)
            .maybeSingle();

        if (bibliotecaError) return res.status(500).json({ mensaje: bibliotecaError.message });
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

        const apertura = String(biblioteca.horario_apertura || "").slice(0, 5);
        const cierre = String(biblioteca.horario_cierre || "").slice(0, 5);

        if (!apertura || !cierre || inicio < apertura || fin > cierre) {
            return res.status(400).json({
                mensaje: `La reserva debe estar dentro del horario de atención de la biblioteca (${apertura || "sin definir"} a ${cierre || "sin definir"}).`
            });
        }

        const { data: reservasEspacio, error: reservasEspacioError } = await supabaseAdmin
            .from("reservas")
            .select("id, hora_inicio, hora_fin, cantidad_estudiantes")
            .eq("espacio_id", espacio_id)
            .eq("fecha", fecha)
            .in("estado", ["activa", "en progreso"]);

        if (reservasEspacioError) return res.status(500).json({ mensaje: reservasEspacioError.message });

        if (!tieneCapacidadDisponible(
            espacio.capacidad,
            reservasEspacio || [],
            inicio,
            fin,
            cantidad
        )) {
            return res.status(409).json({
                mensaje: "No hay suficientes sillas disponibles en ese horario. Selecciona otro horario o reduce la cantidad de estudiantes."
            });
        }

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .insert([{
                usuario_id,
                espacio_id,
                fecha,
                hora_inicio: inicio,
                hora_fin: fin,
                cantidad_estudiantes: cantidad,
                estado: "activa"
            }])
            .select();

        if (error) return res.status(500).json({ mensaje: error.message });

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});

// GET /api/reservas (Obtener todas las reservas)
router.get("/", async (req, res) => {
    try {
        await caducarReservasVencidas();
        const { data: reservas, error } = await supabaseAdmin
            .from("reservas")
            .select("*")
            .order("id", { ascending: false });

        if (error) return res.status(500).json({ mensaje: error.message });
        if (!reservas || reservas.length === 0) return res.json([]);

        const usuarioIds = [...new Set(reservas.map((reserva) => reserva.usuario_id).filter(Boolean))];
        const espacioIds = [...new Set(reservas.map((reserva) => reserva.espacio_id))];

        let usuarios = [];
        if (usuarioIds.length) {
            const { data, error: usuariosError } = await supabaseAdmin.from("usuarios").select("id, nombre, correo").in("id", usuarioIds);
            if (usuariosError) return res.status(500).json({ mensaje: usuariosError.message });
            usuarios = data || [];
        }

        const { data: espacios, error: espaciosError } = await supabaseAdmin
            .from("espacios")
            .select("id, nombre, ubicacion")
            .in("id", espacioIds);

        if (espaciosError) return res.status(500).json({ mensaje: espaciosError.message });

        const reservasCompletas = reservas.map((reserva) => {
            const usuario = usuarios.find((u) => u.id === reserva.usuario_id);
            const espacio = espacios.find((e) => e.id === reserva.espacio_id);

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

// GET /api/reservas/:id (Obtener reserva por ID)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: reserva, error } = await supabaseAdmin
            .from("reservas")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !reserva) {
            return res.status(404).json({ mensaje: "Reserva no encontrada" });
        }

        let usuario = null;
        if (reserva.usuario_id) {
            const { data } = await supabaseAdmin.from("usuarios").select("id, nombre, correo").eq("id", reserva.usuario_id).maybeSingle();
            usuario = data;
        }

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

// GET /api/reservas/user/:usuario_id (Obtener reservas de un estudiante)
router.get("/user/:usuario_id", async (req, res) => {
    try {
        await caducarReservasVencidas();
        const { usuario_id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .select("*")
            .eq("usuario_id", usuario_id)
            .order("id", { ascending: false });

        if (error) return res.status(500).json({ mensaje: error.message });

        res.json(data || []);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// 🟢 DELETE /api/reservas/:id (CANCELAR RESERVA DESDE LA APP MÓVIL ESTUDIANTE)
router.delete("/:id", async (req, res) => {
    try {
        await caducarReservasVencidas();
        const { id } = req.params;

        const { data: reservaCompleta, error: consultaError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id, cantidad_estudiantes, estado, observacion")
            .eq("id", id)
            .maybeSingle();

        if (consultaError || !reservaCompleta) {
            return res.status(404).json({ mensaje: "Reserva no encontrada" });
        }

        if (String(reservaCompleta.observacion || "").startsWith("Reserva_Compartida")) {
            return res.status(409).json({ mensaje: "Las reservas compartidas se gestionan desde espacios compartidos." });
        }

        if (!["activa", "en progreso"].includes(reservaCompleta.estado)) {
            return res.status(409).json({ mensaje: "La reserva ya no está activa." });
        }

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({
                estado: "caducada",
                finalizada_at: new Date().toISOString()
            })
            .eq("id", id)
            .in("estado", ["activa", "en progreso"])
            .select();

        if (error) return res.status(500).json({ mensaje: error.message });

        if (reservaCompleta.estado === "en progreso") {
            const { data: espacioActual } = await supabaseAdmin
                .from("espacios")
                .select("sillas_ocupadas_externas")
                .eq("id", reservaCompleta.espacio_id)
                .maybeSingle();

            if (espacioActual) {
                await supabaseAdmin
                    .from("espacios")
                    .update({
                        sillas_ocupadas_externas: Math.max(
                            0,
                            Number(espacioActual.sillas_ocupadas_externas || 0) - Number(reservaCompleta.cantidad_estudiantes || 1)
                        )
                    })
                    .eq("id", reservaCompleta.espacio_id);
            }
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});

// PUT /api/reservas/:id (Actualizar reserva)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update(req.body)
            .eq("id", id)
            .select();

        if (error) return res.status(500).json({ mensaje: error.message });

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// PATCH /api/reservas/:id/check-in (Iniciar reserva activa - Bibliotecario)
router.patch("/:id/check-in", verificarBibliotecaBibliotecario, validarReservaDeBiblioteca, async (req, res) => {
    try {
        await caducarReservasVencidas();
        const { id } = req.params;
        const { data: reserva, error: reservaError } = await supabaseAdmin
            .from("reservas")
            .select("id, espacio_id, cantidad_estudiantes, estado, fecha, hora_inicio, hora_fin")
            .eq("id", id)
            .eq("estado", "activa")
            .maybeSingle();
        if (reservaError || !reserva) {
            return res.status(400).json({ mensaje: reservaError?.message || "La reserva no está activa o no existe." });
        }
        const horaInicio = String(reserva.hora_inicio || "").slice(0, 5);
        const horaFin = String(reserva.hora_fin || "").slice(0, 5);
        const inicioReserva = new Date(`${reserva.fecha}T${horaInicio}:00-05:00`).getTime();
        const finReserva = new Date(`${reserva.fecha}T${horaFin}:00-05:00`).getTime();
        const ahora = Date.now();
        if (!Number.isFinite(inicioReserva) || !Number.isFinite(finReserva) || ahora < inicioReserva || ahora >= finReserva) {
            return res.status(400).json({ mensaje: "solo se puede confirmar la asistencia dentro del horario establecido de la reserva" });
        }
        const { data: espacio, error: espacioError } = await supabaseAdmin
            .from("espacios")
            .select("capacidad, sillas_ocupadas_externas")
            .eq("id", reserva.espacio_id)
            .maybeSingle();
        if (espacioError || !espacio) {
            return res.status(500).json({ mensaje: espacioError?.message || "No se encontró el espacio de la reserva." });
        }
        const cantidad = Number(reserva.cantidad_estudiantes || 1);
        const sillasActuales = Number(espacio.sillas_ocupadas_externas || 0);
        if (sillasActuales + cantidad > Number(espacio.capacidad)) {
            return res.status(409).json({ mensaje: "No hay suficientes sillas disponibles para iniciar esta reserva." });
        }
        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({ estado: "en progreso" })
            .eq("id", id)
            .eq("estado", "activa")
            .select()
            .maybeSingle();
        if (error || !data) {
            return res.status(400).json({ mensaje: error?.message || "La reserva no está activa o no existe." });
        }
        const { error: sillasError } = await supabaseAdmin
            .from("espacios")
            .update({ sillas_ocupadas_externas: sillasActuales + cantidad })
            .eq("id", reserva.espacio_id);
        if (sillasError) {
            await supabaseAdmin.from("reservas").update({ estado: "activa" }).eq("id", id).eq("estado", "en progreso");
            return res.status(500).json({ mensaje: sillasError.message });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// PATCH /api/reservas/:id/cancel (Cancelar reserva - Bibliotecario)
router.patch("/:id/cancel", verificarBibliotecaBibliotecario, validarReservaDeBiblioteca, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: reservaCompleta, error: consultaError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id, cantidad_estudiantes, estado, observacion")
            .eq("id", id)
            .single();

        if (consultaError || !reservaCompleta) {
            return res.status(404).json({ mensaje: "Reserva no encontrada" });
        }

        if (String(reservaCompleta.observacion || "").startsWith("Reserva_Compartida")) {
            return res.status(409).json({ mensaje: "Las reservas compartidas se gestionan desde espacios compartidos." });
        }

        if (!["activa", "en progreso"].includes(reservaCompleta.estado)) {
            return res.status(409).json({ mensaje: "La reserva ya no está activa." });
        }

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({
                estado: "caducada",
                finalizada_at: new Date().toISOString()
            })
            .eq("id", id)
            .in("estado", ["activa", "en progreso"])
            .select();

        if (error) return res.status(500).json({ mensaje: error.message });

        if (reservaCompleta.estado === "en progreso") {
            const { data: espacioActual } = await supabaseAdmin
                .from("espacios")
                .select("sillas_ocupadas_externas")
                .eq("id", reservaCompleta.espacio_id)
                .maybeSingle();

            if (espacioActual) {
                await supabaseAdmin
                    .from("espacios")
                    .update({
                        sillas_ocupadas_externas: Math.max(
                            0,
                            Number(espacioActual.sillas_ocupadas_externas || 0) - Number(reservaCompleta.cantidad_estudiantes || 1)
                        )
                    })
                    .eq("id", reservaCompleta.espacio_id);
            }
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

// PATCH /api/reservas/:id/finish (Finalizar reserva - Bibliotecario)
router.patch("/:id/finish", verificarBibliotecaBibliotecario, validarReservaDeBiblioteca, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: reservaCompleta, error: consultaError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id, cantidad_estudiantes, estado, observacion")
            .eq("id", id)
            .single();

        if (consultaError || !reservaCompleta) {
            return res.status(404).json({ mensaje: "Reserva no encontrada" });
        }

        if (String(reservaCompleta.observacion || "").startsWith("Reserva_Compartida")) {
            return res.status(409).json({ mensaje: "Las reservas compartidas se gestionan desde espacios compartidos." });
        }

        if (!["activa", "en progreso"].includes(reservaCompleta.estado)) {
            return res.status(409).json({ mensaje: "La reserva ya no está activa." });
        }

        const { data, error } = await supabaseAdmin
            .from("reservas")
            .update({
                estado: "finalizada",
                finalizada_at: new Date().toISOString()
            })
            .eq("id", id)
            .in("estado", ["activa", "en progreso"])
            .select();

        if (error) return res.status(500).json({ mensaje: error.message });

        if (reservaCompleta.estado === "en progreso") {
            const { data: espacioActual } = await supabaseAdmin
                .from("espacios")
                .select("sillas_ocupadas_externas")
                .eq("id", reservaCompleta.espacio_id)
                .maybeSingle();

            if (espacioActual) {
                await supabaseAdmin
                    .from("espacios")
                    .update({
                        sillas_ocupadas_externas: Math.max(
                            0,
                            Number(espacioActual.sillas_ocupadas_externas || 0) - Number(reservaCompleta.cantidad_estudiantes || 1)
                        )
                    })
                    .eq("id", reservaCompleta.espacio_id);
            }
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
});

module.exports = router;