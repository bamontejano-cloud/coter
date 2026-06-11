# Design Document — Coterapeuta App

## Overview

Coterapeuta es una SPA (Single Page Application) con una API REST en TypeScript. La arquitectura sigue un modelo cliente-servidor clásico: el frontend es una SPA servida estáticamente y la API es un servidor HTTP independiente. La comunicación se realiza mediante JSON sobre HTTPS. No hay WebSockets en el MVP; las actualizaciones en tiempo real (notificaciones, mensajes no leídos) se resuelven con polling ligero desde el cliente.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                        │
│  React + React Router + Zustand + TanStack Query             │
│                                                              │
│  Pages: Auth | Dashboard | Patients | Library | Assignments  │
│         Records | Messaging                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS / JSON (JWT en Authorization header)
┌────────────────────────▼─────────────────────────────────────┐
│                      API REST (Express / Node.js)            │
│                                                              │
│  Middleware: Auth JWT → Role Guard → Route Handlers          │
│                                                              │
│  Routers:                                                    │
│    /auth        → AuthRouter                                 │
│    /invitations → InvitationRouter                           │
│    /patients    → PatientRouter                              │
│    /techniques  → TechniqueRouter                            │
│    /assignments → AssignmentRouter                           │
│    /records     → RecordRouter                               │
│    /messages    → MessageRouter                              │
│    /notifications → NotificationRouter                       │
└────────────────────────┬─────────────────────────────────────┘
                         │ Queries / Transactions
┌────────────────────────▼─────────────────────────────────────┐
│                   PostgreSQL (via Prisma ORM)                │
│                                                              │
│  Tables: users, invitations, therapist_patient,              │
│          techniques, assignments, records,                    │
│          messages, notifications                             │
└──────────────────────────────────────────────────────────────┘
```

### Tecnologías elegidas

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React 18 + TypeScript | Ecosistema maduro, tipado estático |
| Routing (FE) | React Router v6 | Estándar de la industria para SPAs |
| Estado global | Zustand | Mínimo boilerplate, fácil testeo |
| Data fetching | TanStack Query v5 | Caché, invalidación, polling integrado |
| Backend | Express 4 + TypeScript | Ligero, flexible, ecosistema amplio |
| ORM | Prisma | Migraciones tipadas, seguro contra SQL injection |
| Base de datos | PostgreSQL 15 | ACID, relacional, ideal para datos clínicos |
| Autenticación | jsonwebtoken (HS256) | Simple, stateless para MVP |
| Hashing | bcrypt (cost 12) | Requerimiento explícito del cliente |
| Validación | Zod | Validación en runtime + inferencia de tipos |
| Testing | Vitest + fast-check | Rápido, compatible con TypeScript, PBT integrado |

---

## Components and Interfaces

### Frontend

#### Páginas y rutas

```
/login                  → LoginPage
/register               → RegisterPage (registro directo con rol therapist)
/register/:token        → RegisterWithInvitationPage (registro con invitación → rol patient)
/dashboard              → DashboardPage (vista según rol)
/patients               → PatientsListPage          [therapist only]
/patients/:id           → PatientProfilePage         [therapist only]
/library                → TechniqueLibraryPage       [therapist only]
/library/new            → TechniqueFormPage          [therapist only]
/library/:id/edit       → TechniqueFormPage          [therapist only]
/assignments            → AssignmentsListPage        [patient only]
/assignments/:id        → AssignmentDetailPage       [patient only]
/messages               → MessagesListPage           [both]
/messages/:conversationId → ConversationPage         [both]
```

#### Componentes reutilizables

- `ProtectedRoute` — verifica Sesión activa y rol; redirige si no cumple
- `RoleGuard` — renderiza children solo si el rol activo coincide
- `UnreadBadge` — contador numérico de mensajes no leídos
- `StatusBadge` — indicador visual de estado de Asignación (`pendiente` / `completada`)
- `TechniqueCard` — tarjeta de técnica en la Biblioteca
- `AssignmentCard` — tarjeta de asignación en la lista del Paciente
- `MessageBubble` — burbuja de mensaje con diferenciación enviado/recibido
- `NotificationDot` — indicador de nueva actividad para el Terapeuta

### Backend

#### Módulos

Cada módulo expone un router Express y un servicio con la lógica de negocio desacoplada del transporte HTTP:

```
src/
  modules/
    auth/
      auth.router.ts
      auth.service.ts
      auth.schema.ts        (Zod schemas)
    invitations/
      invitation.router.ts
      invitation.service.ts
    patients/
      patient.router.ts
      patient.service.ts
    techniques/
      technique.router.ts
      technique.service.ts
      technique.schema.ts
    assignments/
      assignment.router.ts
      assignment.service.ts
    records/
      record.router.ts
      record.service.ts
      record.schema.ts
    messages/
      message.router.ts
      message.service.ts
      message.schema.ts
    notifications/
      notification.router.ts
      notification.service.ts
  middleware/
    authenticate.ts         (verifica JWT, adjunta req.user)
    requireRole.ts          (verifica rol; devuelve 403 si no cumple)
    validateBody.ts         (valida req.body con Zod schema)
  lib/
    prisma.ts               (singleton PrismaClient)
    jwt.ts                  (sign / verify helpers)
    crypto.ts               (generateInvitationCode)
  app.ts
  server.ts
