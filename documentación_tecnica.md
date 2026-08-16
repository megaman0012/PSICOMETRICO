# Documentación Técnica - Proyecto Psicosométrico

## Resumen del Entendimiento

He comprendido que estamos construyendo una plataforma web para aplicar, calificar y analizar pruebas psicométricas orientadas a la evaluación de candidatos a Guardia de Seguridad, pero con un diseño genérico para soportar futuras pruebas y cargos.

### Lógica de Negocio Validada

Cada prueba tiene:
- Preguntas agrupadas en Dimensiones/Categorías
- Preguntas de tipo Likert (escala 1-5) o Opción Múltiple
- Cada opción de respuesta tiene un peso/valor numérico
- Al completar una prueba, se calcula un puntaje por Dimensión (suma o promedio de los pesos de las respuestas de esa dimensión) y un puntaje Global
- Cada puntaje se compara contra Umbrales de clasificación que traen un texto de interpretación asociado
- El resultado final se presenta como un Informe con: datos del candidato, tabla de resultados por dimensión, clasificación global, texto interpretativo, recomendaciones y datos del evaluador

### Decisión de Arquitectura

Motor genérico de pruebas configurables: Prueba > Dimensión > Pregunta > Opción de respuesta > Umbral de clasificación, todo como datos en base de datos, administrable desde un panel, para poder agregar pruebas nuevas sin escribir código.

### Stack Definido

- Backend: Node.js con NestJS (TypeScript) exponiendo API REST
- Base de datos: PostgreSQL
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Gráficos: Recharts
- Informes PDF: pdfkit (generación programática, sin navegador)
- Autenticación: JWT con roles (Admin, Evaluador, Gerencial/Reclutador)
- Repositorio: monorepo con carpetas /backend y /frontend

## Preguntas de Negocio y Respuestas

### 1. Sobre los valores de las opciones de respuesta
- **Respuesta:** Debemos seguir los modelos de los Excel compartidos. Para preguntas Likert, el valor corresponde al número seleccionado (1-5). Para preguntas de opción múltiple, necesitamos tanto el campo `esCorrecta` como un valor numérico independiente que represente el peso/puntuación de esa opción.

### 2. Sobre el cálculo de puntajes
- **Respuesta:** El puntaje por dimensión depende de la configuración de la prueba (puede ser suma o promedio). Algunas pruebas podrían tener dimensiones con pesos diferentes en el cálculo global, esto se definirá después de presentar el proyecto.

### 3. Sobre los umbrales de clasificación
- **Respuesta:** Los umbrales serán por dimensión y esto se reflejará a nivel global. Nos guiaremos con los estándares actuales existentes en el mundo para manejar esto de mejor manera.

### 4. Sobre el modelo de candidato y usuario
- **Respuesta:** Por ahora, el candidato es solo uno externo (no puede ser usuario del sistema). Necesitamos almacenar información base: nombres, apellidos, cédula, cargo postulado, email y teléfono.

### 5. Sobre la aplicación de pruebas
- **Respuesta:** Por ahora, dejaremos un único intento por candidato. Solo se guardará la última aplicación (sobrescribiendo intentos anteriores si los hubiera).

### 6. Sobre los reportes
- **Respuesta:** Sí, necesitamos generar reportes en CSV para poder trabajar con los datos externamente. Por ahora, usaremos un formato general con opción de cambiar en el futuro.

## Decisiones de Diseño Basadas en las Respuestas

Basado en las respuestas anteriores, ajustaré el modelo de datos propuesto inicialmente:

1. **OpcionRespuesta:** Mantener tanto `valor` (decimal) como `esCorrecta` (boolean) para soportar ambos tipos de preguntas.
2. **ResultadoDimension:** Agregar un campo `metodoCalculo` (enum: SUMA, PROMEDIO) para indicar cómo se calculó el puntaje por dimensión.
3. **PesoDimensión:** Considerar agregar una tabla intermedia o campo en Dimension para especificar pesos relativos de cada dimensión en el cálculo global (para futuras extensiones).
4. **UmbralClasificacion:** Mantener la relación con dimensionId (nullable para umbrales globales) pero enfocarnos inicialmente en umbrales por dimensión.
5. **Aplicacion:** Añadir un campo `numeroIntento` y considerar si mantener historial o solo último intento.
6. **Reportes:** Planificar endpoints para exportar datos en CSV además de generar PDFs.

## Estado Actual de la Implementación

