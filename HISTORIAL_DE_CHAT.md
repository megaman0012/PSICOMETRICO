

## ✅ CIERRE DE CASO - PROYECTO PSICOMÉTRICO v0.1 LISTA PARA DESPLIEGUE - `miércoles, 12 de agosto de 2026`

### Estado final del proyecto
- 🎯 **v0.1 publicada** en `git@github.com:megaman0012/PSICOMETRICO.git` (rama `main`).
- ✅ Funcionalidad completa: las 3 pruebas reales (Big Five 20 ítems IPIP, Integridad 20 situaciones, Aptitudes 10), motor genérico de calificación 0-100, roles ADMIN/EVALUADOR, historial por candidato, reportes CSV/PDF, CRUD de pruebas desde `/admin-pruebas` (solo ADMIN), barra de progreso sticky con "Pregunta X de Y" y etiquetas Likert.
- ✅ Despliegue preparado: configuración 100% vía `.env` (ver `.env.example`), sin secretos hardcodeados, `JWT_SECRET` obligatorio, seed idempotente, `docker compose up -d --build`.
- ✅ Verificación final: **59/59 tests** backend, typecheck + build frontend OK, `docker compose config` válido, e2e CRUD/estado/roles OK.

### Pendientes documentados para producción (no bloquean la v0.1)
- Cambiar `JWT_SECRET` (`openssl rand -base64 48`), `POSTGRES_PASSWORD` (alfanumérica) y credenciales del seed en el `.env` del servidor.
- Recomendado: proxy (Nginx/Traefik) con HTTPS, code-splitting de Recharts (bundle 655 kB) y modo build en vez de `start:dev` en compose de producción.

### Deuda técnica / backlog futuro
- Cifrado en tránsito y reposo de datos personales de candidatos (RGPD/local).
- Auditoría de intentos y token de aplicación para flujo autoservicio del candidato.
- Estandarización/validación psicométrica de umbrales con datos reales.

### Cierre
El caso queda **cerrado y guardado**. El proyecto queda en `/home/server-gea/Documentos/psicometrico/` y en GitHub listo para clonar en el servidor de producción y hacer pruebas reales.

---

## 🔧 DESPLIEGUE PREPARADO: CONFIGURACIÓN VÍA `.env` (pasos pre-despliegue listos) - `miércoles, 12 de agosto de 2026`

### Objetivo
Dejar listos los pasos previos al despliegue (antes solo documentados) para que en el servidor de producción sea
"clonar → crear `.env` → `docker compose up -d --build`" sin editar código ni secretos hardcodeados.

### Cambios
- ✅ **`.env.example` raíz** nuevo: documenta TODAS las variables del despliegue (`POSTGRES_*`, `JWT_SECRET`,
  `SEED_ADMIN_*`, `SEED_EVALUADOR_*`, `VITE_API_URL`) con comentarios y comando `openssl rand -base64 48` para el secreto.
- ✅ **`docker-compose.yml` parametrizado**: todos los secretos dejaron de estar hardcodeados y se inyectan desde `.env`
  con valores por defecto de desarrollo (`${VAR:-default}`). `DATABASE_URL` se construye con las credenciales del `.env`.
- ✅ **`backend/prisma/seed.ts`**: las credenciales iniciales de admin/evaluador ahora se leen de
  `SEED_ADMIN_EMAIL/PASSWORD` y `SEED_EVALUADOR_EMAIL/PASSWORD` (con los valores de dev como fallback). Solo corre la primera vez.
- ✅ **`JWT_SECRET` obligatorio (fail-fast)**: se eliminó el fallback hardcodeado (`tu_secreto_super_secreto_aqui`)
  de `auth.module.ts` y `jwt.strategy.ts`. El backend **no arranca** si `JWT_SECRET` no está definido (evita tokens falsificables).
- ✅ **`dotenv`** instalado en backend y cargado en `main.ts` (`import 'dotenv/config'`): el backend local ya lee su `.env`
  (antes solo Prisma lo leía), y en docker las variables del compose tienen prioridad.
- ✅ **README actualizado**: sección "Despliegue en Producción" ahora es copy-paste (clonar → `cp .env.example .env` →
  `openssl rand -base64 48` → editar credenciales → `docker compose up -d --build`), con acceso inicial y notas de red/HTTPS.