```

---

### Interfaces

#### Auth API

```typescript
// POST /auth/register
interface RegisterBody {
  fullName: string;       // min 1 char
  email: string;          // valid email
  password: string;       // min 8 chars
  role: "therapist" | "patient";
  invitationCode?: string; // required when role = patient (si no viene por URL)
}
interface RegisterResponse {
  user: PublicUser;
  token: string;          // JWT, exp 8h
}

// POST /auth/login
interface LoginBody {
  email: string;
  password: string;
}
interface LoginResponse {
  user: PublicUser;
  token: string;
}

// POST /auth/logout  (requiere auth)
// 204 No Content

interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  role: "therapist" | "patient";
}
```

### Invitations API

```typescript
// POST /invitations  (therapist only)
interface InvitationResponse {
  code: string;           // UUID v4 único
  expiresAt: string;      // ISO 8601, ahora + 72h
}

// GET /invitations/:code/validate  (público)
interface ValidateInvitationResponse {
  valid: boolean;
  therapistName?: string;
}
```

### Patients API

```typescript
// GET /patients  (therapist only)
type PatientsListResponse = PatientSummary[];

interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  linkedAt: string;        // ISO 8601
}

// GET /patients/:id  (therapist only, own patients)
interface PatientProfileResponse extends PatientSummary {
  assignments: AssignmentSummary[];
  messagesSummary: { unreadCount: number };
}
```

### Techniques API

```typescript
// GET /techniques  (therapist only)
// Query: ?category=string
type TechniquesResponse = Technique[];

interface Technique {
  id: string;
  title: string;           // max 120 chars
  description: string;
  category: string;
  patientInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

// POST /techniques  (therapist only)
// PUT  /techniques/:id  (therapist only)
interface TechniqueBody {
  title: string;
  description: string;
  category: string;
  patientInstructions?: string;
}

// DELETE /techniques/:id  (therapist only)
// 204 — conserva assignments e historial de records
```

### Assignments API

```typescript
// POST /assignments  (therapist only)
interface AssignmentBody {
  techniqueId: string;
  patientId: string;
  therapistNotes?: string;
}

// GET /assignments  (patient: sus asignaciones | therapist: por patientId query)
// Query (therapist): ?patientId=string
type AssignmentsResponse = AssignmentSummary[];

interface AssignmentSummary {
  id: string;
  techniqueId: string;
  techniqueTitle: string;
  status: "pending" | "completed";
  assignedAt: string;
  therapistNotes?: string;
}
```

### Records API

```typescript
// POST /records  (patient only)
interface RecordBody {
  assignmentId: string;
  response: string;        // min 1 char (non-whitespace)
}

// GET /records/:assignmentId  (therapist: solo pacientes propios | patient: solo las suyas)
interface RecordResponse {
  id: string;
  assignmentId: string;
  response: string;
  submittedAt: string;     // ISO 8601 UTC
}
```

### Messages API

```typescript
// GET /messages/conversations  (both roles)
type ConversationsResponse = ConversationSummary[];

interface ConversationSummary {
  conversationId: string;
  participantName: string;
  unreadCount: number;
  lastMessage?: { content: string; sentAt: string };
}

// GET /messages/:conversationId  (participants only)
// Marca como leídos al abrir
type MessagesResponse = Message[];

interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;           // ISO 8601 UTC
  read: boolean;
}

// POST /messages  (both roles)
interface MessageBody {
  conversationId: string;
  content: string;          // min 1 char non-whitespace
}
```

### Notifications API

```typescript
// GET /notifications  (therapist only) — polled cada 30s
type NotificationsResponse = Notification[];

