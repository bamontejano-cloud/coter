# Implementation Plan: Coterapeuta App

## Overview

Implementación incremental de la plataforma web Coterapeuta: SPA en React 18 + TypeScript (frontend) y API REST en Express 4 + TypeScript (backend), con PostgreSQL vía Prisma ORM. El plan sigue el orden natural de dependencias: infraestructura → autenticación → pacientes e invitaciones → biblioteca de técnicas → asignaciones → registros → mensajería → notificaciones → integración de UI.

---

## Tasks

- [x] 1. Infraestructura del proyecto y modelos de datos
  - [x] 1.1 Inicializar monorepo con workspaces (apps/api, apps/web, packages/shared)
    - Crear `package.json` raíz con workspaces
    - Configurar `tsconfig.json` base y referencias de proyecto
    - Instalar dependencias: Express, Prisma, Zod, jsonwebtoken, bcrypt (backend); React, React Router v6, Zustand, TanStack Query v5 (frontend); Vitest, fast-check (testing)
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 Definir esquema Prisma completo y generar cliente
    - Escribir `schema.prisma` con modelos: `User`, `Invitation`, `TherapistPatient`, `Technique`, `Assignment`, `Record`, `Conversation`, `Message`, `Notification` y enums `Role`, `AssignmentStatus`, `NotificationType`
    - Ejecutar `prisma migrate dev` para la base de datos de desarrollo
    - Configurar `prisma.ts` singleton de `PrismaClient` en `src/lib/`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_
  - [x] 1.3 Configurar servidor Express base y middleware globales
    - Crear `app.ts` con CORS (`ALLOWED_ORIGIN`), JSON body parser y health-check route
    - Crear `server.ts` que levanta el servidor en el puerto configurado
    - Implementar error handler global que devuelve `ApiError { error, message }` y maneja `AppError`
    - _Requirements: 7.1_

