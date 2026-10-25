-- guarda la cantidad de estudiantes por reserva
ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS cantidad_estudiantes integer NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_reservas_cantidad_estudiantes'
    ) THEN
        ALTER TABLE public.reservas
        ADD CONSTRAINT chk_reservas_cantidad_estudiantes
        CHECK (cantidad_estudiantes > 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reservas_espacio_fecha_horario
ON public.reservas (espacio_id, fecha, hora_inicio, hora_fin)
WHERE estado IN ('activa', 'en progreso');