- **Backend funcional en Docker**: NestJS + Prisma + PostgreSQL corriendo en el puerto externo `3021`.
- **Modelo de datos completo** (`schema.prisma`):
  - `Prueba > Dimension > Pregunta > OpcionRespuesta` (motor genérico de pruebas).
  - `Dimension.tipoAgregacion` (SUMA | PROMEDIO) controla el cálculo por dimensión.
  - `Respuesta` (aplicación → pregunta → opción) con `@@unique([aplicacionId, preguntaId])`.
  - `Aplicacion.usuarioId` → `Usuario` (evaluador que administró la prueba).
  - `ResultadoDimension` y `ResultadoGlobal` guardan `puntuacion`, `porcentaje`, `clasificacion` e `interpretacion` (se calculan al finalizar).
  - `Usuario` con `rol` (ADMIN | EVALUADOR) para autenticación JWT.
- **Motor de calificación**: `finalizarAplicacion` calcula el puntaje por dimensión (SUMA o PROMEDIO), normaliza cada dimensión a escala 0-100 (para SUMA dividiendo entre la suma de los valores máximos de opción; para PROMEDIO entre el valor máximo de la escala Likert) y promedia ponderado por cantidad de preguntas para el global, y consulta los umbrales (`UmbralClasificacion`) por dimensión o globales.
- **Seed**: 3 pruebas (Big Five PROMEDIO, Integridad SUMA, Aptitudes SUMA) con **ítems reales en español** (20 IPIP / 20 situaciones éticas / 10 aptitudes), umbrales por dimensión y globales (escala 0-100), 2 usuarios y 1 candidato de ejemplo. El seed solo corre si la base está vacía (`docker-entrypoint.sh`), por lo que los cambios hechos vía CRUD no se pierden al reiniciar.
- **Tests**: 101/101 pasando (`npm test` en `backend/`).
- **Frontend funcional** (`http://localhost:5173`):
  - React + TypeScript + Vite + Tailwind CSS + Recharts + react-router-dom.
  - `src/context/AuthContext.tsx`: autenticación JWT (token en `localStorage`, perfil, logout).
  - `src/services/api.ts`: cliente axios con interceptor de token y servicios tipados (auth, pruebas, candidatos, aplicaciones, usuarios).
  - Páginas: `Login`, `Dashboard`, `Pruebas`/`PruebaDetalle`, `Candidatos`, `AplicarPrueba` (asistente de 4 pasos), `Resultados` (gráfica de barras por dimensión), `Usuarios` (solo ADMIN).
  - Rutas protegidas: redirección a `/login` sin sesión o ante `401`.
  - Script `build` = `tsc --noEmit && vite build` (typecheck + build).
- **Seguridad**:
  - Todos los endpoints protegidos con `JwtAuthGuard` + `RolesGuard` y `@Roles(...)`.
  - `ValidationPipe` global activo (whitelist + transform) en `main.ts`.
  - El evaluador de una aplicación se toma del token JWT (`req.user.id`), no del cliente.
  - Sin token → 401; rol no autorizado → 403.
- **Reportes** (`src/reportes`):
  - `GET /reportes/resumen`: estadísticas globales.
  - `GET /reportes/aplicaciones/csv`: exportación CSV de todas las aplicaciones.
  - `GET /reportes/aplicaciones/:id/csv`: exportación CSV de una aplicación (candidato + dimensiones + global).
  - `GET /reportes/aplicaciones/:id/pdf`: **informe PDF** (pdfkit, sin dependencias nativas) con datos del candidato, resultado global, tabla por dimensión y recomendación.
  - `GET /reportes/candidatos/:id/historial-csv`: exportación CSV del historial completo de un candidato.
- **Re-aplicación**: `Aplicacion.numeroIntento` se auto-incrementa por candidato+prueba al crear una nueva aplicación.
- **Historial**: `GET /candidatos/:id/historial` devuelve todas las aplicaciones y resultados del candidato en el tiempo.
- **Frontend — pantallas de reportes**:
  - `Reportes` (`/reportes`): resumen estadístico + descarga CSV/PDF por aplicación.
  - `Historial` (`/historial`): timeline de aplicaciones por candidato + descarga del historial CSV.
  - `Resultados`: informe psicométrico redactado automáticamente + botones CSV/PDF por aplicación.
