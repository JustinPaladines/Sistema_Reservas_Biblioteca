# Firebase Login Fullstack

Arquitectura:

```text
React/Vite -> Express -> Firebase Admin -> Firebase Auth / Firestore
```

## Configuración Firebase

1. Crear proyecto en Firebase Console.
2. Habilitar Authentication -> Sign-in method -> Email/Password.
3. Crear Firestore Database.
4. Ir a Project settings -> Service accounts -> Generate new private key.
5. Guardar el JSON como `backend/serviceAccountKey.json`.
6. Copiar `backend/.env.example` como `backend/.env`.
7. Copiar `frontend/.env.example` como `frontend/.env` y llenar los datos de Firebase Web App.

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
