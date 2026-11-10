// backend/src/routes/espaciosRoutes.js:
const express = require("express");
const router = express.Router();
const { supabaseAdmin, supabaseAuth } = require("../supabaseClients");
const { calcularOcupacionMaxima, tieneCapacidadDisponible } = require("../utils/disponibilidadReservas");
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

        if (tieneHorario && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fin))) {
            return res.status(400).json({ mensaje: "Indica un horario válido." });
        }

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

        const cantidadSolicitada = Number(req.query.cantidad_estudiantes || 1);
        if (!Number.isInteger(cantidadSolicitada) || cantidadSolicitada < 1) {
            return res.status(400).json({ mensaje: "La cantidad de estudiantes no es válida." });
        }

        const { data: reservas, error: reservasError } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id, hora_inicio, hora_fin, cantidad_estudiantes")
            .eq("fecha", fecha)
            .in("estado", ["activa", "en progreso"]);

        if (reservasError) {
            return res.status(500).json({ mensaje: reservasError.message });
        }

        const espaciosConDisponibilidad = (espacios || []).map((espacio) => {
            const reservasEspacio = (reservas || []).filter(
                (reserva) => Number(reserva.espacio_id) === Number(espacio.id)
            );
            const ocupacion = calcularOcupacionMaxima(
                reservasEspacio,
                inicio,
                fin
            );

            const sillasExternas = Number(
                espacio.sillas_ocupadas_externas || 0
            );

            const sillasDisponibles = Math.max(
                0,
                Number(espacio.capacidad || 0) - ocupacion - sillasExternas
            );

            return {
                ...espacio,
                sillas_ocupadas_horario: ocupacion,
                sillas_disponibles: sillasDisponibles
            };
        });

        return res.json(
            espaciosConDisponibilidad.filter(
                (espacio) => espacio.sillas_disponibles >= cantidadSolicitada
            )
        );
    } catch (error) {
        return res.status(500).json({ mensaje: error.message });
    }
});


