-- Evita reservas vigentes duplicadas por espacio o por usuario.
-- Ejecutar en Supabase SQL Editor antes de probar el backend actualizado.
-- Si existen duplicados activos antiguos, corregirlos antes de crear estos índices.
CREATE UNIQUE INDEX IF NOT EXISTS reservas_unica_activa_por_espacio ON public.reservas (espacio_id) WHERE estado IN ('activa', 'en progreso');
CREATE UNIQUE INDEX IF NOT EXISTS reservas_unica_activa_por_usuario ON public.reservas (usuario_id) WHERE estado IN ('activa', 'en progreso');
CREATE INDEX IF NOT EXISTS reservas_estado_fecha_idx ON public.reservas (estado, fecha);