### Verificación
- ✅ Backend: **59/59 tests** | Frontend: typecheck + `vite build` OK | `docker compose config` válido.
- ⚠️ Recordatorio al desplegar: `POSTGRES_PASSWORD` debe ser alfanumérica (sin `@ : / #`) para no romper `DATABASE_URL`.


### Objetivo
Revisar el estado del proyecto antes de subir la v0.1 a `git@github.com:megaman0012/PSICOMETRICO.git` para clonarlo en el servidor de producción y hacer pruebas reales.

### Revisión de coherencia
- ✅ **Idea de negocio acorde**: la plataforma cumple exactamente el objetivo — aplicar/calificar/analizar las 3 pruebas reales (Big Five, Integridad, Aptitudes) para candidatos a Guardia de Seguridad, con motor genérico para agregar pruebas sin tocar código, rol ADMIN/EVALUADOR, historial por candidato y reportes CSV/PDF.
- ✅ **Documentación coherente**: `README.md`, `documentación_tecnica.md` y `HISTORIAL_DE_CHAT.md` coinciden con el código. Se **actualizó el README**: ruta `/admin-pruebas`, endpoints de CRUD de pruebas (`POST/PUT/DELETE /pruebas`, `PATCH /pruebas/:id/estado`, `GET /pruebas/todas`) y variable `JWT_SECRET` en la sección de entorno, más una sección nueva **"Despliegue en Producción"** (cambiar `JWT_SECRET`, credenciales de PostgreSQL, contraseñas del seed y HTTPS con proxy).

### Limpieza del código (preparación para el clon en producción)
- ✅ **`.gitignore` raíz** creado (node_modules, dist, .env, *.db, *.zip, logs, etc.). El zip de 165 MB (`Psicosometrico1.zip`) y la carpeta duplicada `psicosometrico/` quedaron fuera del repo.
- ✅ **`.env.example`** en backend y frontend (los `.env` reales quedan ignorados: nunca subir secretos).
- ✅ **`.dockerignore`** actualizado para no copiar `.env` ni `dist` a las imágenes.
- ✅ **Basura eliminada**: carpeta duplicada `psicosometrico/` (copia vieja del zip), `backend/prisma/dev.db` y `.env.sqlite.backup` (restos de la era SQLite), `.gitkeep` vacíos.
- ⚠️ **Problema del entorno local corregido**: los `node_modules` del host estaban incompletos y con permisos `000` (heredados de la restauración del zip), por lo que `jest`/`tsc` no corrían. Se reconstruyeron con `npm ci` en backend y frontend.

### Verificación final
- ✅ Backend: **59/59 tests** en 8 suites (`npm test`).
- ✅ Frontend: `npm run build` = typecheck + `vite build` correctos (655 kB, advertencia de Recharts documentada como pendiente de code-splitting).
- ✅ Contenedores sanos: `GET /health` → `{"status":"OK"}`, frontend `:5173` → 200.
- ✅ Acceso SSH a GitHub autenticado (`megaman0012`).

### Versión 0.1 en Git
- ✅ `git init` (rama `main`), commit **`3d38855` "v0.1: Plataforma psicométrica..."** (98 archivos, 21.081 líneas).
- ✅ Push a `origin/main` (`git@github.com:megaman0012/PSICOMETRICO.git`) completado.
- ✅ Repo en: https://github.com/megaman0012/PSICOMETRICO

### Flujo de trabajo de la plataforma (cómo se usa)
1. **Login** → el evaluador/administrador entra con su usuario (`admin@psicometrico.com` / `Admin123!` o `evaluador@psicometrico.com` / `Evaluador123!`).
2. **Registrar candidato** (`/candidatos`): nombre, apellido, cédula, email, teléfono y cargo postulado.
3. **Aplicar prueba** (`/aplicar`): asistente de 4 pasos → elegir candidato + prueba → responder preguntas por dimensión (Likert etiquetado 1=Muy en desacuerdo…5=Muy de acuerdo, o múltiple con opciones de texto; barra de progreso sticky con "Pregunta X de Y") → guardar → finalizar y calificar.
4. **Ver resultados** (`/resultados`): puntuación por dimensión (0-100), clasificación (Alta/Media/Baja o equivalente), interpretación, gráfica y **informe psicométrico** descargable en **CSV/PDF**.
5. **Historial** (`/historial`): todas las aplicaciones de un candidato en el tiempo (re-aplicación incrementa `numeroIntento`).
6. **Reportes** (`/reportes`): resumen estadístico global y exportación CSV/PDF.
7. **Admin** (`/usuarios`, `/admin-pruebas`): crear usuarios, y crear/editar/activar/desactivar/eliminar pruebas sin perder datos (solo ADMIN).

