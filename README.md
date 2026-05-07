Tarea Autenticación Firebase y Supabase

Paladines Justin, Reyes Paladines


Firebase 
 <img width="936" height="123" alt="image" src="https://github.com/user-attachments/assets/1dd75b60-f1c8-4827-a9ec-87e6e5db82f5" />

 
Supabase  
  <img width="944" height="528" alt="image" src="https://github.com/user-attachments/assets/0ad83358-9d33-4c9b-9deb-5bf3c836dc6d" />




# Login Fullstack con Firebase y Supabase

Este ZIP contiene dos ejercicios completos para clase:

1. `firebase-login-fullstack`: React/Vite + Express + Firebase Auth + Firestore.
2. `supabase-login-fullstack`: React/Vite + Express + Supabase Auth + PostgreSQL.

Cada proyecto tiene:

- `frontend/`: formulario de email y clave, registro, login, logout y CRUD de productos protegido.
- `backend/`: API Express con validación de token y CRUD.
- `.env.example`: plantilla de variables de entorno.

## Requisitos

- Node.js 18 o superior.
- Proyecto creado en Firebase o Supabase.
- En Firebase: habilitar Authentication con Email/Password y crear Firestore.
- En Supabase: habilitar Auth Email/Password y ejecutar el SQL incluido en `supabase-login-fullstack/backend/schema.sql`.

## Ejecución rápida

Abre dos terminales por proyecto.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Luego abre:

```text
http://localhost:5173
```

## Importante

Los archivos `.env` reales no se incluyen por seguridad. Debes copiarlos desde `.env.example` y llenar tus credenciales.