interface Notification {
  id: string;
  type: "assignment_completed";
  patientId: string;
  patientName: string;
  assignmentId: string;
  createdAt: string;
  read: boolean;
}

// POST /notifications/:id/read  (therapist only)
// 204 No Content
```

---

## Data Models

```prisma
model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         Role
  createdAt    DateTime @default(now())

  // therapist side
  invitations         Invitation[]
  therapistPatients   TherapistPatient[]  @relation("Therapist")
  techniques          Technique[]
  assignmentsGiven    Assignment[]        @relation("Therapist")
  sentMessages        Message[]           @relation("Sender")
  receivedMessages    Message[]           @relation("Receiver")
  notifications       Notification[]

  // patient side
  patientTherapists   TherapistPatient[]  @relation("Patient")
  assignmentsReceived Assignment[]        @relation("Patient")
  records             Record[]
}

enum Role {
  therapist
  patient
}

model Invitation {
  id          String   @id @default(uuid())
  code        String   @unique
  therapistId String
  therapist   User     @relation(fields: [therapistId], references: [id])
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}

model TherapistPatient {
  id          String   @id @default(uuid())
  therapistId String
  patientId   String
  linkedAt    DateTime @default(now())
  therapist   User     @relation("Therapist", fields: [therapistId], references: [id])
  patient     User     @relation("Patient", fields: [patientId], references: [id])

  @@unique([therapistId, patientId])
}

model Technique {
  id                  String   @id @default(uuid())
  therapistId         String
  therapist           User     @relation(fields: [therapistId], references: [id])
  title               String   @db.VarChar(120)
  description         String
  category            String
  patientInstructions String?
  deletedAt           DateTime?   // soft delete
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  assignments Assignment[]
}

model Assignment {
  id             String           @id @default(uuid())
  techniqueId    String
  technique      Technique        @relation(fields: [techniqueId], references: [id])
  patientId      String
  patient        User             @relation("Patient", fields: [patientId], references: [id])
  therapistId    String
  therapist      User             @relation("Therapist", fields: [therapistId], references: [id])
  therapistNotes String?
  status         AssignmentStatus @default(pending)
  assignedAt     DateTime         @default(now())

  record Record?
}

enum AssignmentStatus {
  pending
  completed
}

model Record {
  id           String     @id @default(uuid())
  assignmentId String     @unique
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  patientId    String
  patient      User       @relation(fields: [patientId], references: [id])
  response     String
  submittedAt  DateTime   @default(now())
}