### Notas para producción
- En el servidor: cambiar `JWT_SECRET` (generar con `openssl rand -base64 48`), la contraseña de PostgreSQL y las credenciales por defecto del seed.
- Recomendado Nginx/Traefik con HTTPS delante del frontend.
- Pendiente futuro: code-splitting (Recharts) y modo build de producción en Docker (hoy el compose usa `start:dev` con watch).

---

## ⚡ QUICK WINS + ETIQUETAS LIKERT + ADMIN DE PRUEBAS (CRUD FRONTEND) - `miércoles, 12 de agosto de 2026`

Plan trabajado: A) Quick wins, B) Preguntas reales, C) CRUD de pruebas.

### A. Quick wins
- ✅ **A1 — Barra de progreso fija**: en `frontend/src/pages/AplicarPrueba.tsx` (paso 2) la barra de progreso ahora es `position: sticky; top: 0; z-10` y queda visible al hacer scroll. Además muestra **"Pregunta X de Y"** según la pregunta visible en el viewport (lista de referencias por pregunta + listener de `scroll`; el umbral es ~150 px para compensar la barra sticky).
- ✅ **A2 — Seed idempotente (confirmado)**: `backend/docker-entrypoint.sh` ya solo ejecuta el seed si la tabla de pruebas está vacía; los datos de CRUD no se pierden al reiniciar.

### B. Preguntas reales
- ✅ **B3/B4 — Ítems reales (confirmados en BD)**: `prisma/seed.ts` contiene los datos reales en español. Verificado en BD: **Big Five** 5 dimensiones / 20 preguntas IPIP (4 por factor, escala Likert), **Integridad** 4 categorías / 20 situaciones éticas con opciones de texto y puntaje 2/1/0, **Aptitudes Cognitivas** 4 competencias / 10 preguntas con opciones de texto 0/1.
- ✅ **B5 — Etiquetas Likert**: en `AplicarPrueba.tsx` las preguntas tipo `LIKERT` muestran texto en vez del número: **1 = Muy en desacuerdo · 2 = En desacuerdo · 3 = Neutral · 4 = De acuerdo · 5 = Muy de acuerdo**, más una leyenda de la escala cuando la prueba tiene preguntas Likert. El modelo de datos no cambió (el valor numérico de la opción se sigue usando para calificar).

### C. CRUD de pruebas
- ✅ **C6 — Backend (confirmado y corregido)**: `PruebasService.crear/actualizar/eliminar` ya usaban `$transaction` (prueba + dimensiones + preguntas + opciones + umbrales) y el controlador expone `POST/PUT/DELETE /pruebas` solo ADMIN. Se corrigieron **2 tests unitarios rotos** en `pruebas.service.spec.ts` (fugas en los mocks de `$transaction`: faltaban los `findUnique` internos y un `mockResolvedValueOnce(null)` para la verificación de nombre). Con esto la suite pasa completa.
- ✅ **C7 — Frontend de administración** (`/admin-pruebas`, solo ADMIN):
  - Nueva página `frontend/src/pages/AdministrarPruebas.tsx`:
    - **Listado**: todas las pruebas (activas e inactivas) con conteo de dimensiones y aplicaciones, estado y acciones.
    - **Crear/Editar**: formulario por secciones — datos de la prueba (nombre, descripción, versión, activa) → umbrales globales → dimensiones (con tipo de agregación SUMA/PROMEDIO y sus umbrales) → preguntas (LIKERT u OPCIÓN MÚLTIPLE) → opciones (texto, valor, esCorrecta). Botón **"Generar opciones Likert (1-5)"** por pregunta. Al editar, el formulario se rellena con el detalle actual.
    - **Activar/Desactivar** y **Eliminar** (con confirmación; el backend bloquea si la prueba tiene aplicaciones).
  - **Nuevo endpoint `PATCH /pruebas/:id/estado`** (solo ADMIN) para activar/desactivar **sin** reconstruir la estructura (no pierde respuestas ni resultados). Nuevo DTO `CambiarEstadoPruebaDto` en `crear-prueba.dto.ts`. Tests agregados en `pruebas.service.spec.ts`.
  - `GET /pruebas/:id` ahora incluye **los umbrales de cada dimensión** (`dimensiones.include.umbrales`); en el formulario los umbrales globales se filtran por `dimensionId` nulo (antes se mezclaban con los de dimensión).
  - Servicios en `api.ts`: `listarTodas`, `crear`, `actualizar`, `eliminar`, `cambiarEstado`. Tipos `CrearPruebaDto`/`Prueba*Input`/`UmbralClasificacion.dimensionId` en `types.ts`.
  - Ruta protegida por rol (`usuario.rol === 'ADMIN'`) y enlace **"Admin Pruebas"** en el menú solo para ADMIN (`App.tsx`, `Layout.tsx`).

