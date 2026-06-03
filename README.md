# Sistema de Gestión de Espacios de Biblioteca

## Integrantes

- Justin Paladines
- Josselyn Reyes

---

# Historias de Usuario

## Formato de Historia de Usuario

### Historia de Usuario

**ID:** 0001

**Usuario:** Estudiante

**Nombre de la Historia:** 

**Prioridad para el negocio:** Media

**Riesgo para desarrollo:** Baja

**Desarrollador responsable:** Pendiente

### Descripción

**Como:** Estudiante

**Quiero:** visualizar mi información personal

**Para:** verificar que mis datos sean correctos y tener acceso a las funcionalidades correspondientes.

### Alcance

1. Formulario de registro 
2. Campo "Nombre" 
3. Campo "Username" 
4. Campo "Correo Electrónico" 
5. Campo "Contraseña" 
6. Botón "Registrarse" 
7. Mensaje de confirmación de registro

### Observaciones

1. El correo electrónico debe ser único. 
2. El username debe ser único dentro del sistema. 
3. La contraseña debe cumplir las políticas mínimas de seguridad establecidas. 
4. El rol será asignado automáticamente como Estudiante. 
5. El usuario deberá confirmar su cuenta mediante correo electrónico antes de acceder al sistema. 

### Criterios de Aceptación

1. No se permitirá registrar usuarios con campos obligatorios vacíos. 
2. No se permitirá registrar usuarios con correos ya existentes. 
3. No se permitirá registrar usuarios con usernames ya existentes. 
4. Se mostrará un mensaje de error indicando el motivo del fallo. 
5. Se mostrará un mensaje de confirmación cuando el registro se complete exitosamente. 

# Rutas (Endpoints) ejemplo:


## Autenticación

| Método | Endpoint | Descripción |
|----------|----------|----------|
| POST | /api/auth/register | Registro de usuario |
| POST | /api/auth/login | Inicio de sesión |
| POST | /api/auth/logout | Cierre de sesión |
| POST | /api/auth/forgot-password | Recuperar contraseña |
| POST | /api/auth/reset-password | Restablecer contraseña |

<img width="441" height="349" alt="image" src="https://github.com/user-attachments/assets/e114bec0-b4cd-4a75-b16f-efd8daf58339" />

---

## Usuarios

| Método | Endpoint | Descripción |
|----------|----------|----------|
| GET | /api/users/profile | Obtener perfil |
| PUT | /api/users/profile | Actualizar perfil |

<img width="441" height="334" alt="image" src="https://github.com/user-attachments/assets/c8357ee3-27d4-4cb0-8d1c-3c182f4ea659" />


---

## Reservas

| Método | Endpoint | Descripción |
|----------|----------|----------|
| POST | /api/reservations | Crear reserva |
| PATCH | /api/reservations/:id/cancel | Cancelar reserva |
| PATCH | /api/reservations/:id/finish | Finalizar reserva |

<img width="548" height="340" alt="image" src="https://github.com/user-attachments/assets/4d1a8d05-3ced-4a6d-9eda-822b0d621801" />

