# Requirements Document

## Introduction

Coterapeuta es una aplicación web MVP que actúa como plataforma de apoyo terapéutico entre terapeutas y pacientes. El terapeuta gestiona pacientes, asigna técnicas terapéuticas de una biblioteca curada y revisa registros de seguimiento. El paciente completa las tareas asignadas y puede comunicarse con su terapeuta mediante mensajería directa. La plataforma es exclusivamente web (SPA + API en TypeScript) y no incluye asistente IA en esta versión.

---

## Glossary

- **Sistema**: La aplicación web Coterapeuta (SPA + API).
- **Terapeuta**: Usuario autenticado con rol `therapist` que gestiona pacientes, la biblioteca de técnicas y los registros de seguimiento.
- **Paciente**: Usuario autenticado con rol `patient` que visualiza y completa las técnicas asignadas, y se comunica con su terapeuta.
- **Invitación**: Enlace o código generado por el Terapeuta que permite a un Paciente registrarse y quedar vinculado a dicho Terapeuta.
- **Técnica**: Recurso terapéutico (ejercicio, cuestionario, lectura, etc.) almacenado en la Biblioteca y asignable a un Paciente.
- **Asignación**: Asociación entre una Técnica y un Paciente, con estado (pendiente, completada) e instrucciones opcionales del Terapeuta.
- **Registro**: Respuesta o entrada completada por el Paciente al realizar una Técnica asignada.
- **Mensaje**: Unidad de comunicación directa entre Terapeuta y Paciente dentro de una conversación.
- **Sesión**: Período de acceso autenticado delimitado por un token JWT con expiración configurable.

---

## Requirements

### Requirement 1: Autenticación y gestión de sesión

**User Story:** Como usuario (Terapeuta o Paciente), quiero registrarme e iniciar sesión con mis credenciales, de modo que pueda acceder de forma segura a las funciones correspondientes a mi rol.

#### Acceptance Criteria

1. THE Sistema SHALL proporcionar un formulario de registro con los campos: nombre completo, correo electrónico, contraseña y rol (`therapist` o `patient`).
2. WHEN un usuario envía el formulario de registro con datos válidos, THE Sistema SHALL crear la cuenta, hashear la contraseña con bcrypt (coste mínimo 12) y devolver una Sesión activa.
3. IF el correo electrónico ya existe en el sistema, THEN THE Sistema SHALL devolver un error HTTP 409 con el mensaje "El correo electrónico ya está registrado".
4. WHEN un usuario envía credenciales correctas en el formulario de inicio de sesión, THE Sistema SHALL emitir un token JWT firmado con expiración de 8 horas y establecer la Sesión.
5. IF las credenciales de inicio de sesión son incorrectas, THEN THE Sistema SHALL devolver un error HTTP 401 con el mensaje "Credenciales inválidas".
6. WHEN la Sesión expira o el usuario cierra sesión, THE Sistema SHALL invalidar el token activo y redirigir al usuario a la página de inicio de sesión.
7. THE Sistema SHALL restringir el acceso a todas las rutas protegidas a usuarios con Sesión activa válida.

---

### Requirement 2: Gestión de pacientes por el terapeuta

**User Story:** Como Terapeuta, quiero invitar pacientes y ver su historial, de modo que pueda administrar mi cartera de pacientes desde la plataforma.

#### Acceptance Criteria

1. WHEN un Terapeuta solicita generar una Invitación, THE Sistema SHALL crear un código único de un solo uso con expiración de 72 horas y mostrarlo al Terapeuta.
2. WHEN un usuario se registra con una Invitación válida, THE Sistema SHALL vincular la cuenta creada al Terapeuta que generó la Invitación y asignar el rol `patient`.
3. IF una Invitación es usada o su tiempo de expiración ha transcurrido, THEN THE Sistema SHALL rechazar el registro con el mensaje "La invitación no es válida o ha expirado".
4. THE Sistema SHALL mostrar al Terapeuta una lista de sus Pacientes vinculados con nombre, correo electrónico y fecha de vinculación.
5. WHEN un Terapeuta selecciona un Paciente de la lista, THE Sistema SHALL mostrar el perfil del Paciente con el historial de Técnicas asignadas, Registros completados y Mensajes intercambiados.
6. THE Sistema SHALL restringir a cada Terapeuta el acceso únicamente a la información de los Pacientes vinculados a su cuenta.

---

### Requirement 3: Biblioteca de técnicas terapéuticas

**User Story:** Como Terapeuta, quiero gestionar una biblioteca de técnicas terapéuticas, de modo que pueda crear y organizar el contenido que asigno a mis pacientes.

#### Acceptance Criteria

1. THE Sistema SHALL proporcionar al Terapeuta una interfaz para crear Técnicas con los campos: título (obligatorio, máximo 120 caracteres), descripción (obligatorio), categoría (obligatorio) e instrucciones para el paciente (opcional).
2. WHEN un Terapeuta guarda una Técnica nueva, THE Sistema SHALL almacenarla en la Biblioteca asociada a dicho Terapeuta y confirmar la operación.
3. WHEN un Terapeuta edita una Técnica existente, THE Sistema SHALL actualizar los datos y registrar la fecha de última modificación.
4. WHEN un Terapeuta elimina una Técnica, THE Sistema SHALL conservar las Asignaciones e historial de Registros previos asociados a dicha Técnica para preservar la integridad del historial clínico.
5. THE Sistema SHALL mostrar al Terapeuta todas las Técnicas de su Biblioteca ordenadas por fecha de creación descendente, con posibilidad de filtrar por categoría.

