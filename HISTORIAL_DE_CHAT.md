




## ⚙️ SESIÓN: BATERÍAS, EMPRESAS, INVITACIONES (EXAMEN PÚBLICO), IMPORTACIÓN MASIVA Y SMTP + TESTS Y DOCS - `domingo, 16 de agosto de 2026`

### Objetivo
Cerrar los pendientes detectados al revisar el WIP de features: (1) sin tests para los módulos
nuevos, (2) documentación desactualizada, (3) WIP sin commitear, (4) historial de la sesión no
registrado.

### Cambios

**1. Tests de los módulos nuevos (40 tests nuevos → 101/101):**
- `backend/src/baterias/baterias.service.spec.ts`: `listar`, `listarActivas`, `crear` (con/sin `pruebaIds`), `actualizar` (no encontrada → `NotFoundException`; reemplazo de pruebas con `deleteMany`/`create`), `eliminar`.
- `backend/src/empresas/empresas.service.spec.ts`: `listar` (con `_count` de candidatos), `crear`, `actualizar`.
- `backend/src/invitaciones/invitaciones.service.spec.ts`: flujo completo — `crear` (con/sin correo, batería inactiva, sin pruebas, candidato inexistente), `listar`, `detalle`, `reintentar` (máx. intentos, revocada, reset de respuestas), `cancelar`, `obtenerExamen` (estructura, token inválido/revocado/completado/expirado), `guardarRespuestas` y `finalizar` (con validación de aplicaciones ajenas).
- `backend/src/mail/mail.service.spec.ts`: `obtenerConfigMail` (sin SMTP_HOST → null; defaults; configuración completa) y `enviarCorreo` (sin SMTP → false; envío OK → true con los args correctos; error → false).

**2. Documentación actualizada:**
- `README.md`: nuevas features (empresas, baterías, invitaciones con examen público, importación masiva, SMTP, fecha de nacimiento/edad); rutas nuevas (`/baterias`, `/invitaciones`, `/examen/:token`); endpoints nuevos de empresas/baterías/invitaciones/examen público/candidatos; variables `FRONTEND_URL` y `SMTP_*`; conteo de tests en el Makefile (101/101).
- `documentación_tecnica.md`: secciones nuevas para Empresas, Baterías, Invitaciones (flujo público), Mail e importación masiva; entrada en "Incidentes resueltos"; conteos de tests actualizados.

**3. Commits (2):**
- `bb10dd8` `feat(invitaciones)`: baterías, empresas, invitaciones con examen público, importación masiva y SMTP (40 archivos, +2513).
- `409b7ef` `test(docs)`: cobertura de módulos nuevos (101/101) y documentación actualizada (7 archivos, +907).

**4. Historial:** esta entrada.

### Verificación
- ✅ Backend: **101/101 tests** (12 suites) · `nest build` OK.
- ✅ Frontend: `npm run build` OK (typecheck + bundle, code-splitting intacto).
- ✅ `docker compose config` válido para dev y prod.
- ✅ Working tree limpio tras los 2 commits; 5 commits locales adelante de `origin/main` (pendiente `git push`).

### Pendientes (siguiente sesión)
- `git push` de los 5 commits locales a `origin/main`.
- Validación e2e en producción del flujo de invitación (crear → abrir `/examen/:token` → finalizar → ver resultados).
- Programar el cron de backups y probar un restore real (deuda registrada).
- Mejora continua: HTTPS detrás de reverse proxy, monitorización/alertas de uptime.

---

## ⚙️ LOTE P2/P3 APLICADO: HEALTHCHECKS, HARDENING, CI, MAKEFILE Y BACKUPS (P1-6, P1-8, P3-11/12/13) - `sábado, 16 de agosto de 2026`

### Objetivo
Cerrar los pendientes de calidad/seguridad del plan: healthchecks en desarrollo, CORS explícito +
helmet + rate-limit, y la infraestructura de proceso (CI, Makefile, backups). Detalle en
`PLAN_DE_OPTIMIZACION.md` (sección "Aplicado — Lote P2/P3").