- [x] 2. Autenticación y gestión de sesión
  - [x] 2.1 Implementar helpers JWT y módulo de autenticación (backend)
    - Crear `lib/jwt.ts` con `signToken(payload)` (exp 8h, HS256, `JWT_SECRET`) y `verifyToken(token)`
    - Crear `middleware/authenticate.ts` que extrae el JWT del header `Authorization: Bearer`, llama a `verifyToken` y adjunta `req.user`; devuelve 401 si falla
    - Crear `middleware/requireRole.ts` que verifica `req.user.role` y devuelve 403 si no corresponde
    - _Requirements: 1.4, 1.7, 7.1, 7.2, 7.5_
  - [x] 2.2 Property test 3: JWT emitido contiene expiración de 8 horas
    - **Property 3: JWT emitido contiene expiración de 8 horas**
    - **Validates: Requirements 1.4**
  - [x] 2.3 Property test 5: Rechazo de requests sin token válido
    - **Property 5: Rechazo de requests sin token válido a rutas protegidas**
    - **Validates: Requirements 1.7, 7.5**
  - [x] 2.4 Implementar `auth.service.ts` y `auth.router.ts`
    - Crear Zod schemas en `auth.schema.ts` para `RegisterBody` y `LoginBody`
    - `register`: hashear contraseña con bcrypt cost 12, crear `User`, emitir JWT; lanzar `AppError(409)` si email duplicado
    - `login`: verificar email+contraseña, emitir JWT; lanzar `AppError(401)` si no coincide
    - `logout`: ruta POST `/auth/logout` protegida que devuelve 204 (token stateless; el cliente lo descarta)
    - Montar router en `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 2.5 Property test 1: Registro de usuario y hash de contraseña
    - **Property 1: Registro de usuario y hash de contraseña**
    - **Validates: Requirements 1.2**
  - [x] 2.6 Property test 2: Unicidad de email — rechazo de duplicados
    - **Property 2: Unicidad de email — rechazo de duplicados**
    - **Validates: Requirements 1.3**
  - [x] 2.7 Property test 4: Rechazo de credenciales incorrectas
    - **Property 4: Rechazo de credenciales incorrectas**
    - **Validates: Requirements 1.5**
  - [x] 2.8 Implementar páginas de autenticación (frontend)
    - Crear `AuthStore` (Zustand) con `user`, `token`, `login()`, `logout()`
    - Implementar `LoginPage` con formulario email+contraseña; al éxito persistir token y navegar al dashboard
    - Implementar `RegisterPage` con campos: nombre, email, contraseña, rol therapist (registro directo)
    - Implementar componente `ProtectedRoute` que verifica `AuthStore.token` y redirige a `/login` si no hay sesión
    - _Requirements: 1.1, 1.4, 1.6, 7.4_

- [x] 3. Checkpoint — autenticación base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Gestión de invitaciones y pacientes
  - [x] 4.1 Implementar `lib/crypto.ts` y módulo de invitaciones (backend)
    - Crear `generateInvitationCode()` que emite un UUID v4 único
    - Implementar `invitation.service.ts`: `create` (genera código, exp 72h, vincula a therapistId), `validate` (verifica no usado y no expirado), `use` (marca `usedAt`)
    - Implementar `invitation.router.ts`: `POST /invitations` (therapist only), `GET /invitations/:code/validate` (público)
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 4.2 Property test 6: Unicidad de códigos de invitación
    - **Property 6: Unicidad de códigos de invitación**
    - **Validates: Requirements 2.1**
  - [x] 4.3 Property test 8: Invitación de un solo uso
    - **Property 8: Invitación de un solo uso**
    - **Validates: Requirements 2.3**
  - [x] 4.4 Extender `auth.service.ts` para registro con invitación
    - En `POST /auth/register` con `invitationCode`: verificar invitación, crear `User` con rol `patient`, crear registro `TherapistPatient`, marcar invitación como usada — todo en una transacción Prisma
    - Registrar `RegisterWithInvitationPage` en el frontend (`/register/:token`) que lee el código de la URL y llama al endpoint con `invitationCode`
    - _Requirements: 2.2, 2.3_
  - [x] 4.5 Property test 7: Registro con invitación vincula correctamente al paciente
    - **Property 7: Registro con invitación vincula correctamente al paciente**
    - **Validates: Requirements 2.2**
  - [x] 4.6 Implementar `patient.service.ts` y `patient.router.ts`
    - `listPatients(therapistId)`: devuelve `PatientSummary[]` de pacientes vinculados
    - `getPatientProfile(therapistId, patientId)`: verifica vínculo (403 si no existe), devuelve perfil con `assignments` y `messagesSummary`
    - Montar router en `GET /patients` y `GET /patients/:id` (ambos therapist only)
    - _Requirements: 2.4, 2.5, 2.6_
  - [x] 4.7 Property test 9: Lista de pacientes es completa y contiene solo los vinculados
    - **Property 9: Lista de pacientes es completa y contiene solo los vinculados**
    - **Validates: Requirements 2.4, 2.6**
  - [x] 4.8 Property test 10: Aislamiento cross-therapist
    - **Property 10: Aislamiento cross-therapist — acceso denegado a pacientes ajenos**
    - **Validates: Requirements 2.6, 7.3**
  - [x] 4.9 Implementar páginas de gestión de pacientes (frontend)
    - Crear `PatientsListPage`: lista pacientes con nombre, email, fecha de vinculación; botón "Generar invitación" que llama a `POST /invitations` y muestra el código
    - Crear `PatientProfilePage`: muestra historial de asignaciones, registros y resumen de mensajes del paciente seleccionado
    - _Requirements: 2.4, 2.5_

- [x] 5. Biblioteca de técnicas
  - [x] 5.1 Implementar `technique.service.ts` y `technique.router.ts`
    - Crear `technique.schema.ts` con Zod para `TechniqueBody` (título max 120 chars, descripción y categoría obligatorios)
    - `createTechnique`: crea y asocia al therapistId del token
    - `listTechniques(therapistId, category?)`: filtra `deletedAt IS NULL`, ordena por `createdAt DESC`
    - `updateTechnique`: actualiza campos y `updatedAt`; verifica ownership (403 si no es el dueño)
    - `deleteTechnique`: soft delete (`deletedAt = now()`); conserva assignments y records
    - Montar router en `GET /techniques`, `POST /techniques`, `PUT /techniques/:id`, `DELETE /techniques/:id` (todos therapist only)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 5.2 Property test 11: Creación y recuperación íntegra de técnica (round-trip)
    - **Property 11: Creación y recuperación íntegra de técnica (round-trip)**
    - **Validates: Requirements 3.2**
  - [x] 5.3 Property test 12: Actualización de técnica registra fecha de modificación
    - **Property 12: Actualización de técnica registra fecha de modificación**
    - **Validates: Requirements 3.3**
  - [x] 5.4 Property test 13: Integridad referencial tras eliminación de técnica
    - **Property 13: Integridad referencial tras eliminación de técnica**
    - **Validates: Requirements 3.4**
  - [x] 5.5 Property test 14: Listado de técnicas ordenado y filtrado correctamente
    - **Property 14: Listado de técnicas ordenado y filtrado correctamente**
    - **Validates: Requirements 3.5**
  - [x] 5.6 Implementar páginas de biblioteca (frontend)
    - Crear `TechniqueLibraryPage` con listado de `TechniqueCard`, filtro por categoría y botón "Nueva técnica"
    - Crear `TechniqueFormPage` compartido para crear y editar; valida título, descripción y categoría antes de enviar
    - Integrar `useQuery` / `useMutation` de TanStack Query para GET, POST, PUT, DELETE
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 6. Asignaciones de técnicas a pacientes
  - [x] 6.1 Implementar `assignment.service.ts` y `assignment.router.ts`
    - `createAssignment(therapistId, body)`: verifica que la técnica pertenezca al terapeuta y que el paciente esté vinculado; crea `Assignment` con `status = "pending"` y `assignedAt = now()`
    - `listAssignments`: therapist → filtra por `patientId` query param; patient → filtra por `patientId = req.user.id`, ordena por `assignedAt DESC`
    - Montar router en `POST /assignments`, `GET /assignments`
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [x] 6.2 Property test 15: Asignación creada con estado inicial `pending`
    - **Property 15: Asignación creada con estado inicial `pending`**
    - **Validates: Requirements 4.1**
  - [x] 6.3 Property test 16: Aislamiento de asignaciones del paciente
    - **Property 16: Aislamiento de asignaciones del paciente**
    - **Validates: Requirements 4.2**
  - [x] 6.4 Property test 17: Paciente no puede acceder a técnicas no asignadas
    - **Property 17: Paciente no puede acceder a técnicas no asignadas**
    - **Validates: Requirements 4.4**
  - [x] 6.5 Implementar páginas de asignaciones (frontend — vista paciente)
    - Crear `AssignmentsListPage`: muestra `AssignmentCard` con `StatusBadge` (pendiente/completada), ordenadas por `assignedAt DESC`
    - Crear `AssignmentDetailPage`: muestra contenido de la técnica y, si estado es `pendiente`, formulario para enviar registro
    - _Requirements: 4.2, 4.3, 5.1_

- [x] 7. Registros de seguimiento
  - [x] 7.1 Implementar `record.service.ts` y `record.router.ts`
    - Crear `record.schema.ts` con Zod: `response` min 1 char non-whitespace (422 si falla)
    - `submitRecord(patientId, body)`: verifica que la asignación pertenezca al paciente y esté `pending`; crea `Record` con `submittedAt = now()` UTC; actualiza `Assignment.status = "completed"`; crea `Notification` de tipo `assignment_completed` para el terapeuta — todo en transacción Prisma
    - `getRecord(requesterId, requesterRole, assignmentId)`: terapeuta verifica ownership del paciente; paciente verifica que sea suya
    - Montar router en `POST /records`, `GET /records/:assignmentId`
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_
  - [x] 7.2 Property test 18: Envío de registro actualiza estado y persiste todos los campos
    - **Property 18: Envío de registro actualiza estado y persiste todos los campos**
    - **Validates: Requirements 5.2**
  - [x] 7.3 Property test 19: Rechazo de registros vacíos o con solo whitespace
    - **Property 19: Rechazo de registros vacíos o con solo whitespace**
    - **Validates: Requirements 5.3**
  - [x] 7.4 Property test 20: Inmutabilidad de registros ya enviados
    - **Property 20: Inmutabilidad de registros ya enviados**
    - **Validates: Requirements 5.6**

- [x] 8. Checkpoint — núcleo terapéutico
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Mensajería directa
  - [x] 9.1 Implementar `message.service.ts` y `message.router.ts`
    - Crear `message.schema.ts` con Zod: `content` min 1 char non-whitespace (422 si falla)
    - `getOrCreateConversation(therapistId, patientId)`: upsert en `Conversation` con `@@unique([therapistId, patientId])`
    - `listConversations(userId, role)`: devuelve `ConversationSummary[]` con `unreadCount` y `lastMessage`
    - `getMessages(userId, conversationId)`: verifica participación (403 si no corresponde); devuelve mensajes en orden `sentAt ASC`; marca todos los mensajes no leídos del receptor como `read = true`
    - `sendMessage(senderId, body)`: verifica participación; crea `Message` con `sentAt = now()` UTC
    - Montar router en `GET /messages/conversations`, `GET /messages/:conversationId`, `POST /messages`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 9.2 Property test 21: Unicidad de conversación por par terapeuta-paciente
    - **Property 21: Unicidad de conversación por par terapeuta-paciente**
    - **Validates: Requirements 6.1**
  - [x] 9.3 Property test 22: Round-trip de mensaje — persistencia íntegra
    - **Property 22: Round-trip de mensaje — persistencia íntegra**
    - **Validates: Requirements 6.2**
  - [x] 9.4 Property test 23: Rechazo de mensajes vacíos o con solo whitespace
    - **Property 23: Rechazo de mensajes vacíos o con solo whitespace**
    - **Validates: Requirements 6.3**
  - [x] 9.5 Property test 24: Mensajes ordenados cronológicamente y contador de no leídos
    - **Property 24: Mensajes ordenados cronológicamente y contador de no leídos**
    - **Validates: Requirements 6.4, 6.5, 6.6**
  - [x] 9.6 Property test 25: Aislamiento de conversaciones
    - **Property 25: Aislamiento de conversaciones**
    - **Validates: Requirements 6.7**
  - [x] 9.7 Implementar páginas de mensajería (frontend)
    - Crear `MessagesListPage`: lista conversaciones con `UnreadBadge` y último mensaje
    - Crear `ConversationPage`: muestra mensajes con `MessageBubble` diferenciando enviado/recibido, input de nuevo mensaje; usa `useMessages` con polling cada 10 s
    - Marcar mensajes como leídos al abrir la conversación (`GET /messages/:conversationId`)
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 10. Notificaciones in-app (backend + frontend)
  - [x] 10.1 Implementar `notification.service.ts` y `notification.router.ts`
    - `listNotifications(therapistId)`: devuelve `Notification[]` del terapeuta ordenadas por `createdAt DESC`
    - `markAsRead(therapistId, notificationId)`: verifica ownership y establece `read = true`
    - Montar router en `GET /notifications` y `POST /notifications/:id/read` (therapist only)
    - _Requirements: 5.4_
  - [x] 10.2 Integrar notificaciones y polling en el frontend
    - Crear `NotificationStore` (Zustand) con `count` y `setCount(n)`
    - Implementar `useNotifications()` con TanStack Query polling cada 30 s (solo therapist)
    - Mostrar `NotificationDot` en el dashboard del terapeuta cuando haya notificaciones no leídas
    - _Requirements: 5.4_

- [x] 11. Control de acceso basado en roles y seguridad
  - [x] 11.1 Implementar `middleware/validateBody.ts` y reforzar autorización en todos los routers
    - Crear `validateBody(schema)` que aplica Zod a `req.body` y devuelve 422 con el primer mensaje de error si falla
    - Verificar que todos los routers aplican `authenticate` seguido de `requireRole` según la tabla de diseño
    - Añadir verificación de ownership a nivel de service en patients, techniques, assignments, records y messages (403 si el recurso no pertenece al usuario autenticado)
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  - [x] 11.2 Property test 26: Control de acceso basado en rol — rechazo universal
    - **Property 26: Control de acceso basado en rol — rechazo universal**
    - **Validates: Requirements 7.1, 7.2**
  - [x] 11.3 Ocultar elementos de UI según rol activo
    - Aplicar `RoleGuard` en la SPA para ocultar navegación y acciones no permitidas al rol de la sesión activa
    - Verificar que rutas exclusivas del terapeuta (`/patients`, `/library`, etc.) redirigen a `/dashboard` si el usuario es paciente, y viceversa
    - _Requirements: 7.4_

- [x] 12. Integración final y wiring
  - [x] 12.1 Conectar todos los routers en `app.ts` y validar flujo completo
    - Montar todos los routers: `/auth`, `/invitations`, `/patients`, `/techniques`, `/assignments`, `/records`, `/messages`, `/notifications`
    - Verificar que el error handler global captura `AppError` y errores de Prisma
    - Crear un test de integración que cubra el flujo: registro terapeuta → invitación → registro paciente → asignación → registro de seguimiento → notificación
    - _Requirements: 1.7, 2.2, 4.1, 5.2, 5.4_
  - [x] 12.2 Configurar `vitest.config.ts` y scripts de testing
    - Configurar `vitest.config.ts` con entorno de test (SQLite in-memory via Prisma para propiedades)
    - Añadir scripts en `package.json`: `test` (unit + PBT), `test:integration`
    - Asegurar que todos los archivos de propiedades siguen el formato `Feature: coterapeuta-app, Property N: ...`
    - _Requirements: todos_

- [x] 13. Checkpoint final — todos los tests pasan
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos que implementa para trazabilidad.
- Los checkpoints garantizan validación incremental antes de pasar a la siguiente fase.
- Los property tests usan fast-check con mínimo 100 iteraciones; las propiedades que requieren persistencia usan SQLite in-memory vía Prisma.
- El soft delete de técnicas (tarea 5.1) es crítico para preservar la integridad del historial clínico (requisito 3.4).
- El polling del frontend (mensajes cada 10 s, notificaciones cada 30 s) está implementado via TanStack Query `refetchInterval`.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 4, "tasks": ["2.5", "2.6", "2.7", "2.8"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 7, "tasks": ["4.5", "4.6"] },
    { "id": 8, "tasks": ["4.7", "4.8", "4.9", "5.1"] },
    { "id": 9, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "6.1"] },
    { "id": 10, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 11, "tasks": ["7.1"] },
    { "id": 12, "tasks": ["7.2", "7.3", "7.4", "9.1"] },
    { "id": 13, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6", "9.7"] },
    { "id": 14, "tasks": ["10.1", "11.1"] },
    { "id": 15, "tasks": ["10.2", "11.2", "11.3"] },
    { "id": 16, "tasks": ["12.1"] },
    { "id": 17, "tasks": ["12.2"] }
  ]
}
```