### Verificación
- Backend: **59/59 tests pasan** (8 suites).
- Frontend: `npm run build` (typecheck + `vite build`) correcto; dev server en `:5173` sin errores (solo HMR).
- E2E (Docker, puerto 3021):
  - `GET /pruebas/todas` → lista las 3 pruebas con conteos.
  - `PATCH /pruebas/85/estado {activa:false}` → desactiva; `{activa:true}` → reactiva.
  - `GET /pruebas/85` → 18 umbrales en total, 3 globales (filtro `dimensionId` nulo), umbrales por dimensión correctos.
  - `POST /pruebas` crea prueba con estructura (id 88) → `DELETE` la elimina correctamente.
  - EVALUADOR en `POST /pruebas` → **403** (solo ADMIN).
- Nota: editar una prueba que ya tiene aplicaciones reconstruye su estructura (diseño actual del `PUT`); la UI muestra una advertencia y recomienda desactivarla en su lugar.

---

## 📊 REPORTES, HISTORIAL E INFORMES (PDF/CSV) + MÁS TESTS - `miércoles, 12 de agosto de 2026`

### Frontend — nuevas pantallas
- ✅ **`Reportes`** (`/reportes`): tarjetas con `GET /reportes/resumen` (candidatos, aplicaciones, completadas, pendientes, promedio global, distribución por clasificación) y listado de aplicaciones con botones **CSV** y **PDF** por cada una. Botón global "Exportar CSV (todas las aplicaciones)".
- ✅ **`Historial`** (`/historial`): seleccionar candidato → timeline de todas sus aplicaciones con intentos, estado, puntuación global y resultados por dimensión. Botón "Descargar CSV del historial".
- ✅ **Informe psicométrico**: en `Resultados`, sección "Informe psicométrico" que redacta automáticamente un informe textual (fortalezas/áreas de oportunidad según porcentaje ≥70 / <50 + interpretación global) y botones **Descargar CSV** / **Descargar PDF** por aplicación.
- ✅ **Servicios** (`api.ts`): `reportesService` (resumen, descargas vía `fetch` con token y `blob`) y `candidatosService.historial`. Tipo `HistorialCandidato`.

### Backend — reportes PDF y CSV
- ✅ **PDF del informe** (`GET /reportes/aplicaciones/:id/pdf`): generado con **pdfkit** (sin dependencias nativas, funciona en `node:18-slim`). Documento A4 con datos del candidato, resultado global, tabla por dimensión (Helvetica soporta acentos) y recomendación. Devuelve `application/pdf`.
- ✅ **CSV del historial de un candidato** (`GET /reportes/candidatos/:id/historial-csv`): datos del candidato + resumen por aplicación + detalle por dimensión.
- ✅ Refactor: `obtenerAplicacionCompleta` compartido para CSV/PDF. `RolesGuard` ahora devuelve `false` si `req.user` no existe (evita `500`; sigue siendo `JwtAuthGuard` quien responde `401`).

### Calidad — tests ampliados
- ✅ **`reportes.service.spec.ts`**: resumen (cálculo de promedios y distribución), CSV de aplicaciones, CSV de aplicación (incluido `NotFoundException`), CSV de historial, y **PDF** (buffer `%PDF-`, > 500 bytes).
- ✅ **`roles.guard.spec.ts`**: 5 casos (sin roles → permite; rol permitido → permite; rol no permitido → deniega; sin rol → deniega; sin usuario → deniega).
- ✅ **`auth.controller.spec.ts`**: login válido/inválido (usuario inexistente / contraseña incorrecta) y `/auth/me`.
- ✅ **51/51 tests en 8 suites** (antes 33/33 en 5 suites).