---

### Requirement 4: Asignación de técnicas a pacientes

**User Story:** Como Terapeuta, quiero asignar técnicas de mi biblioteca a pacientes concretos, de modo que cada paciente reciba un plan terapéutico personalizado.

#### Acceptance Criteria

1. WHEN un Terapeuta asigna una Técnica a un Paciente, THE Sistema SHALL crear una Asignación con estado `pendiente`, fecha de asignación e instrucciones opcionales del Terapeuta.
2. THE Sistema SHALL mostrar al Paciente únicamente las Asignaciones que le corresponden, ordenadas por fecha de asignación descendente.
3. WHILE una Asignación tiene estado `pendiente`, THE Sistema SHALL mostrar al Paciente un indicador visual diferenciado respecto a las Asignaciones completadas.
4. THE Sistema SHALL impedir que un Paciente acceda a Técnicas no asignadas a su cuenta.
5. THE Sistema SHALL mostrar al Terapeuta el estado de cada Asignación (pendiente o completada) en el perfil del Paciente correspondiente.

---

### Requirement 5: Registros de seguimiento del paciente

**User Story:** Como Paciente, quiero completar y enviar registros sobre las técnicas asignadas, de modo que mi terapeuta pueda hacer seguimiento de mi progreso.

#### Acceptance Criteria

1. WHEN un Paciente abre una Asignación con estado `pendiente`, THE Sistema SHALL mostrar el contenido de la Técnica y un formulario para completar el Registro.
2. WHEN un Paciente envía un Registro, THE Sistema SHALL almacenar el contenido, la fecha y hora de envío, y actualizar el estado de la Asignación a `completada`.
3. IF un Paciente intenta enviar un Registro con el campo de respuesta vacío, THEN THE Sistema SHALL rechazar el envío y mostrar el mensaje "El campo de respuesta es obligatorio".
4. WHEN una Asignación cambia a estado `completada`, THE Sistema SHALL notificar al Terapeuta dentro de la plataforma con un indicador de nueva actividad.
5. THE Sistema SHALL mostrar al Terapeuta el contenido completo de cada Registro enviado por sus Pacientes, incluyendo fecha y hora de envío.
6. THE Sistema SHALL impedir que un Paciente modifique un Registro ya enviado.

---

### Requirement 6: Mensajería directa entre terapeuta y paciente

**User Story:** Como Terapeuta o Paciente, quiero enviar y recibir mensajes directos, de modo que podamos comunicarnos de forma asíncrona dentro de la plataforma.

#### Acceptance Criteria

1. THE Sistema SHALL proporcionar una conversación de mensajería directa por cada par Terapeuta-Paciente vinculado.
2. WHEN un usuario envía un Mensaje, THE Sistema SHALL almacenarlo con el contenido, el identificador del remitente, el identificador del destinatario y la marca de tiempo UTC.
3. IF el contenido de un Mensaje está vacío, THEN THE Sistema SHALL rechazar el envío y mostrar el mensaje "El mensaje no puede estar vacío".
4. THE Sistema SHALL mostrar los Mensajes de cada conversación en orden cronológico ascendente, diferenciando visualmente los mensajes enviados de los recibidos.
5. THE Sistema SHALL indicar al receptor cuántos Mensajes no leídos tiene en cada conversación mediante un contador numérico visible.
6. WHEN un usuario abre una conversación, THE Sistema SHALL marcar como leídos todos los Mensajes no leídos de dicha conversación.
7. THE Sistema SHALL restringir el acceso a cada conversación exclusivamente a los dos usuarios participantes (el Terapeuta y el Paciente vinculado).

---

### Requirement 7: Control de acceso basado en roles

**User Story:** Como usuario de la plataforma, quiero que el sistema aplique permisos según mi rol, de modo que ningún usuario pueda acceder a funciones o datos que no le corresponden.

#### Acceptance Criteria

1. THE Sistema SHALL exponer en la API un mecanismo de autorización que verifique el rol del usuario en cada endpoint protegido antes de procesar la solicitud.
2. IF un Paciente intenta acceder a un endpoint exclusivo del rol `therapist`, THEN THE Sistema SHALL devolver un error HTTP 403 con el mensaje "Acceso denegado".
3. IF un Terapeuta intenta acceder a los datos de un Paciente no vinculado a su cuenta, THEN THE Sistema SHALL devolver un error HTTP 403 con el mensaje "Acceso denegado".
4. THE Sistema SHALL ocultar en la interfaz de usuario los elementos de navegación y acciones no permitidos para el rol activo de la Sesión.
5. WHEN el token de Sesión de un usuario es modificado o falsificado, THE Sistema SHALL rechazar la solicitud con un error HTTP 401.