### Cambios
- **`docker-compose.yml`** (dev): healthcheck para backend (`fetch` a `:3000/health`) y frontend
  (dev server `:5173`); `depends_on` con `condition: service_healthy`.
- **`docker-compose.prod.yml`**: healthcheck del frontend Nginx (`wget` a `:80`); se añadió
  `CORS_ORIGIN` al backend.
- **`backend/src/main.ts`**: `helmet` (CSP desactivado: API JSON) + CORS con `origin` explícito
  desde `CORS_ORIGIN` (lista separada por coma, por defecto `http://localhost:5173`).
- **`backend/src/app.module.ts`**: `ThrottlerModule.forRoot` (60 req/min global) con
  `ThrottlerGuard` como `APP_GUARD`.
- **`backend/src/auth/auth.controller.ts`**: `@Throttle({ default: { limit: 5, ttl: 900000 } })`
  en `/auth/login` (5 intentos / 15 min) además del retardo de 600 ms.
- **`backend/package.json`**: + `@nestjs/throttler`, + `helmet`.
- **`.env.example`**: + `CORS_ORIGIN`.
- **`.github/workflows/ci.yml`** (nuevo): backend (`npm ci` → `prisma generate` → `npm test` →
  `npm run build`) y frontend (`npm ci` → `npm run build`) en cada push/PR a `main`.
- **`Makefile`** (nuevo): `up/down/logs/prod/prod-down/prod-logs/test/backup/restore`. Sin `-v`.
- **`backup.sh`** (nuevo, ejecutable): `pg_dump` + rotación 14 días, usable desde cron con
  `COMPOSE_FILE=docker-compose.prod.yml`.

### Verificación
- ✅ Backend: **59/59 tests** · `nest build` OK.
- ✅ `docker compose config` válido para dev y prod.
- ✅ Dependencias nuevas instaladas y compiladas (throttler v6, helmet v8).
- ✅ Desplegado en producción: 3/3 contenedores **healthy**; healthcheck frontend usa
  `http://127.0.0.1/` porque `wget` resolvía `localhost` a `::1` (IPv6) y nginx solo escucha IPv4.
- ✅ Helmet: headers de seguridad presentes (X-Frame-Options, nosniff, Referrer-Policy...).
- ✅ CORS: preflight con `http://localhost:5173` → `Access-Control-Allow-Origin` presente;
  origen no permitido → **sin** header (bloqueado por el navegador).
- ✅ Rate-limit: 6 intentos de login → 5×`401` y el 6º `429 Too Many Requests` (5/15 min); el
  contador en memoria se limpia reiniciando el backend.
- ✅ Login real tras el fix: `201` con JWT · frontend index y SPA `/dashboard` 200.

### Pendientes (siguiente sesión)
- Ninguno del plan. Mejora continua: HTTPS detrás de reverse proxy si se expone a Internet,
  monitorización/alertas de uptime.

---

## ⚙️ LOTE P1 APLICADO: LOGIN HONESTO, CODE-SPLITTING Y RED (P1-5, P2-10, P1-7) - `sábado, 16 de agosto de 2026`

### Objetivo
Resolver la causa raíz del incidente del 13/08 (mensaje de login engañoso), reducir el bundle del
frontend con code-splitting y endurecer la red (Postgres solo local). Detalle en
`PLAN_DE_OPTIMIZACION.md` (sección "Aplicado — Lote P1").

### Cambios
- **`backend/src/auth/auth.controller.ts`**: credenciales inválidas ahora lanzan
  `UnauthorizedException` (**HTTP 401**); antes devolvían **200** con `{message}`. Se añadió un
  retardo de 600 ms en el rechazo para frenar fuerza bruta.
- **`backend/src/auth/auth.controller.spec.ts`**: los 2 tests de credenciales inválidas ahora
  esperan `rejects.toThrow(UnauthorizedException)`.