### Infraestructura / notas
- ⚠️ El volumen anónimo `/app/node_modules` del backend persistió dependencias viejas al añadir `pdfkit`; fue necesario `docker compose down` + recrear el volumen. Al agregar una dependencia nueva al backend recuerde: `npm install --package-lock-only` (host) → `docker compose up --build` → si persiste el error, `docker compose down` y volver a `up --build`.

### Verificación end-to-end (Docker, puerto 3021)
- Sin token → `/pruebas` devuelve **401**.
- EVALUADOR en `POST /usuarios` → **403**; ADMIN → **201**.
- EVALUADOR en `GET /reportes/resumen` → **200**.
- Crear aplicación → 20 respuestas máximas → guardar (201) → finalizar (201) → global **Alta (100)**.
- `GET /reportes/aplicaciones/8/pdf` → **200**, `application/pdf`, comienza con `%PDF-`.
- CSV por aplicación y CSV de historial con contenido correcto.
- Typecheck y `vite build` del frontend correctos.

---

## 🖥️ FRONTEND FUNCIONAL + NORMALIZACIÓN DEL RESULTADO GLOBAL - `miércoles, 12 de agosto de 2026`

### Frontend (React + Vite + Tailwind + Recharts + react-router-dom)
- ✅ **Frontend real construido** (dejó de ser un placeholder). Rutas protegidas por JWT.
- ✅ **Autenticación**: pantalla de login, `AuthContext` (token en `localStorage`, perfil vía `GET /auth/me`, logout). Redirección automática a `/login` ante `401`.
- ✅ **Servicios API** (`src/services/api.ts`): auth, pruebas, candidatos, aplicaciones, usuarios, con interceptor que inyecta el token `Bearer`.
- ✅ **Páginas**:
  - `Login` — inicio de sesión con credenciales del seed.
  - `Dashboard` — estadísticas (pruebas, candidatos, aplicaciones, completadas/pendientes) y acciones rápidas.
  - `Pruebas` / `PruebaDetalle` — listado y detalle con dimensiones, preguntas y opciones.
  - `Candidatos` — listado, registro y búsqueda por cédula.
  - `AplicarPrueba` — asistente de 4 pasos: configurar → responder (agrupadas por dimensión con barra de progreso) → guardar → finalizar y ver resultados.
  - `Resultados` — listado de aplicaciones, gráfica de barras por dimensión (Recharts), puntuación global y detalle con clasificación/interpretación.
  - `Usuarios` — solo ADMIN: crear y listar usuarios.
- ✅ **Nuevo endpoint `GET /aplicaciones`** en el backend (listado con candidato, prueba y resultados) para alimentar Resultados/Dashboard.
- ✅ **`index.html`**: se removió el favicon inexistente. **`src/vite-env.d.ts`** creado (faltaban los tipos de `import.meta.env`).
- ✅ **tsconfig**: eliminada la referencia a `tsconfig.node.json` que rompía `tsc --noEmit`. Script `build` ahora es `tsc --noEmit && vite build`.
- ✅ **Dockerfile del frontend**: `docker-entrypoint.sh` que ejecuta `npm install` al arrancar (el volumen anónimo de `node_modules` quedaba desactualizado al añadir dependencias) y `CMD` corregido en compose.
- ✅ Typecheck limpio y `vite build` de producción correcto.

### Backend — normalización del resultado global (bug de escala)
- ✅ **Bug corregido**: `calcularYGuardarResultadoGlobal` mezclaba escalas (Big Five 0-100, Integridad 0-10, Aptitudes 0-10), por lo que los umbrales globales nunca clasificaban bien (siempre "Sin clasificar" o "Baja").
- ✅ Ahora **toda dimensión se normaliza a 0-100** antes de ponderar: para `SUMA` se divide entre la suma de los valores máximos de opción; para `PROMEDIO` entre el valor máximo de la escala Likert. La consulta incluye `opciones: { select: { valor: true } }`.
- ✅ **Seed**: agregados umbrales **globales** (sin `dimensionId`) para las 3 pruebas en escala 0-100 (Big Five Alta/Moderada/Baja, Integridad Alta/Media/Baja, Aptitudes Muy Apto/Apto/No Apto). Antes el Big Five no tenía umbrales globales.
- ✅ **Spec actualizado** para el nuevo `include` y datos de ejemplo coherentes (SUMA máx 4, PROMEDIO máx 5, umbrales globales 0-100). **9/9 tests pasan**.