model Conversation {
  id          String    @id @default(uuid())
  therapistId String
  patientId   String
  createdAt   DateTime  @default(now())
  messages    Message[]

  @@unique([therapistId, patientId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation("Sender", fields: [senderId], references: [id])
  receiverId     String
  receiver       User         @relation("Receiver", fields: [receiverId], references: [id])
  content        String
  read           Boolean      @default(false)
  sentAt         DateTime     @default(now())
}

model Notification {
  id           String           @id @default(uuid())
  therapistId  String
  therapist    User             @relation(fields: [therapistId], references: [id])
  type         NotificationType
  patientId    String
  assignmentId String
  read         Boolean          @default(false)
  createdAt    DateTime         @default(now())
}

enum NotificationType {
  assignment_completed
}
```

---

## Error Handling

### Convención de respuestas de error

```typescript
interface ApiError {
  error: string;    // código de error en snake_case
  message: string;  // mensaje legible para el usuario
}
```

### Tabla de errores estándar

| Situación | HTTP Status | `error` | `message` |
|---|---|---|---|
| Email ya registrado | 409 | `email_already_exists` | "El correo electrónico ya está registrado" |
| Credenciales incorrectas | 401 | `invalid_credentials` | "Credenciales inválidas" |
| Token ausente o inválido | 401 | `unauthorized` | "Sesión no válida o expirada" |
| Token falsificado | 401 | `token_tampered` | "Sesión no válida o expirada" |
| Rol insuficiente | 403 | `forbidden` | "Acceso denegado" |
| Recurso no encontrado | 404 | `not_found` | "Recurso no encontrado" |
| Invitación inválida/expirada | 400 | `invalid_invitation` | "La invitación no es válida o ha expirado" |
| Cuerpo de request inválido (Zod) | 422 | `validation_error` | Mensaje del primer error de Zod |
| Respuesta de registro vacía | 422 | `validation_error` | "El campo de respuesta es obligatorio" |
| Mensaje vacío | 422 | `validation_error` | "El mensaje no puede estar vacío" |
| Error interno | 500 | `internal_error` | "Error interno del servidor" |

### Estrategia de manejo global

1. `validateBody(schema)` middleware aplica Zod antes de que llegue al handler; devuelve 422 automáticamente.
2. `authenticate` middleware verifica JWT; devuelve 401 si falla.
3. `requireRole(...roles)` middleware verifica rol; devuelve 403 si no corresponde.
4. Error handler global de Express captura excepciones no controladas y devuelve 500.
5. Errores de negocio se lanzan como instancias de `AppError(status, code, message)`.

### Soft delete de Técnicas

Al eliminar una Técnica se establece `deletedAt = now()`. Las queries de listado filtran `deletedAt IS NULL`. Las Assignments y Records que referencian la técnica permanecen íntegros para preservar el historial clínico (requisito 3.4).

---

## Frontend State Management

```
AuthStore (Zustand)
  user: PublicUser | null
  token: string | null
  login(token, user): void
  logout(): void

NotificationStore (Zustand)
  count: number
  setCount(n): void
```

TanStack Query maneja el estado del servidor (caché, invalidación, polling):

- `usePatients()` — GET /patients
- `useTechniques(category?)` — GET /techniques
- `useAssignments(patientId?)` — GET /assignments
- `useRecord(assignmentId)` — GET /records/:assignmentId
- `useMessages(conversationId)` — GET /messages/:conversationId, polling cada 10s
- `useNotifications()` — GET /notifications, polling cada 30s (therapist only)
- `useUnreadCount(conversationId)` — derivado de useMessages

---

## Security Considerations

- Las contraseñas se hashean con bcrypt cost 12 antes de persistir; nunca se devuelven en responses.
- Los JWT se firman con HS256 usando un secreto de mínimo 32 bytes configurado en variable de entorno `JWT_SECRET`.
- La expiración del JWT es de 8 horas; no hay refresh token en el MVP.
- Todos los endpoints aplican `authenticate` excepto `POST /auth/register`, `POST /auth/login` y `GET /invitations/:code/validate`.
- La autorización a nivel de recurso (paciente pertenece al terapeuta, conversación pertenece a los participantes) se verifica dentro de cada service, no solo en el middleware de rol.
- Las queries de Prisma usan parámetros siempre; no se construyen queries con concatenación de strings.
- CORS configurado para aceptar solo el origen de la SPA (variable de entorno `ALLOWED_ORIGIN`).
- Los tokens falsificados o modificados son rechazados por `jwt.verify()` que lanza `JsonWebTokenError` → 401.

---

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe cumplirse en todas las ejecuciones válidas del sistema — una especificación formal de lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles y las garantías de corrección verificables automáticamente.*

### Property 1: Registro de usuario y hash de contraseña

*Para cualquier* conjunto de credenciales de registro válidas (email único, contraseña con mínimo 8 caracteres, rol válido), el sistema debe crear un usuario cuya contraseña almacenada en base de datos difiera del texto plano, y devolver un JWT verificable con la clave secreta configurada.

**Validates: Requirements 1.2**

---

### Property 2: Unicidad de email — rechazo de duplicados

*Para cualquier* email de usuario ya registrado en el sistema, un segundo intento de registro con el mismo email debe retornar HTTP 409, independientemente de los demás campos del formulario.

**Validates: Requirements 1.3**

---

### Property 3: JWT emitido contiene expiración de 8 horas

*Para cualquier* par de credenciales válidas (email + contraseña correcta), el JWT emitido en el login debe ser verificable con la clave secreta y su claim `exp` debe estar a 8 horas (±60 segundos) del momento de emisión.

**Validates: Requirements 1.4**

---

### Property 4: Rechazo de credenciales incorrectas

*Para cualquier* email registrado y cualquier contraseña que no coincida con su hash almacenado, el endpoint de login debe retornar HTTP 401.

**Validates: Requirements 1.5**

---

### Property 5: Rechazo de requests sin token válido a rutas protegidas

*Para cualquier* endpoint protegido del API y cualquier request que no incluya un JWT válido (ausente, expirado o modificado), el sistema debe retornar HTTP 401.

**Validates: Requirements 1.7, 7.5**

---

### Property 6: Unicidad de códigos de invitación

*Para cualquier* secuencia de N invitaciones generadas por uno o varios terapeutas, todos los códigos generados deben ser únicos entre sí (sin colisiones).

**Validates: Requirements 2.1**

---

### Property 7: Registro con invitación vincula correctamente al paciente

*Para cualquier* código de invitación válido (no usado, no expirado) emitido por un terapeuta T, al registrarse con dicho código, la cuenta creada debe tener rol `patient` y estar vinculada al terapeuta T en la tabla `therapist_patient`.

**Validates: Requirements 2.2**

---

### Property 8: Invitación de un solo uso

*Para cualquier* código de invitación que ya ha sido utilizado para un registro exitoso, cualquier intento posterior de registro con el mismo código debe ser rechazado con el mensaje de invitación inválida.

**Validates: Requirements 2.3**

---

### Property 9: Lista de pacientes es completa y contiene solo los vinculados

*Para cualquier* terapeuta con N pacientes vinculados, el endpoint `GET /patients` debe retornar exactamente esos N pacientes, sin incluir pacientes de otros terapeutas.

**Validates: Requirements 2.4, 2.6**

---

### Property 10: Aislamiento cross-therapist — acceso denegado a pacientes ajenos

*Para cualquier* terapeuta T1 y cualquier paciente P que no esté vinculado a T1, T1 no debe poder acceder al perfil, asignaciones, registros ni mensajes de P (HTTP 403).

**Validates: Requirements 2.6, 7.3**

---

### Property 11: Creación y recuperación íntegra de técnica (round-trip)

*Para cualquier* técnica válida creada por un terapeuta (título ≤ 120 chars, descripción no vacía, categoría no vacía), al recuperarla por su id debe devolver exactamente los mismos campos con los que fue creada.

**Validates: Requirements 3.2**

---

### Property 12: Actualización de técnica registra fecha de modificación

*Para cualquier* técnica existente y cualquier conjunto válido de cambios aplicados mediante PUT, el campo `updatedAt` en la respuesta debe ser estrictamente mayor al `createdAt` original.

**Validates: Requirements 3.3**

---

### Property 13: Integridad referencial tras eliminación de técnica

*Para cualquier* técnica eliminada que tenía asignaciones y registros previos, esos registros deben seguir siendo accesibles a través de las APIs de assignments y records (la eliminación es lógica, no física).

**Validates: Requirements 3.4**

---

### Property 14: Listado de técnicas ordenado y filtrado correctamente

*Para cualquier* conjunto de técnicas de un terapeuta, la respuesta de `GET /techniques` sin filtro debe estar ordenada por `createdAt` descendente; con filtro `?category=X` debe contener únicamente técnicas de la categoría X.

**Validates: Requirements 3.5**

---

### Property 15: Asignación creada con estado inicial `pending`

*Para cualquier* asignación válida (técnica propia del terapeuta, paciente vinculado), la asignación creada debe tener `status = "pending"` y `assignedAt` con el timestamp del momento de creación.

**Validates: Requirements 4.1**

---

### Property 16: Aislamiento de asignaciones del paciente

*Para cualquier* paciente P, el endpoint `GET /assignments` debe retornar únicamente las asignaciones de P, nunca las de otro paciente, y en orden descendente de `assignedAt`.

**Validates: Requirements 4.2**

---

### Property 17: Paciente no puede acceder a técnicas no asignadas

*Para cualquier* paciente P y cualquier técnica T que no esté asignada a P, cualquier intento de P de obtener el detalle de T debe ser rechazado con HTTP 403 o 404.

**Validates: Requirements 4.4**

---

### Property 18: Envío de registro actualiza estado y persiste todos los campos

*Para cualquier* asignación con estado `pending` y cualquier respuesta no vacía, al enviar el registro el sistema debe: (a) almacenar el contenido, el patientId y un `submittedAt` en UTC, y (b) cambiar el estado de la asignación a `completed`.

**Validates: Requirements 5.2**

---

### Property 19: Rechazo de registros vacíos o con solo whitespace

*Para cualquier* intento de envío de registro donde el campo `response` esté vacío o compuesto únicamente de caracteres de espacio en blanco, el sistema debe rechazarlo con HTTP 422.

**Validates: Requirements 5.3**

---

### Property 20: Inmutabilidad de registros ya enviados

*Para cualquier* registro con estado `completed`, cualquier intento de modificar o sobrescribir el registro por parte del paciente debe ser rechazado por el sistema.

**Validates: Requirements 5.6**

---

### Property 21: Unicidad de conversación por par terapeuta-paciente

*Para cualquier* par (terapeuta T, paciente P) vinculados, debe existir exactamente una conversación; múltiples llamadas al API que intenten crear conversaciones para el mismo par deben devolver o reutilizar la misma conversación.

**Validates: Requirements 6.1**

---

### Property 22: Round-trip de mensaje — persistencia íntegra

*Para cualquier* mensaje enviado con contenido no vacío dentro de una conversación válida, al recuperar los mensajes de esa conversación debe aparecer el mensaje con su `content`, `senderId`, `receiverId` y un `sentAt` en UTC.

**Validates: Requirements 6.2**

---

### Property 23: Rechazo de mensajes vacíos o con solo whitespace

*Para cualquier* intento de envío de mensaje donde el campo `content` esté vacío o compuesto únicamente de espacios en blanco, el sistema debe rechazarlo con HTTP 422.

**Validates: Requirements 6.3**

---

### Property 24: Mensajes ordenados cronológicamente y contador de no leídos

*Para cualquier* conversación con N mensajes enviados, (a) los mensajes deben aparecer en orden ascendente de `sentAt`, y (b) antes de abrir la conversación el contador de no leídos del receptor debe ser igual a N; después de abrir la conversación el contador debe ser 0.

**Validates: Requirements 6.4, 6.5, 6.6**

---

### Property 25: Aislamiento de conversaciones

*Para cualquier* conversación entre terapeuta T y paciente P, cualquier usuario que no sea T ni P debe recibir HTTP 403 al intentar acceder a los mensajes de dicha conversación.

**Validates: Requirements 6.7**

---

### Property 26: Control de acceso basado en rol — rechazo universal

*Para cualquier* endpoint exclusivo del rol `therapist` y cualquier request autenticado con rol `patient` (o viceversa), el sistema debe retornar HTTP 403.

**Validates: Requirements 7.1, 7.2**

---

## Testing Strategy

### Enfoque dual: tests de ejemplo + tests basados en propiedades

La estrategia de testing combina dos enfoques complementarios:

**Tests de ejemplo (Vitest)**
- Cubren comportamientos específicos de UI (existencia de formularios, indicadores visuales, notificaciones).
- Cubren flujos de integración concretos (abrir perfil de paciente muestra historial, completar asignación genera notificación).
- Se mantienen acotados: un test por comportamiento observable; los casos generales los cubren las propiedades.

**Tests basados en propiedades (Vitest + fast-check)**
- Cada propiedad listada en la sección "Correctness Properties" se implementa como un test PBT.
- Mínimo 100 iteraciones por propiedad.
- Las propiedades que involucran persistencia testean los servicios de negocio directamente contra una base de datos de test en memoria (SQLite via Prisma) para mantener el costo bajo.
- Las propiedades de autorización (rol, aislamiento) testean los middlewares y services con datos generados aleatoriamente.

**Etiquetado de propiedades**

Cada test PBT sigue el formato:

```
Feature: coterapeuta-app, Property N: <texto breve>
```

Por ejemplo:
```typescript
describe("Feature: coterapeuta-app, Property 2: Unicidad de email", () => {
  it("rechaza emails duplicados con HTTP 409", async () => {
    await fc.assert(
      fc.asyncProperty(validUserArb, async (user) => {
        await registerUser(user);
        const res = await registerUser(user);
        expect(res.status).toBe(409);
      })
    );
  });
});
```

### Generadores de datos (fast-check arbitraries)

```typescript
// Credenciales de usuario válidas
const validUserArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 80 }),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 64 }),
  role: fc.constantFrom("therapist", "patient"),
});

// Técnica válida
const validTechniqueArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 120 }),
  description: fc.string({ minLength: 1 }),
  category: fc.string({ minLength: 1 }),
  patientInstructions: fc.option(fc.string()),
});

// Contenido de mensaje / respuesta inválido (vacío o solo whitespace)
const emptyContentArb = fc.stringMatching(/^\s*$/);

// Contenido de mensaje válido (al menos un char no-whitespace)
const nonEmptyContentArb = fc.string({ minLength: 1 })
  .filter(s => s.trim().length > 0);
```

### Cobertura de integración

Para los flujos de extremo a extremo (invitación → registro → asignación → registro de seguimiento) se usan tests de integración con 2-3 ejemplos representativos que levantan la API completa contra una base de datos de test. Estos no se ejecutan en CI por defecto sino en un stage separado (`npm run test:integration`).
