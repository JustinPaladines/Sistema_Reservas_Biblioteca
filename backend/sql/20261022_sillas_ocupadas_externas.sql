ALTER TABLE public.espacios
ADD COLUMN IF NOT EXISTS sillas_ocupadas_externas integer NOT NULL DEFAULT 0
CHECK (sillas_ocupadas_externas >= 0);

CREATE OR REPLACE FUNCTION public.actualizar_sillas_compartidas(
    espacio_id_param bigint,
    accion_param text
)
RETURNS SETOF public.espacios
LANGUAGE plpgsql
AS $$
DECLARE
    espacio_actual public.espacios%ROWTYPE;
BEGIN
    IF accion_param = 'ocupar' THEN
        UPDATE public.espacios
        SET sillas_ocupadas_externas = sillas_ocupadas_externas + 1
        WHERE id = espacio_id_param
          AND sillas_ocupadas_externas < capacidad
        RETURNING * INTO espacio_actual;

        IF FOUND THEN
            RETURN NEXT espacio_actual;
            RETURN;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.espacios WHERE id = espacio_id_param
        ) THEN
            RAISE EXCEPTION 'Espacio no encontrado';
        END IF;

        RAISE EXCEPTION 'No quedan sillas disponibles';
    ELSIF accion_param = 'liberar' THEN
        UPDATE public.espacios
        SET sillas_ocupadas_externas = sillas_ocupadas_externas - 1
        WHERE id = espacio_id_param
          AND sillas_ocupadas_externas > 0
        RETURNING * INTO espacio_actual;

        IF FOUND THEN
            RETURN NEXT espacio_actual;
            RETURN;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.espacios WHERE id = espacio_id_param
        ) THEN
            RAISE EXCEPTION 'Espacio no encontrado';
        END IF;

        RAISE EXCEPTION 'No hay sillas ocupadas para liberar';
    ELSE
        RAISE EXCEPTION 'Acción no válida';
    END IF;
END;
$$;
