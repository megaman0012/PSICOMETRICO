# Plan de Optimización - Proyecto Psicométrico

Sí, hay bastante margen de optimización. Este documento prioriza los cambios que dan más valor
para producción, ordenados por impacto/riesgo.

Estado: `v0.1` funcional en Docker · **Lotes P0, P1 y P2/P3 (15–16/08/2026) APLICADOS** · 59/59 tests · builds OK.

---

## ✅ APLICADO — Lote P2/P3 (16/08/2026)

P1-6, P1-8 y los P3 (CI, Makefile, backups) implementados y validados:

| Tarea | Cambio |
|-------|--------|
| **P1-6** Healthchecks | `docker-compose.yml` (dev): backend y frontend ahora tienen healthcheck propio (ya lo tenían prod); frontend prod (nginx) también. `depends_on` con `condition: service_healthy`. |
| **P1-8** Hardening | `backend/src/main.ts`: `helmet` (CSP off, API JSON) + `CORS_ORIGIN` explícito por `.env` (por defecto `http://localhost:5173`, admite lista separada por coma). `backend/src/app.module.ts`: `ThrottlerModule` global (60 req/min por defecto) con `ThrottlerGuard` como `APP_GUARD`. `backend/src/auth/auth.controller.ts`: `@Throttle` estricto en `/auth/login` (5 intentos / 15 min) además del retardo de 600 ms. |
| **P3-11** CI | `.github/workflows/ci.yml`: en cada push/PR a `main` → backend (`npm ci` + `prisma generate` + `npm test` + `npm run build`) y frontend (`npm ci` + `npm run build`). |
| **P3-12** Makefile | `Makefile`: `make up/down/logs/prod/prod-down/test/backup/restore`. Nunca usa `down -v`. |
| **P3-13** Backups | `backup.sh` (pg_dump + rotación 14 días, configurable con `COMPOSE_FILE` y `BACKUP_RETENTION_DAYS`) + targets `make backup` / `make restore FILE=...` + documentado el cron. |

**Pendiente:** ninguno del plan. Recomendaciones de mejora continua: HTTPS/TLS detrás de un reverse proxy si se expone a Internet, y monitorización (uptime, alertas).

---

## ✅ APLICADO — Lote P1 (16/08/2026)

P1-5, P2-10 y P1-7 (red) implementados y desplegados en producción:

| Tarea | Cambio |
|-------|--------|
| **P1-5** Login honesto | `backend/src/auth/auth.controller.ts`: credenciales inválidas ahora lanzan `UnauthorizedException` (HTTP 401) con retardo de 600 ms anti fuerza bruta (antes devolvía 200 con `{message}`). `frontend/src/pages/Login.tsx`: distingue 401 (credenciales malas) de error de red/5xx ("No se pudo conectar con el servidor..."). |
| **P2-10** Code-splitting | `frontend/src/App.tsx`: `React.lazy` + `Suspense` en todas las rutas (Login queda eager). `frontend/vite.config.ts`: `manualChunks` para `react`/`recharts`. Bundle inicial **655 kB → 225 kB**; Recharts (381 kB) solo se carga al abrir Resultados. |
| **P1-7** Red | `docker-compose.yml` (dev): Postgres atado a `127.0.0.1:5433` (ya no expuesto a la red). En `docker-compose.prod.yml` Postgres ya no se expone (solo red interna). |

---

## ✅ APLICADO — Lote P0 (15/08/2026)

Todas las mejoras P0 se implementaron **manteniendo el concepto Docker** (mismo `docker compose`,
con un archivo de desarrollo y otro de producción):

| Archivo | Cambio |
|---------|--------|
| `backend/Dockerfile.prod` | Imagen multi-stage: `npm ci` + `nest build` → runtime con `npm ci --omit=dev` que arranca el binario `node dist/src/main.js`. |
| `backend/docker-entrypoint.prod.sh` | Solo `prisma migrate deploy` + seed idempotente (compilado `dist/prisma/seed.js`, **sin** el reset destructivo de desarrollo) y arranque del binario. |
| `frontend/Dockerfile.prod` + `frontend/nginx.conf` | Multi-stage: `vite build` → estáticos servidos con **Nginx** (SPA fallback + gzip). `VITE_API_URL` se inyecta como build arg. |
| `docker-compose.prod.yml` | **Nuevo**: imágenes compiladas, **sin bind mounts ni volúmenes de `node_modules`**, `NODE_ENV=production`, `JWT_SECRET` obligatorio (`:?`), healthchecks, PostgreSQL solo en red interna. |
| `docker-compose.yml` (dev) | Volúmenes anónimos `/app/node_modules` → **volúmenes nombrados** recreables sin tocar la base (fix de raíz del incidente del 13/08). |
| `backend/src/main.ts` | Fail-fast real de `JWT_SECRET` en producción (rechaza el valor por defecto, `process.exit(1)`). |
| `backend/src/auth/jwt.strategy.ts` | Eliminado el fallback hardcodeado `|| 'cambia_este_secreto_en_produccion'`; ahora valida con getter tipado. |
| `backend/package.json` | `prisma` CLI movido de `devDependencies` a `dependencies` para que `npm ci --omit=dev` pueda ejecutar `migrate deploy` en runtime. |

