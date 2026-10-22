-- agregar el conteo de sillas ocupadas temporalmente por personas externas
ALTER TABLE espacios
ADD COLUMN IF NOT EXISTS sillas_ocupadas_externas INTEGER NOT NULL DEFAULT 0;

-- asegurar que el conteo no pueda ser negativo
ALTER TABLE espacios
ADD CONSTRAINT espacios_sillas_ocupadas_externas_no_negativas
CHECK (sillas_ocupadas_externas >= 0);