- **CRUD de pruebas (backend)**: `POST/PUT/DELETE /pruebas` (solo ADMIN) con `$transaction` que crea/actualiza prueba + dimensiones + preguntas + opciones + umbrales. `PATCH /pruebas/:id/estado` para activar/desactivar sin reconstruir estructura (no pierde datos). El detalle (`GET /pruebas/:id`) incluye los umbrales por dimensión.
- **Frontend — pantalla de administración de pruebas** (`/admin-pruebas`, solo ADMIN): listado de todas las pruebas (activas e inactivas) con conteos, y formulario por secciones (prueba → umbrales globales → dimensiones → preguntas → opciones → umbrales de dimensión) para crear/editar, con activar/desactivar y eliminar.
- **Frontend — AplicarPrueba**: barra de progreso fija (sticky) con "Pregunta X de Y" según el scroll, y **etiquetas Likert** (1=Muy en desacuerdo … 5=Muy de acuerdo) para las preguntas de escala, sin cambiar el modelo de datos.
- **Empresas** (`src/empresas`): CRUD `GET /empresas`, `POST /empresas`, `PUT /empresas/:id`. Listado ordenado con `_count` de candidatos. Modelo con `certificadoTitulo`, `ruc`, `direccion`, `telefono`. Creación/edición solo ADMIN.
- **Baterías** (`src/baterias`): CRUD `GET/POST /baterias`, `GET /baterias/activas`, `PUT/DELETE /baterias/:id`. Relación `BateriaPrueba` con `orden`. Validan existencia antes de actualizar/eliminar (`NotFoundException`).
- **Invitaciones** (`src/invitaciones`): flujo completo de evaluación externa.
  - `POST /invitaciones` crea la invitación con `token` aleatorio (32 bytes hex), expiración (por defecto 48 h), `intentos: 1` y una `Aplicacion` por prueba de la batería. Si `enviarCorreo` y el candidato tiene email, envía el enlace por SMTP.
  - `POST /invitaciones/:id/reintentar` (ADMIN): borra respuestas/resultados/aplicaciones anteriores y crea nuevas con `intentos+1` (máximo `MAX_INTENTOS = 2`). Rechaza revocadas y las que alcanzaron el máximo.
  - `POST /invitaciones/:id/cancelar` (ADMIN): marca la invitación como `REVOCADA`.
  - **Flujo público** (`/publico/examen`): `GET :token` devuelve batería, candidato y preguntas (sin opciones correctas ni valores); `POST :token/respuestas` guarda respuestas progresivamente (`skipDuplicates`); `POST :token/finalizar` guarda, califica cada aplicación vía `CalificacionService` y marca `COMPLETADA`. `validarToken` rechaza tokens inexistentes, revocados, completados o expirados.
  - El enlace público es `${FRONTEND_URL}/examen/:token` (variable `FRONTEND_URL`, por defecto `http://localhost:5173`).
- **Mail** (`src/mail`): `MailService` con `nodemailer`. `obtenerConfigMail()` devuelve `null` si `SMTP_HOST` no está definido (el envío se omite sin romper el flujo); `enviarCorreo()` captura errores y devuelve `boolean`.
- **Candidatos — importación masiva** (`src/candidatos`): `GET /candidatos/exportar` (CSV), `GET /candidatos/plantilla` (CSV descargable), `POST /candidatos/masivo` (multipart, Excel/CSV con `xlsx`). Resuelve/crea la empresa por nombre, normaliza cédula/email/edad, y reporta filas omitidas. Se agregó `fechaNacimiento` al candidato y la **edad** calculada en `encontrarTodos`, `buscarPorCedula` e `historial`.
- **Tests**: 101/101 pasando (12 suites: calificación, auth service, auth controller, roles guard, pruebas, candidatos, aplicaciones, reportes, baterías, empresas, invitaciones, mail).
- **Pendiente**: HTTPS detrás de proxy si se expone a Internet y monitorización/alertas de uptime. Ver el plan priorizado en `PLAN_DE_OPTIMIZACION.md`.
- **Docker dev/prod (15/08/2026)**: `docker-compose.yml` (desarrollo, hot-reload) y `docker-compose.prod.yml` (producción: imágenes multi-stage compiladas, frontend servido con Nginx, `JWT_SECRET` obligatorio con fail-fast, healthchecks, PostgreSQL solo en red interna, sin volúmenes de `node_modules`). Detalle en `PLAN_DE_OPTIMIZACION.md`.
- **Seguridad/hardening (16/08/2026)**: `helmet` (CSP off, API JSON) + CORS con `origin` explícito desde `CORS_ORIGIN` (lista separada por coma, por defecto `http://localhost:5173`); rate-limit global `@nestjs/throttler` (60 req/min) y estricto en `/auth/login` (5 intentos / 15 min, HTTP 429); healthchecks en backend y frontend en ambos composes.
- **Proceso (16/08/2026)**: CI GitHub Actions (`.github/workflows/ci.yml`: backend test+build, frontend build), `Makefile` (up/down/logs/prod/test/backup/restore, sin `-v`) y `backup.sh` (pg_dump + rotación 14 días, para cron).

## Incidentes resueltos

### 16/08/2026 — Lote de features aplicado (empresas, baterías, invitaciones, examen público, importación masiva, SMTP)
- **Empresas** y **Baterías**: CRUD completo con controladores, DTOs validados, migraciones Prisma y pantallas frontend (`/baterias`).
- **Invitaciones + examen público**: enlace por token sin autenticación, expiración, máximo 2 intentos con reintento (borra respuestas/resultados y regenera aplicaciones), cancelación/revocación, envío SMTP opcional y frontend `/invitaciones` + `/examen/:token`.
- **Importación masiva**: plantilla CSV, importación Excel/CSV y exportación CSV de candidatos; campo `fechaNacimiento` y edad calculada.
- Tests: se agregaron 40 tests nuevos (baterías, empresas, invitaciones, mail) → **101/101**; builds backend/frontend y compose dev/prod OK.