- **`frontend/src/pages/Login.tsx`**: distingue **401** ("Credenciales inválidas...") de error de
  red/5xx ("No se pudo conectar con el servidor. Verifique que el backend esté arriba (puerto 3021)...") —
  el mensaje que causó el incidente del 13/08 ya no se muestra cuando el problema es el backend caído.
- **`frontend/src/App.tsx`**: `React.lazy` + `Suspense` en todas las rutas (Login queda eager) con
  fallback spinner.
- **`frontend/vite.config.ts`**: `build.manualChunks` separando `react` y `recharts`.
- **`docker-compose.yml`** (dev): Postgres atado a **`127.0.0.1:5433`** (ya no expuesto a la red).
  En `docker-compose.prod.yml` Postgres ya no se exponía (solo red interna).

### Verificación
- ✅ Backend: **59/59 tests** (`npm test`) · `nest build` OK.
- ✅ Frontend: `tsc --noEmit` + `vite build` OK. Bundle inicial **655 kB → 225 kB** (gzip 75 kB);
  Recharts (381 kB) queda en el chunk `Resultados-*.js` que solo se descarga al abrir esa página.
- ✅ `docker compose config` válido para dev y prod.
- ✅ Login 401 probado contra el backend: credenciales malas → 401; correctas → 201 con JWT.
- ⚠️ Imágenes `:prod` reconstruidas y desplegadas en esta máquina (ver "LOTE P1 EN MARCHA").

### Pendientes (siguiente sesión)
- Aplicado en el lote P2/P3 de hoy: P1-6, P1-8 y P3-11/12/13 (ver sección arriba).

---

## ⚙️ LOTE P1 EN MARCHA: PRODUCCIÓN ACTUALIZADA - `sábado, 16 de agosto de 2026`

### Pasos ejecutados
1. Cambios de código del lote P1 (login honesto, code-splitting, red) aplicados y validados
   (tests 59/59, builds OK, compose config OK).
2. **Rebuild de imágenes `:prod`** (`docker compose -f docker-compose.prod.yml up -d --build`).
3. Smoke test end-to-end en producción (ver "Verificación" abajo).

### Verificación end-to-end (producción)
- ✅ `GET /health` → `{"status":"OK"}`.
- ✅ `POST /auth/login` credenciales correctas → `201` con `access_token`.
- ✅ `POST /auth/login` credenciales incorrectas → **401** (antes 200 con mensaje).
- ✅ Frontend: index `200` y chunk principal reducido (225 kB); `/resultados` carga Recharts en
  chunk aparte.

---

## ⚙️ LOTE P0 APLICADO: MODO PRODUCCIÓN EN DOCKER (builds, nginx, volúmenes y JWT fail-fast) - `sábado, 15 de agosto de 2026`

### Objetivo
Mantener el concepto Docker (trabajar con `docker compose`) y hacerlo instalable en un servidor de
producción: backend compilado, frontend como build estático con Nginx, eliminar los volúmenes
anónimos de `node_modules` y fail-fast real de `JWT_SECRET`. Detalle completo en
`PLAN_DE_OPTIMIZACION.md` (sección "Aplicado — Lote P0").

### Cambios
- **`backend/Dockerfile.prod`** (nuevo): multi-stage — build (`npm ci` + `nest build`) → runtime
  (`node:18-slim`, `npm ci --omit=dev`, `node dist/src/main.js`).
- **`backend/docker-entrypoint.prod.sh`** (nuevo): `prisma migrate deploy` + seed idempotente con el
  seed **compilado** (`dist/prisma/seed.js`) y sin el reset destructivo de desarrollo.
- **`frontend/Dockerfile.prod` + `frontend/nginx.conf`** (nuevos): `vite build` → estáticos servidos
  por **Nginx** (SPA fallback + gzip). `VITE_API_URL` como build arg.
- **`docker-compose.prod.yml`** (nuevo): imágenes compiladas, sin bind mounts ni volúmenes de
  `node_modules`, `NODE_ENV=production`, `JWT_SECRET` obligatorio (`:?`), healthchecks en
  backend/frontend, PostgreSQL solo en red interna.