**Verificado:** `docker compose config` (dev y prod) OK · 59/59 tests backend · build frontend y
backend OK · escenario runtime con `npm ci --omit=dev` (carga completa sin deps de desarrollo) ·
fail-fast JWT probado sobre el binario.

**Uso:**
```bash
# Desarrollo (hot-reload)
docker compose up -d --build

# Producción (imágenes compiladas)
cp .env.example .env          # configure secretos (JWT_SECRET obligatorio)
docker compose -f docker-compose.prod.yml up -d --build
```

---

## P0 — Críticos para producción ✅ APLICADO (ver arriba)

### 1. Backend en modo producción en Docker ✅
- **Dónde**: `backend/docker-entrypoint.sh` (última línea `exec npm run start:dev`) y `backend/Dockerfile`.
- **Problema**: el modo watch es para desarrollo; cualquier error de TS (como el de hoy) tumba el
  servicio y no se recupera solo. En producción se quiere un binario compilado y resiliente.
- **Cambio**: `Dockerfile` multi-stage → stage build (`npm ci` + `nest build`) → stage runtime
  (`node:18-slim`, `npm ci --omit=dev`, `node dist/main.js`). El entrypoint solo hace
  `prisma migrate deploy` + seed idempotente y arranca el binario.

### 2. Frontend servido como build estático ✅
- **Dónde**: `frontend/docker-entrypoint.sh`, `frontend/Dockerfile`, `docker-compose.yml`.
- **Problema**: el dev server de Vite expone el código fuente y no está pensado para producción.
- **Cambio**: multi-stage → `npm ci` + `vite build` → servir `dist/` con Nginx (port `80` interno),
  con `VITE_API_URL` inyectada en build (o runtime vía `window.__API__`).

### 3. Volumen anónimo `node_modules` ✅
- **Dónde**: `docker-compose.yml` líneas 39 y 54 (`- /app/node_modules`).
- **Problema**: persiste dependencias de imágenes viejas; tras `npm install` de una dep nueva el
  contenedor usa el volumen viejo → `Cannot find module ...`.
- **Cambio**: en producción **eliminar los bind mounts** (`./backend:/app`, `./frontend:/app`) y que
  la imagen traiga su propio código/node_modules. En desarrollo, reemplazar por un volumen nombrado
  que se pueda recrear explícitamente (`docker compose down -v` solo borraría `postgres_data`).

### 4. `JWT_SECRET` con fail-fast real ✅
- **Dónde**: `docker-compose.yml:29` (`${JWT_SECRET:-cambia_este_secreto_en_produccion}`) y
  `jwt.strategy.ts:12` (fallback hardcodeado).
- **Problema**: en producción, si alguien olvida el `.env`, el sistema usa un secreto público.
  La documentación dice "no arranca sin JWT_SECRET" pero no es cierto en Docker.
- **Cambio**: validar en `main.ts` (antes de `listen`): si `NODE_ENV === 'production'` y
  `JWT_SECRET` no está definido o es el valor por defecto → `process.exit(1)`. En dev se puede
  tolerar el fallback.

---

## P1 — Calidad y seguridad (alto valor, bajo riesgo)

### 5. Mensaje de error honesto en el login ✅
- **Dónde**: `frontend/src/pages/Login.tsx` y `backend/src/auth/auth.controller.ts`.
- **Problema**: mostraba "Credenciales inválidas" para cualquier error (hoy el backend estaba caído y
  el usuario creía que la contraseña era mala). Además el backend devolvía HTTP 200 con un mensaje,
  por lo que el frontend no podía distinguir.