### Verificación
- Flujo end-to-end vía API: login → crear aplicación → guardar respuestas → finalizar.
  - Todas las respuestas = valor mínimo (1) → **Global "Baja" (20.0)**.
  - Todas las respuestas = valor máximo (5) → **Global "Alta" (100.0)**, dimensiones "Alta" 100%.
- `npx jest` en el contenedor → **9/9 tests pasan**.
- `npm run build` del frontend → typecheck + `vite build` correctos.
- Frontend responde `HTTP 200` en `http://localhost:5173`; backend en `http://localhost:3021`.

### Pendiente
- Reportes CSV/PDF (hay dependencia `recharts`; falta backend de exportación).
- Proteger rutas de creación de aplicaciones/candidatos con `RolesGuard` según sea necesario.
- Code-splitting del frontend (bundle > 500 kB por Recharts).

---
## 🚀 ARRANQUE DEL PROYECTO EN DOCKER Y ARREGLO DE BUGS CRÍTICOS - `miércoles, 12 de agosto de 2026`

### Contexto
El proyecto estaba incompleto: el backend no compilaba, faltaban módulos esenciales de Prisma, el frontend no tenía `index.html` y todo estaba con permisos `000` (restaurados de un `.zip`).

### Arreglos del backend (críticos)
- ✅ **Permisos**: todos los archivos pasaron de `000` a `644` (archivos) / `755` (directorios), sin tocar `node_modules`.
- ✅ **Creados los archivos faltantes**: `src/prisma/prisma.service.ts` y `src/prisma/prisma.module.ts` (era el módulo que más se importaba y no existía).
- ✅ **`src/app.module.ts`**: se cerró el literal de string roto (`'./calificacion/calificacion.module;` → `'...module'`).
- ✅ **`src/pruebas/pruebas.service.ts`**: corregido `this.prueba.prueba` → `this.prisma.prueba` (2 métodos).
- ✅ **Inconsistencia `role` vs `rol`**: el schema usa `rol`; se corrigió en `auth.service.ts` y `jwt.strategy.ts` (antes el JWT y el `req.user` perdían el rol).
- ✅ **Inconsistencia en auth**: `AuthModule` exportaba `Roles` (un decorador, no un provider) → error de runtime; ahora solo exporta `RolesGuard`.
- ✅ **CORS habilitado** y `ValidationPipe` global en `main.ts` (necesario para que el frontend en :5173 hable con la API en :3021).
- ✅ **Imports sin usar eliminados** (TS6133 por `noUnusedLocals`): `Request`, `ParseIntPipe`, `IsInt`, `Min`, `UnauthorizedException`.
- ✅ **DTOs**: agregada asignación definitiva (`!`) para cumplir `strictPropertyInitialization`.

### Base de datos / Prisma
- ✅ **Nuevo modelo `Respuesta`** en `schema.prisma` (relaciona aplicación → pregunta → opción elegida, con `@@unique([aplicacionId, preguntaId])`).
- ✅ **Relación evaluador**: `Aplicacion.usuarioId → Usuario` (antes el `evaluadorId` se validaba pero no se guardaba).
- ✅ **Clasificación persistida**: `ResultadoDimension` y `ResultadoGlobal` ahora guardan `clasificacion` e `interpretacion` (antes se calculaban y se descartaban).
- ✅ **Migración regenerada desde cero**: `20260812000000_init` incluye el enum `TipoAgregacion`, `Usuario` y `Respuesta` (la anterior no los tenía).
- ✅ **Seed actualizado**: crea 2 usuarios (`admin@psicometrico.com` / `Admin123!` y `evaluador@psicometrico.com` / `Evaluador123!`), 3 pruebas con `tipoAgregacion` correcto (Big Five = PROMEDIO, Integridad/Aptitudes = SUMA), umbrales y un candidato de ejemplo.