- **`docker-compose.yml`** (dev): volúmenes anónimos `/app/node_modules` → **volúmenes nombrados**
  recreables (`docker volume rm psicometrico_backend_node_modules ...`) sin tocar la base.
- **`backend/src/main.ts`**: en `NODE_ENV=production`, si `JWT_SECRET` falta o es el valor por
  defecto → `[FATAL]` + `process.exit(1)`.
- **`backend/src/auth/jwt.strategy.ts`**: eliminado el fallback `|| 'cambia_este_secreto_en_produccion'`
  (el fix del 13/08 queda reemplazado por un getter tipado que valida en runtime).
- **`backend/package.json`**: `prisma` CLI movido a `dependencies` (el runtime con `--omit=dev`
  necesita ejecutar `migrate deploy`). Lockfile regenerado.

### Verificación
- ✅ `docker compose config` válido para dev y prod; el prod **aborta** sin `JWT_SECRET`.
- ✅ Backend: **59/59 tests** y `nest build` OK.
- ✅ Frontend: `vite build` OK (bundle 655 kB; code-splitting queda en P2-10).
- ✅ Fail-fast probado sobre el binario: con el secreto por defecto sale `[FATAL]` y `exit 1`.
- ✅ Escenario runtime real validado en carpeta limpia: `npm ci --omit=dev` instala Prisma CLI 5.22,
  genera el cliente y la gráfica de módulos compilados carga sin dependencias de desarrollo.
- ⚠️ La build de las imágenes quedó pendiente del daemon Docker (estaba apagado en la máquina).
- ✅ **DESPLIEGUE EJECUTADO Y VALIDADO el `16/08/2026`** (ver sección "LOTE P0 EN MARCHA" abajo):
  imágenes `:prod` construidas y corriendo en esta máquina con el compose de producción.

### Uso
```bash
# Desarrollo (hot-reload, como siempre)
docker compose up -d --build

# Producción (instalable en servidor)
cp .env.example .env      # configure JWT_SECRET (openssl rand -base64 48), POSTGRES_PASSWORD, seed
docker compose -f docker-compose.prod.yml up -d --build
```

### Pendientes (siguiente sesión)
- Aplicado en el lote P2/P3 de hoy (ver sección arriba). (P1-5, P2-10 y P1-7 ya aplicados — ver "LOTE P1 APLICADO".)

---

## ⚙️ LOTE P0 EN MARCHA: PRODUCCIÓN EJECUTADO EN ESTA MÁQUINA - `sábado, 16 de agosto de 2026`

### Contexto
El daemon de Docker estaba apagado (`docker.service` `disabled`/`inactive`). Se activó con
`systemctl start docker` y se habilitó con `systemctl enable --now docker` para que arranque solo
en reinicios del servidor.

### Pasos ejecutados
1. **`.env` raíz creado** desde `.env.example` con `JWT_SECRET` real generado con `openssl rand -base64 48`.
2. **`docker compose down`** → apagó los 3 contenedores dev (`psicometrico-postgres`,
   `psicometrico-backend`, `psicometrico-frontend`) y su red. El volumen `psicometrico_postgres_data`
   se conservó (la BD no se perdió).
3. **Build de imágenes `:prod`** con el daemon activo:
   - `psicometrico-backend:prod` 619 MB (vs 898 MB de la dev) — multi-stage funcionando.
   - `psicometrico-frontend:prod` 73.5 MB (vs 355 MB de la dev) — nginx + build estático.
4. **`docker compose -f docker-compose.prod.yml up -d`** → los 3 servicios arriba. Se corrigió de
   paso el tag de imagen: dev y prod usaban el mismo nombre (`psicometrico-backend`) y se pisaban;
   ahora prod usa tags explícitos `:prod` (`docker-compose.prod.yml:33` y `:62`).