### 16/08/2026 — Lote P2/P3 aplicado (healthchecks, hardening, CI, Makefile, backups)
- **Healthchecks**: dev y prod ahora marcan backend y frontend como healthy (postgres ya lo tenía); `depends_on` con `condition: service_healthy`.
- **Hardening (P1-8)**: `helmet` + `CORS_ORIGIN` explícito en `main.ts`; `ThrottlerModule` global (60 req/min) y `@Throttle` en login (5/15 min, responde 429). `@nestjs/throttler` v6 y `helmet` v8 instalados.
- **Proceso (P3)**: `.github/workflows/ci.yml`, `Makefile`, `backup.sh` (pg_dump + rotación). Restore vía `make restore FILE=...`.
- 59/59 tests y builds OK; compose dev/prod válidos.

### 15/08/2026 — Lote P0 aplicado (modo producción en Docker)
- Se aplicaron las 4 mejoras críticas del plan manteniendo el concepto Docker: backend compilado (`Dockerfile.prod`), frontend estático con Nginx (`Dockerfile.prod` + `nginx.conf`), `docker-compose.prod.yml`, volúmenes de `node_modules` nombrados en dev, y fail-fast real de `JWT_SECRET` (`main.ts` + `jwt.strategy.ts` sin fallback). `prisma` CLI pasó a `dependencies` para `npm ci --omit=dev`. 59/59 tests y builds OK.

### 13/08/2026 — Login "Credenciales inválidas" (backend caído)
- **No era conflicto de puertos.** Dos fallos encadenados:
  1. `jwt.strategy.ts` rompía la compilación TS (`JWT_SECRET: string | undefined` no asignable a `secretOrKey`). En modo `--watch` el backend nunca arrancaba.
  2. El volumen anónimo `/app/node_modules` del compose conservó dependencias viejas sin `dotenv` tras el rebuild (`Cannot find module 'dotenv/config'`).
- Fixes (13/08): fallback de `JWT_SECRET` en `jwt.strategy.ts:12` y recreación del contenedor backend eliminando el volumen anónimo (BD intacta). **El fallback fue reemplazado el 15/08** por validación tipada sin secreto público.
- Lección clave del frontend: `Login.tsx` mostraba "Credenciales inválidas" para **cualquier** error de red/backend, no solo credenciales malas. **Resuelto el 16/08** (ver sección Lote P1).

### 16/08/2026 — Lote P1 aplicado (login honesto, code-splitting, red)
- **Login honesto**: el backend ahora responde `401` (`UnauthorizedException`) con retardo de 600 ms ante credenciales inválidas (antes 200 con `{message}`); `Login.tsx` distingue 401 ("Credenciales inválidas") de error de red/5xx ("No se pudo conectar con el servidor").
- **Code-splitting**: `React.lazy` + `Suspense` en todas las rutas y `manualChunks` (react/recharts) en `vite.config.ts`. Bundle inicial **655 kB → 225 kB**; Recharts (381 kB) solo se carga en `/resultados`.
- **Red**: Postgres de desarrollo atado a `127.0.0.1:5433` (en prod ya no se publica, solo red interna).
- 59/59 tests, builds OK, desplegado y validado en producción (201 login OK / 401 login malo).

## Deuda técnica / riesgo conocido (v0.1)
- **HTTPS**: backend (`3021`) y frontend (`5173`) se exponen en HTTP directo. Para Internet es recomendable un reverse proxy (Nginx/Traefik) con TLS. Para LAN/localhost el estado actual es seguro.
- **CORS/rate-limit/helmet**: aplicados (16/08/2026): `origin` explícito (`CORS_ORIGIN`), `helmet`, 60 req/min global y 5 intentos de login / 15 min (429).
- Frontend: bundle inicial 225 kB (gzip 75 kB) con Recharts en chunk aparte — code-splitting aplicado.
- PostgreSQL: en desarrollo atado a `127.0.0.1:5433`; en `docker-compose.prod.yml` no se publica.
- Backups (16/08/2026): **cron activo como root** (`30 3 * * *`, `COMPOSE_FILE=docker-compose.prod.yml`, log en `backups/backup.log`, retención 14 días) y **restore validado**: dump restaurado sin errores en una BD temporal (`psicometrico_restore_test`) dentro del contenedor, conteos idénticos a producción (Usuario=2, Candidato=2, Prueba=3, 15 tablas de dominio) y BD temporal eliminada después.