### Motor de calificación
- ✅ **Bug del peso global (l.334)**: la consulta de dimensiones no traía `preguntas`, así que `dimension.preguntas?.length` siempre era `1`; ahora incluye `preguntas: { select: { id: true } }`.
- ✅ **Comparaciones Decimal**: los umbrales de Prisma vienen como `Decimal`; se normalizaron con `Number()` en `obtenerClasificacion`.
- ✅ **`error` unknown** en el catch del cálculo global (`error.message` → manejo con `instanceof Error`).
- ✅ **Código muerto eliminado**: consulta `respuestas` sin uso en el cálculo global.
- ✅ **Spec corregido**: el mock usaba `dimensione` (typo) en vez de `dimension`, faltaba mockear `aplicacion.findUnique` y `dimension.findUnique`, y el conteo de llamadas de `calcularPuntuacionDimension` pasó de 2 a 4 (el global recalcula cada dimensión). **9/9 tests pasan**.
- ✅ **Configuración de Jest**: creado `backend/jest.config.js` con preset `ts-jest` y `rootDir: 'src'` (antes corría con babel-jest y además recogía los `.spec.js` compilados en `dist/`). Añadidos scripts `test` y `test:watch`.

### Frontend
- ✅ **Creado `index.html`** (faltaba; sin él Vite no arranca).
- ✅ Eliminada la carpeta basura `src/{components,pages,services,hooks,utils,assets}`.
- ✅ `vite.config.ts` con `host: true` (accesible desde el host en Docker) y `.env` con `VITE_API_URL=http://localhost:3021`.

### Docker
- ✅ **Puerto externo del backend: `3021`** (interno `3000`), frontend en `5173`, postgres expuesto en `5433`.
- ✅ `VITE_API_URL` corregido a `http://localhost:3021` (antes apuntaba a `http://backend:3021`, inalcanzable desde el navegador).
- ✅ **Dockerfile del backend**: imagen `node:18-slim` + `openssl` (Prisma falla en `alpine` por OpenSSL/musl) y `npx prisma generate` tras el build.
- ✅ **`docker-entrypoint.sh`**: genera el cliente, aplica migraciones (con reset de respaldo en dev), corre el seed y arranca `start:dev`.
- ✅ Compose sin la clave `version` obsoleta.

### Verificación realizada
- `GET /health` → `{"status":"OK"}` en `http://localhost:3021`.
- Login admin y evaluador OK; `GET /auth/me` devuelve `rol: "ADMIN"`.
- `GET /pruebas` lista las 3 pruebas; `GET /pruebas/1` muestra dimensiones con `tipoAgregacion`.
- Flujo completo: crear aplicación → guardar 20 respuestas → finalizar → resultados por dimensión con clasificación e interpretación, global calculado.
- `npx jest` → **9/9 tests pasan**.
- Frontend responde `HTTP 200` en `http://localhost:5173` con la API apuntando a `:3021`.

### Para levantar el entorno
```bash
cd /home/server-gea/Documentos/psicometrico
docker compose down -v   # solo si se quiere una base limpia (dev)
docker compose up --build -d
```

### Credenciales de acceso
| Rol       | Email                    | Password        |
|-----------|--------------------------|-----------------|
| Admin     | admin@psicometrico.com   | Admin123!       |
| Evaluador | evaluador@psicometrico.com | Evaluador123!  |

### Pendiente (siguientes pasos)
- Construir el frontend real: pantalla de login, listado de pruebas, formulario de aplicación de pruebas, panel de resultados y reportes (hoy es solo un placeholder que verifica `/health`).
- Endpoints de reportes CSV/PDF.
- Proteger el resto de rutas con `RolesGuard` donde aplique.

---
## ✅ TESTS UNITARIOS DEL MOTOR DE CALIFICACIÓN COMPLETADOS - `lunes, 3 de agosto de 2026`

Se han escrito exitosamente los tests unitarios para el motor de calificación con los siguientes componentes:

- **Test File**: `src/calificacion/calificacion.service.spec.ts`
- **Framework**: Jest con Ts-Jest
- **Cobertura**: Tests unitarios comprehensivos para el servicio de calificacion

Los tests cubren:

### ✅ Tests para `calcularPuntuacionDimension`:
- Cálculo correcto para agregación SUMA (suma de valores de respuestas)
- Cálculo correcto para agregación PROMEDIO (promedio de valores de respuestas)
- Manejo graceful de respuestas faltantes (asumiendo valor 0 para preguntas no respondidas)

### ✅ Tests para `obtenerClasificacion`:
- Clasificación correcta basada en umbrales globales de prueba
- Clasificación correcta basada en umbrales específicos de dimensión
- Manejo de caso cuando no hay umbrales definidos (retorna clasificación por defecto)