- **Cambio**: el backend ahora responde 401 (`UnauthorizedException`) con retardo de 600 ms; el
  frontend distingue 401 (credenciales malas) de `NetworkError`/5xx ("No se pudo conectar con el
  servidor, verifique que el backend esté arriba en :3021").

### 6. Healthchecks en backend y frontend ✅
- **Dónde**: `docker-compose.yml` y `docker-compose.prod.yml`.
- **Problema**: solo Postgres tenía healthcheck; un backend caído pasaba desapercibido.
- **Cambio**: healthcheck para backend (`fetch('http://localhost:3000/health')` con node) y
  frontend (fetch del dev server / `wget http://127.0.0.1/` de Nginx — `localhost` no, porque
  `wget` lo resuelve a `::1` y nginx solo escucha IPv4) en ambos composes; los `depends_on` de
  backend→postgres y frontend→backend usan `condition: service_healthy`.

### 7. Endurecer red para producción ✅
- **Dónde**: `docker-compose.yml` y `docker-compose.prod.yml`.
- **Hecho**: Postgres atado a `127.0.0.1:5433` en desarrollo; en producción Postgres **no se expone**
  (solo red interna de Docker `internal`).
- **Pendiente (recomendación para exposición real)**: Backend/frontend detrás de un solo reverse
  proxy Nginx/Traefik con **HTTPS** (no exponer 3021/5173 a Internet). Para uso en LAN/localhost el
  estado actual es seguro.

### 8. CORS y hardening del backend ✅
- **Dónde**: `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/auth/auth.controller.ts`.
- **Cambio**: `origin` explícito por `.env` (`CORS_ORIGIN`, lista separada por coma, por defecto
  `http://localhost:5173`), `helmet` (CSP desactivado: backend es API JSON), y rate-limiting global
  (`@nestjs/throttler` 60 req/min) con regla estricta en `/auth/login` (5 intentos / 15 min) +
  retardo de 600 ms en contraseña incorrecta.

### 9. Verificar que no se suben secretos
- **Dónde**: `.gitignore` raíz.
- **Confirmado**: `.env` está ignorado; solo `.env.example` versionado. Antes de cada push revisar
  `git status` y `git log -p` para descartar `.env` en el historial.

---

## P2 — Rendimiento del frontend

### 10. Code-splitting (Recharts ~655 kB) ✅
- **Dónde**: `frontend/src/App.tsx` (rutas) y `frontend/vite.config.ts`.
- **Cambio**: `React.lazy` + `Suspense` en todas las páginas (Login queda eager) y
  `build.manualChunks` en `vite.config.ts` para separar `react`/`recharts`.
- **Resultado medido**: bundle inicial **655 kB → 225 kB** (gzip 75 kB); Recharts (381 kB) queda en
  el chunk de `Resultados` y solo se descarga al abrir esa página.

---

## P3 — Infraestructura / proceso

### 11. CI en GitHub Actions ✅
- **Dónde**: `.github/workflows/ci.yml`.
- **Cambio**: en cada push/PR a `main` corre backend (`npm ci` + `prisma generate` + `npm test` +
  `npm run build`) y frontend (`npm ci` + `npm run build`). Un error TS como el del 13/08 se
  detecta antes de tocar el servidor.

### 12. Makefile o scripts de mantenimiento ✅
- **Dónde**: `Makefile`.
- **Cambio**: `make up / down / logs / prod / prod-down / test / backup / restore` para estandarizar
  los comandos entre el equipo y evitar el `down -v` destructivo por accidente (no existe ningún
  target que use `-v`).

### 13. Estrategia de backup de `postgres_data` ✅
- **Dónde**: `backup.sh` + targets `make backup` / `make restore`.
- **Cambio**: `pg_dump` con rotación (14 días, configurable `BACKUP_RETENTION_DAYS`), usable desde
  cron (`COMPOSE_FILE=docker-compose.prod.yml ./backup.sh`), y restore documentado. Es lo único que
  tiene datos de candidatos.

---

## Orden de ejecución sugerido (1 sesión cada uno)
1. ~~**P0-1 y P0-2** (builds de producción) junto con **P0-3** (quitar volumen anónimo) → y **P0-4** (fail-fast JWT).~~ ✅ Hecho (15/08/2026)
2. ~~**P1-5** (mensaje de login honesto) → y **P1-7** (red Postgres)~~ junto con ~~**P2-10** (code-splitting)~~. ✅ Hecho (16/08/2026)
3. ~~**P1-6** (healthchecks dev) y **P1-8** (CORS explícito + helmet + rate-limit)~~. ✅ Hecho (16/08/2026)
4. ~~**P3-11, P3-12, P3-13** (CI, make, backups)~~. ✅ Hecho (16/08/2026)

> Regla de oro: cada cambio va acompañado de `npm test` (backend) y `npm run build` (frontend),
> y se valida con el flujo e2e (login → candidato → aplicar → finalizar → PDF/CSV) en `:3021/:5173`.