### Verificación end-to-end (producción)
- ✅ `GET /health` → `{"status":"OK"}` · backend healthy (healthcheck OK).
- ✅ Frontend nginx: index `200`, ruta SPA `/dashboard` `200` (fallback funcionando).
- ✅ `POST /auth/login` con `admin@psicometrico.com` → `201` con `access_token` JWT (sub: 58,
  rol ADMIN) → confirma que **los datos de la BD dev se conservaron** (el seed no se re-ejecutó).
- ✅ Migraciones + seed idempotente corrieron en el arranque; todas las rutas mapeadas.

### Comandos de operación (producción)
```bash
# Estado / logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend

# Actualizar tras cambios
docker compose -f docker-compose.prod.yml up -d --build

# Bajar (no borra postgres_data)
docker compose -f docker-compose.prod.yml down

# Volver a desarrollo (hot-reload) cuando se quiera
docker compose -f docker-compose.prod.yml down
docker compose up -d --build
```

### Pendientes (siguiente sesión)
- Aplicado en el lote P2/P3 de hoy (ver sección arriba). (P1-5, P2-10 y P1-7 ya aplicados — ver "LOTE P1 APLICADO".)

---

## 🔐 INCIDENTE RESUELTO: LOGIN "CREDENCIALES INVÁLIDAS" (backend caído) - `jueves, 13 de agosto de 2026`

### Síntoma
El usuario reportaba **"Credenciales inválidas"** al intentar entrar al psicométrico en `http://localhost:5173`, aun usando las credenciales del seed correctas (`admin@psicometrico.com` / `Admin123!`).

### Diagnóstico (NO era conflicto de puertos)
1. `curl localhost:3021` sin respuesta → el contenedor estaba "Up" pero el proceso dentro **no arrancaba**.
2. Log del backend: `Found 1 error. Watching for file changes` → error de TypeScript que dejó el servidor sin iniciar (corre en `--watch`, así que nunca levanta).
3. Causa: `backend/src/auth/jwt.strategy.ts:12` pasaba `process.env.JWT_SECRET` (tipo `string | undefined`) a `secretOrKey`, que exige `string | Buffer`.
4. El frontend (`Login.tsx:21`) muestra **"Credenciales inválidas" para CUALQUIER error** (incluida la falta de conexión al backend) → el mensaje era engañoso.
5. La BD estaba sana (usuarios seed presentes en `Usuario`).

### Fix aplicado (1 línea)
- `backend/src/auth/jwt.strategy.ts:12`:
  ```ts
  secretOrKey: process.env.JWT_SECRET || 'cambia_este_secreto_en_produccion',
  ```

### Segundo problema encadenado (volumen anónimo `node_modules`)
- Tras el rebuild de la imagen, el backend seguía cayendo: `Cannot find module 'dotenv/config'` (por el `import 'dotenv/config'` de `main.ts`).
- Causa: el volumen anónimo `/app/node_modules` del `docker-compose.yml` persistió las dependencias de una imagen vieja sin `dotenv`. **Rebuild de la imagen no lo reemplaza** porque el volumen montado tiene prioridad.
- Fix: eliminar el volumen anónimo y recrear el contenedor backend (la BD `postgres_data` no se tocó).

### Verificación
- `POST /auth/login` con `admin@psicometrico.com` / `Admin123!` → **200** con `access_token` JWT válido.
- Log: `Nest application successfully started` con todas las rutas mapeadas; backend respondiendo en `:3021`.

### Notas / pendiente
- Este fix **aún no está commiteado** (`git status` muestra `M backend/src/auth/jwt.strategy.ts`).
- `docker-compose.yml:29` sigue inyectando `JWT_SECRET` con fallback `cambia_este_secreto_en_produccion`; en producción se debe poner uno real (`openssl rand -base64 48`). Ver `PLAN_DE_OPTIMIZACION.md`.
- Recordatorio de infraestructura (se reafirma): **al agregar una dependencia al backend**, `npm install --package-lock-only` (host) → `docker compose up --build`, y si persiste el error de módulo faltante, `docker compose down` + recrear el volumen anónimo.

---

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