### ✅ Tests para `finalizarAplicacion`:
- Flujo completo de calificación: aplicación → dimensiones → resultados → global → marcado como completada
- Manejo de error cuando la aplicación no existe
- Manejo de error cuando la aplicación ya está completada
- Verificación de que se llaman todas las funciones esperadas en el orden correcto

Estos tests utilizan datos simulados que representan los 3 tipos de pruebas reales:
1. **Big Five**: Preguntas LIKERT 1-5 con agregación PROMEDIO por dimensión
2. **Integridad**: Preguntas OPCIÓN MÚLTIPLE con valores 0/1/2 y agregación SUMA
3. **Aptitudes Cognitivas**: Preguntas OPCIÓN MÚLTIPLE con valores 0/1 y agregación SUMA

Próximo paso: Completar Autenticación JWT agregando endpoint /auth/me (TODO #7).

---

## 🔒 SEGURIDAD, REPORTES Y REAPLICACIÓN - `miércoles, 12 de agosto de 2026`

### Tarea 1: RolesGuard + validación en todos los endpoints
- Todos los controladores del backend ahora usan `@UseGuards(JwtAuthGuard, RolesGuard)`:
  - `PruebasController`, `CandidatosController`, `AplicacionesController`, `UsuariosController` (ya lo tenía) y el nuevo `ReportesController`.
  - `@Roles('ADMIN', 'EVALUADOR')` en los endpoints de operación; `@Roles('ADMIN')` sigue en `usuarios`.
- **Validación real**: el `ValidationPipe` global de `main.ts` (whitelist + transform) ya estaba activo; se confirma que los DTOs se aplican en todas las peticiones.
- **Mejora de seguridad**: al crear una aplicación, el `evaluadorId` ya **no** se acepta del cliente; el controlador lo sobreescribe con `req.user.id` del token JWT (`aplicaciones.controller.ts`). El DTO `evaluadorId` ahora es opcional.
- Errores: se reemplazaron los `throw new Error` por `NotFoundException` para respuestas HTTP correctas (404).
- Verificado: sin token → `401`; con token de rol equivocado → `403`.

### Tarea 2: Módulo de reportes (`src/reportes`)
- `GET /reportes/resumen` → estadísticas globales (candidatos, aplicaciones, completadas/pendientes, promedio global, distribución por clasificación).
- `GET /reportes/aplicaciones/csv` → exporta todas las aplicaciones a CSV (descarga).
- `GET /reportes/aplicaciones/:id/csv` → exporta una aplicación con sus resultados por dimensión + global.
- CSV con escape de comas/comillas, BOM y `Content-Disposition` para descarga.

### Tarea 3: Re-aplicación (`numeroIntento`)
- `AplicacionesService.crear` calcula `numeroIntento` = máximo intento existente del candidato+prueba + 1 (el campo ya existía en el schema con `@default(1)`).
- Verificado: primera app → intento 1, segunda app del mismo candidato+prueba → intento 2.

### Tarea 4: Historial por candidato
- `GET /candidatos/:id/historial` → candidato con todas sus aplicaciones (prueba, resultados globales y por dimensión) ordenadas por fecha descendente.

### Verificación end-to-end (Docker, puerto 3021)
- Login ADMIN → crear aplicación sin `evaluadorId` (usa token) → guardar respuestas máximas → finalizar → global **Alta** → re-aplicar (intento 2) → historial muestra ambos intentos.

### Tarea 5: Tests unitarios de servicios
- **33 tests en 5 suites, todos pasando** (`npx jest` dentro del contenedor):
  - `calificacion.service.spec.ts`: 9 tests del motor (SUMA/PROMEDIO, umbrales, finalización).
  - `auth.service.spec.ts`: 4 tests (validateUser válido/contraseña incorrecta/usuario inexistente; login firma JWT con `email`, `sub`, `rol`).
  - `pruebas.service.spec.ts`: 3 tests (listar activas, detalle completo, no encontrada).
  - `candidatos.service.spec.ts`: 5 tests (crear, listar, buscar por cédula, historial).
  - `aplicaciones.service.spec.ts`: 12 tests (crear con intento 1/incremento/errores, listar, detalle, guardar respuestas, finalizar y delegación al motor).
- Patrón: mock de `PrismaService` y de `CalificacionService`; mock del módulo `bcryptjs`.

---