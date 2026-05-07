# Supabase Login Fullstack

Arquitectura:

```text
React/Vite -> Supabase Auth -> Express -> Supabase PostgreSQL
```

## Configuración Supabase

1. Crear proyecto en Supabase.
2. Revisar Authentication -> Providers -> Email.
3. Ejecutar `backend/schema.sql` en SQL Editor.
4. Copiar `backend/.env.example` como `backend/.env`.
5. Copiar `frontend/.env.example` como `frontend/.env`.
6. Llenar `SUPABASE_URL`, `SUPABASE_ANON_KEY` y, en backend, `SUPABASE_SERVICE_ROLE_KEY`.

## Ejecutar

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
