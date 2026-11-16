const { supabaseAdmin } = require("../supabaseClients");

async function caducarReservasVencidas() {
    const { data: reservas, error } = await supabaseAdmin.from("reservas").select("id, espacio_id, fecha, hora_inicio").eq("estado", "activa");
    if (error) throw error;
    if (!reservas?.length) return;

    const ids = [...new Set(reservas.map((r) => r.espacio_id))];
    const { data: espacios, error: espaciosError } = await supabaseAdmin.from("espacios").select("id, biblioteca_id").in("id", ids);
    if (espaciosError) throw espaciosError;

    const bibliotecaIds = [...new Set((espacios || []).map((e) => e.biblioteca_id))];
    const { data: parametros, error: parametrosError } = await supabaseAdmin.from("parametros_biblioteca").select("biblioteca_id, minutos_caducidad_reserva").in("biblioteca_id", bibliotecaIds);
    if (parametrosError) throw parametrosError;

    const porEspacio = new Map((espacios || []).map((e) => [Number(e.id), e]));
    const porBiblioteca = new Map((parametros || []).map((p) => [Number(p.biblioteca_id), p]));
    const ahora = Date.now();

    for (const reserva of reservas) {
        const espacio = porEspacio.get(Number(reserva.espacio_id));
        const config = espacio ? porBiblioteca.get(Number(espacio.biblioteca_id)) : null;
        const minutos = Number(config?.minutos_caducidad_reserva ?? 15);
        const hora = String(reserva.hora_inicio || "").slice(0, 8);
        const completa = hora.length === 5 ? `${hora}:00` : hora;
        const inicio = new Date(`${reserva.fecha}T${completa}-05:00`).getTime();
        if (!Number.isFinite(inicio) || ahora < inicio + minutos * 60000) continue;

        const { data: actualizada, error: updateError } = await supabaseAdmin.from("reservas")
            .update({ estado: "caducada", finalizada_at: new Date().toISOString() })
            .eq("id", reserva.id).eq("estado", "activa").select("id").maybeSingle();
        if (updateError) throw updateError;
        if (!actualizada) continue;

        const { data: restantes, error: restantesError } = await supabaseAdmin.from("reservas")
            .select("id").eq("espacio_id", reserva.espacio_id)
            .in("estado", ["activa", "en progreso"]).limit(1);
        if (restantesError) throw restantesError;
        if (!restantes?.length) {
            const { error: liberarError } = await supabaseAdmin.from("espacios")
                .update({ estado: "disponible" }).eq("id", reserva.espacio_id).neq("estado", "mantenimiento");
            if (liberarError) throw liberarError;
        }
    }
}
module.exports = caducarReservasVencidas;
