# Tarea Autenticación Firebase y Supabase

Paladines Justin, Reyes Paladines


Firebase 
 <img width="936" height="123" alt="image" src="https://github.com/user-attachments/assets/1dd75b60-f1c8-4827-a9ec-87e6e5db82f5" />

 <img width="941" height="158" alt="image" src="https://github.com/user-attachments/assets/71574f60-f0bd-470b-9b75-d67d59364e55" />

 <img width="941" height="723" alt="image" src="https://github.com/user-attachments/assets/5076f857-8c32-4ae8-9c6c-7b2a8c303d80" />



 
Supabase  
  <img width="832" height="518" alt="image" src="https://github.com/user-attachments/assets/2045cc02-4a5c-4a46-9744-e658302f1564" />

  <img width="944" height="528" alt="image" src="https://github.com/user-attachments/assets/629a7cbf-8bb5-4a60-ae0f-2192b764c138" />




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