//recomendacion de espacios
router.get("/recomendaciones", async (req, res) => {
    try {
        // 1. Actualizar estados de reservas caducadas antes de procesar
        if (typeof caducarReservasVencidas === "function") {
            await caducarReservasVencidas();
        }

        const { biblioteca_id, fecha } = req.query;

        // 2. Determinar la fecha de consulta (Hoy por defecto en formato YYYY-MM-DD)
        const hoyStr = new Date().toISOString().split("T")[0];
        const fechaObjetivo = fecha || hoyStr;

        // 3. Consultar bibliotecas activas
        let queryBiblio = supabaseAdmin
            .from("bibliotecas")
            .select("id, nombre, horario_apertura, horario_cierre, estado");

        if (biblioteca_id) {
            queryBiblio = queryBiblio.eq("id", biblioteca_id);
        }

        const { data: bibliotecas, error: errorBiblio } = await queryBiblio;

        if (errorBiblio || !bibliotecas || bibliotecas.length === 0) {
            return res.status(404).json({
                disponible: false,
                mensaje: "No se encontraron bibliotecas disponibles."
            });
        }

        // Seleccionar la biblioteca objetivo (la especificada o la primera activa)
        const biblioElegida = bibliotecas[0];
        const apertura = Number(String(biblioElegida.horario_apertura || "08:00").slice(0, 2));
        const cierre = Number(String(biblioElegida.horario_cierre || "17:00").slice(0, 2));

        // 4. Control de horario si la reserva es para EL DÍA DE HOY
        let horaInicioBusqueda = apertura;
        if (fechaObjetivo === hoyStr) {
            // Obtener hora actual en zona horaria local (Ecuador GMT-5)
            const horaActualLocal = new Date().toLocaleTimeString("en-US", {
                timeZone: "America/Guayaquil",
                hour12: false,
                hour: "2-digit"
            });
            const horaActualInt = parseInt(horaActualLocal, 10);

            // Iniciar búsqueda a partir de la siguiente hora disponible
            horaInicioBusqueda = Math.max(apertura, horaActualInt + 1);
        }

        // Validar si la biblioteca ya cerró por el día de hoy
        if (horaInicioBusqueda >= cierre) {
            return res.status(200).json({
                disponible: false,
                mensaje: "La biblioteca se encuentra cerrada para el resto del día de hoy."
            });
        }

        // 5. Obtener los espacios habilitados de la biblioteca
        const { data: espacios, error: errorEspacios } = await supabaseAdmin
            .from("espacios")
            .select("id, nombre, descripcion, capacidad, ubicacion, sillas_ocupadas_externas")
            .eq("biblioteca_id", biblioElegida.id)
            .neq("estado", "mantenimiento");

        if (errorEspacios || !espacios || espacios.length === 0) {
            return res.status(404).json({
                disponible: false,
                mensaje: "No hay espacios disponibles en la biblioteca seleccionada."
            });
        }

        // 6. Obtener las reservas activas en la fecha solicitada para evaluar ocupación
        const espacioIds = espacios.map((e) => e.id);
        const { data: reservas, error: errorReservas } = await supabaseAdmin
            .from("reservas")
            .select("espacio_id, hora_inicio, hora_fin, cantidad_estudiantes")
            .in("espacio_id", espacioIds)
            .eq("fecha", fechaObjetivo)
            .in("estado", ["activa", "en progreso"]);

        if (errorReservas) throw errorReservas;

        // 7. Algoritmo de selección: Encontrar la franja con mayor número de lugares libres
        let mejorEspacio = null;
        let mejorHora = horaInicioBusqueda;
        let mayorLugaresLibres = -1;

        for (let h = horaInicioBusqueda; h < cierre; h++) {
            const horaStr = String(h).padStart(2, "0") + ":00";
            const horaFinStr = String(h + 1).padStart(2, "0") + ":00";

            for (const esp of espacios) {
                // Sumar los cupos ocupados en esta franja horaria específica
                const ocupadosEnHora = (reservas || [])
                    .filter((r) => r.espacio_id === esp.id)
                    .filter((r) => {
                        const rInicio = String(r.hora_inicio || "").slice(0, 5);
                        const rFin = String(r.hora_fin || "").slice(0, 5);
                        return horaStr < rFin && horaFinStr > rInicio;
                    })
                    .reduce((sum, r) => sum + Number(r.cantidad_estudiantes || 1), 0);

                const sillasExternas = Number(esp.sillas_ocupadas_externas || 0);
                const libres = Math.max(0, Number(esp.capacidad) - ocupadosEnHora - sillasExternas);

                if (libres > mayorLugaresLibres) {
                    mayorLugaresLibres = libres;
                    mejorEspacio = esp;
                    mejorHora = h;
                }
            }
        }

        // Si no hay cupos libres en ninguna franja horaria
        if (!mejorEspacio || mayorLugaresLibres <= 0) {
            return res.status(200).json({
                disponible: false,
                mensaje: "No hay espacios con disponibilidad suficiente para la fecha seleccionada."
            });
        }

        const horaInicioRec = String(mejorHora).padStart(2, "0") + ":00";
        const horaFinRec = String(mejorHora + 1).padStart(2, "0") + ":00";

        // 8. Respuesta estructurada para Android (mapea directamente con RecommendationDto)
        return res.json({
            disponible: true,
            biblioteca_id: biblioElegida.id,
            biblioteca_nombre: biblioElegida.nombre,
            espacio_id: mejorEspacio.id,
            espacio_nombre: mejorEspacio.nombre,
            espacio_descripcion: mejorEspacio.descripcion,
            fecha: fechaObjetivo,
            hora_inicio: horaInicioRec,
            hora_fin: horaFinRec,
            disponibles: mayorLugaresLibres,
            capacidad: mejorEspacio.capacidad,
            mensaje: `Te sugerimos ${mejorEspacio.nombre} a las ${horaInicioRec} (${mayorLugaresLibres} lugar(es) disponible(s)).`
        });

    } catch (error) {
        console.error("Error en /api/espacios/recomendaciones:", error);
        return res.status(500).json({
            disponible: false,
            mensaje: "Error interno al calcular la recomendación.",
            error: error.message
        });
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

        const { data: compartidas, error: compartidasError } = await supabaseAdmin.from("reservas").select("id, cantidad_estudiantes, hora_inicio, hora_fin").eq("espacio_id", Number(id)).eq("fecha", fecha).eq("estado", "en progreso").ilike("observacion", "Reserva_Compartida%").order("id", { ascending: false }).limit(1);
        if (compartidasError) return res.status(500).json({ mensaje: compartidasError.message });
        const reserva = compartidas?.[0] || null;
        const contador = (accionContador) => supabaseAdmin.rpc("actualizar_sillas_compartidas", { espacio_id_param: Number(id), accion_param: accionContador });

        if (accion === "ocupar" && reserva) {
            const { data: reservasActuales, error: reservasActualesError } = await supabaseAdmin
                .from("reservas")
                .select("hora_inicio, hora_fin, cantidad_estudiantes")
                .eq("espacio_id", Number(id))
                .eq("fecha", fecha)
                .in("estado", ["activa", "en progreso"]);

            if (reservasActualesError) return res.status(500).json({ mensaje: reservasActualesError.message });
            const finReservaCompartida = String(reserva.hora_fin || "").slice(0, 5);
            if (!tieneCapacidadDisponible(
                espacio.capacidad,
                reservasActuales || [],
                horaActual,
                finReservaCompartida,
                1
            )) {
                return res.status(409).json({ mensaje: "No hay suficientes sillas disponibles para ampliar la ocupación compartida." });
            }

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

            const { data: existentes, error: existentesError } = await supabaseAdmin.from("reservas").select("hora_inicio, hora_fin, cantidad_estudiantes").eq("espacio_id", Number(id)).eq("fecha", fecha).in("estado", ["activa", "en progreso"]);
            if (existentesError) return res.status(500).json({ mensaje: existentesError.message });
            if (!tieneCapacidadDisponible(espacio.capacidad, existentes || [], horaActual, fin, 1)) {
                return res.status(409).json({ mensaje: "No hay suficientes sillas disponibles en ese horario para la ocupación compartida." });
            }

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