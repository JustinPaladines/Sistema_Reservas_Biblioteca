// backend/src/routes/espaciosRoutes.js:
const express = require("express");
const router = express.Router();
const { supabaseAdmin, supabaseAuth } = require("../supabaseClients");
const verificarSupabaseToken = require("../authMiddleware");

router.use(verificarSupabaseToken);

// caducar reservas que no fueron confirmadas dentro de los 15 minutos posteriores a su inicio

async function obtenerBibliotecaDelUsuario(req) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user) return null;
    const { data: usuario } = await supabaseAdmin.from("usuarios").select("rol, biblioteca_id, estado").eq("id", authData.user.id).maybeSingle();
    if (!usuario || usuario.estado !== "activo") return null;
    return usuario;
}

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

        if (!Number.isFinite(inicio) || ahora < inicio + margen) continue;

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
    try {
        await caducarReservasVencidas();

        const usuario = await obtenerBibliotecaDelUsuario(req);
        if (!usuario) return res.status(403).json({ mensaje: "Usuario no autorizado." });
        let consulta = supabaseAdmin.from("espacios").select("*").order("id", { ascending: true });
        if (usuario && usuario.rol === "bibliotecario") {
            if (!usuario.biblioteca_id) return res.status(403).json({ mensaje: "No tienes una biblioteca asignada." });
            consulta = consulta.eq("biblioteca_id", usuario.biblioteca_id);
        }
        const { data, error } = await consulta;

        if (error) {
            return res.status(500).json({ mensaje: error.message });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
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
    const usuario = await obtenerBibliotecaDelUsuario(req);
    if (!usuario || usuario.rol !== "administrador") {
        return res.status(403).json({ mensaje: "Solo el administrador puede crear espacios." });
    }

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
    try {
        await caducarReservasVencidas();
        const { id } = req.params;
        const { accion, responsable_nombre, hora_fin } = req.body;
        const usuario = await obtenerBibliotecaDelUsuario(req);
        if (!usuario || !["administrador", "bibliotecario"].includes(usuario.rol)) return res.status(403).json({ mensaje: "No tienes permisos para actualizar espacios compartidos." });

        const { data: espacio, error: espacioError } = await supabaseAdmin.from("espacios").select("id, capacidad, biblioteca_id, estado").eq("id", id).maybeSingle();
        if (espacioError || !espacio) return res.status(404).json({ mensaje: espacioError?.message || "Espacio no encontrado." });
        if (usuario.rol === "bibliotecario" && Number(espacio.biblioteca_id) !== Number(usuario.biblioteca_id)) return res.status(403).json({ mensaje: "No puedes actualizar espacios de otra biblioteca." });
        if (espacio.estado === "mantenimiento") return res.status(409).json({ mensaje: "Este espacio está en mantenimiento." });
        if (!["ocupar", "liberar"].includes(accion)) return res.status(400).json({ mensaje: "Acción no válida." });

        const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
        const parte = (tipo) => partes.find((p) => p.type === tipo)?.value || "";
        const fecha = `${parte("year")}-${parte("month")}-${parte("day")}`;
        const horaActual = `${parte("hour")}:${parte("minute")}`;

        const { data: compartidas, error: compartidasError } = await supabaseAdmin.from("reservas").select("id, cantidad_estudiantes").eq("espacio_id", Number(id)).eq("fecha", fecha).eq("estado", "en progreso").ilike("observacion", "Reserva_Compartida%").order("id", { ascending: false }).limit(1);
        if (compartidasError) return res.status(500).json({ mensaje: compartidasError.message });
        const reserva = compartidas?.[0] || null;
        const contador = (accionContador) => supabaseAdmin.rpc("actualizar_sillas_compartidas", { espacio_id_param: Number(id), accion_param: accionContador });

        if (accion === "ocupar" && reserva) {
            const { error } = await contador("ocupar");
            if (error) return res.status(error.message.includes("sillas disponibles") ? 400 : 500).json({ mensaje: error.message });
            const cantidad = Number(reserva.cantidad_estudiantes || 1);
            const { data, error: updateError } = await supabaseAdmin.from("reservas").update({ cantidad_estudiantes: cantidad + 1 }).eq("id", reserva.id).eq("estado", "en progreso").eq("cantidad_estudiantes", cantidad).select().maybeSingle();
            if (updateError || !data) {
                await contador("liberar");
                return res.status(409).json({ mensaje: updateError?.message || "La reserva compartida cambió. Actualiza e intenta nuevamente." });
            }
            return res.json(data);
        }

        if (accion === "ocupar") {
            const responsable = String(responsable_nombre || "").trim();
            const fin = String(hora_fin || "").slice(0, 5);
            if (!responsable || responsable.length > 100 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fin)) return res.status(400).json({ mensaje: "Indica el nombre del responsable y una hora de finalización válida." });
            if (fin <= horaActual) return res.status(400).json({ mensaje: "La hora de finalización debe ser posterior a la hora actual." });

            const { data: biblioteca, error: bibliotecaError } = await supabaseAdmin.from("bibliotecas").select("horario_apertura, horario_cierre").eq("id", espacio.biblioteca_id).maybeSingle();
            if (bibliotecaError || !biblioteca) return res.status(500).json({ mensaje: bibliotecaError?.message || "No se encontró la biblioteca del espacio." });
            const apertura = String(biblioteca.horario_apertura || "").slice(0, 5);
            const cierre = String(biblioteca.horario_cierre || "").slice(0, 5);
            if (!apertura || !cierre || horaActual < apertura || fin > cierre) return res.status(400).json({ mensaje: "El horario compartido debe estar dentro del horario de atención de la biblioteca." });

            const { data: existentes, error: existentesError } = await supabaseAdmin.from("reservas").select("hora_inicio, hora_fin").eq("espacio_id", Number(id)).eq("fecha", fecha).in("estado", ["activa", "en progreso"]);
            if (existentesError) return res.status(500).json({ mensaje: existentesError.message });
            const cruce = (existentes || []).some((r) => {
                const inicioExistente = String(r.hora_inicio || "").slice(0, 5);
                const finExistente = String(r.hora_fin || "").slice(0, 5);
                return !finExistente || (horaActual < finExistente && fin > inicioExistente);
            });
            if (cruce) return res.status(409).json({ mensaje: "El espacio tiene una reserva que coincide con ese horario." });

            const { data: nueva, error: crearError } = await supabaseAdmin.from("reservas").insert([{
                usuario_id: null, espacio_id: Number(id), fecha, hora_inicio: horaActual, hora_fin: fin,
                cantidad_estudiantes: 1, estado: "en progreso", observacion: `Reserva_Compartida | Responsable: ${responsable}`
            }]).select().single();
            if (crearError) return res.status(500).json({ mensaje: crearError.message });
            const { error: ocuparError } = await contador("ocupar");
            if (ocuparError) {
                await supabaseAdmin.from("reservas").delete().eq("id", nueva.id);
                return res.status(ocuparError.message.includes("sillas disponibles") ? 400 : 500).json({ mensaje: ocuparError.message });
            }
            return res.status(201).json(nueva);
        }

        if (!reserva) {
            const { data, error } = await contador("liberar");
            if (error) return res.status(error.message.includes("sillas ocupadas") ? 400 : 500).json({ mensaje: error.message });
            return res.json(Array.isArray(data) ? data[0] : data);
        }

        const cantidad = Number(reserva.cantidad_estudiantes || 1);
        const { error: liberarError } = await contador("liberar");
        if (liberarError) return res.status(500).json({ mensaje: liberarError.message });
        const cambios = cantidad <= 1 ? { estado: "finalizada", finalizada_at: new Date().toISOString() } : { cantidad_estudiantes: cantidad - 1 };
        const { data, error: updateError } = await supabaseAdmin.from("reservas").update(cambios).eq("id", reserva.id).eq("estado", "en progreso").eq("cantidad_estudiantes", cantidad).select().maybeSingle();
        if (updateError || !data) {
            await contador("ocupar");
            return res.status(409).json({ mensaje: updateError?.message || "La reserva compartida cambió. Actualiza e intenta nuevamente." });
        }
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const usuario = await obtenerBibliotecaDelUsuario(req);
    if (!usuario || !["administrador", "bibliotecario"].includes(usuario.rol)) {
        return res.status(403).json({ mensaje: "No tienes permisos para actualizar espacios." });
    }
    let consulta = supabaseAdmin.from("espacios").update(req.body).eq("id", id);

    if (usuario && usuario.rol === "bibliotecario") {
        consulta = consulta.eq("biblioteca_id", usuario.biblioteca_id);
    }

    const { data, error } = await consulta.select();

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.json(data);
});

router.delete("/:id", async (req, res) => {
    const usuario = await obtenerBibliotecaDelUsuario(req);
    if (!usuario || usuario.rol !== "administrador") {
        return res.status(403).json({ mensaje: "Solo el administrador puede eliminar espacios." });
    }

    const { id } = req.params;
    const { error } = await supabaseAdmin
        .from("espacios")
        .delete()
        .eq("id", id);

    if (error) {
        return res.status(500).json({ mensaje: error.message });
    }

    res.json({ mensaje: "Espacio eliminado correctamente" });
});

module.exports = router;