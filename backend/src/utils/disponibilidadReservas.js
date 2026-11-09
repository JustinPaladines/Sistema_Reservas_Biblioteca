function convertirHoraAMinutos(hora) {
    const valor = String(hora || "").slice(0, 5);
    if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(valor)) return null;
    const [horas, minutos] = valor.split(":").map(Number);
    return horas * 60 + minutos;
}

function calcularOcupacionMaxima(reservas, horaInicio, horaFin) {
    const inicio = convertirHoraAMinutos(horaInicio);
    const fin = convertirHoraAMinutos(horaFin);
    if (inicio === null || fin === null || fin <= inicio) return Infinity;

    const intervalos = (reservas || []).map((reserva) => {
        const desde = convertirHoraAMinutos(reserva.hora_inicio);
        const hasta = reserva.hora_fin
            ? convertirHoraAMinutos(reserva.hora_fin)
            : 1440;

        if (desde === null || hasta === null || hasta <= desde) return null;
        return {
            inicio: desde,
            fin: hasta,
            cantidad: Math.max(1, Number(reserva.cantidad_estudiantes) || 1)
        };
    }).filter(Boolean);

    const puntos = new Set([inicio, fin]);
    for (const intervalo of intervalos) {
        if (intervalo.inicio < fin && intervalo.fin > inicio) {
            puntos.add(Math.max(inicio, intervalo.inicio));
            puntos.add(Math.min(fin, intervalo.fin));
        }
    }

    const limites = [...puntos].sort((a, b) => a - b);
    let ocupacionMaxima = 0;

    for (let i = 0; i < limites.length - 1; i++) {
        const tramoInicio = limites[i];
        const tramoFin = limites[i + 1];
        if (tramoFin <= tramoInicio) continue;

        const ocupacion = intervalos.reduce((total, intervalo) => {
            return intervalo.inicio < tramoFin && intervalo.fin > tramoInicio
                ? total + intervalo.cantidad
                : total;
        }, 0);

        ocupacionMaxima = Math.max(ocupacionMaxima, ocupacion);
    }

    return ocupacionMaxima;
}

function tieneCapacidadDisponible(capacidad, reservas, horaInicio, horaFin, cantidad = 1) {
    const limite = Number(capacidad);
    const solicitadas = Number(cantidad);
    if (!Number.isInteger(limite) || limite < 1 || !Number.isInteger(solicitadas) || solicitadas < 1) {
        return false;
    }

    return calcularOcupacionMaxima(reservas, horaInicio, horaFin) + solicitadas <= limite;
}

module.exports = {
    calcularOcupacionMaxima,
    tieneCapacidadDisponible
};
