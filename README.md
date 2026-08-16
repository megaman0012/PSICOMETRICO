# Plataforma Psicométrica

Sistema para administrar, calificar y analizar pruebas psicométricas para candidatos a guardia de seguridad.

## Arquitectura

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL (helmet, CORS configurable, rate-limit)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts (code-splitting)
- **Base de datos**: PostgreSQL
- **Containerización**: Docker Compose (desarrollo `docker-compose.yml` / producción `docker-compose.prod.yml`)
- **Proceso**: CI en GitHub Actions · Makefile · backups `pg_dump`

## Características

- Motor genérico de pruebas configurables (Prueba > Dimensión > Pregunta > Opción de respuesta > Umbral de clasificación)
- Soporte para pruebas LIKERT y OPCIÓN_MULTIPLE
- Cálculo de puntajes por dimensión y global con clasificación normalizada a escala 0-100
- Umbrales de clasificación por dimensión y globales
- Autenticación JWT con roles (Admin, Evaluador)
- **Frontend completo**: login, dashboard con estadísticas, gestión de candidatos, asistente para aplicar pruebas (4 pasos), panel de resultados con gráficas (Recharts), historial por candidato, reportes con exportación CSV/PDF y administración de usuarios
- **Reportes**: resumen estadístico, exportación CSV (general y por candidato) y **informe PDF** psicométrico por aplicación
- Diseño responsivo y accesible (Tailwind CSS)

## Pruebas Soportadas

1. **Big Five Personality**: 20 preguntas LIKERT 1-5, 5 factores
2. **Integridad**: Preguntas situacionales de opción múltiple, 4 categorías éticas
3. **Aptitudes Cognitivas**: 10 preguntas de opción múltiple, 4 competencias

## Requisitos Previos

- Node.js (v18 o superior)
- Docker y Docker Compose
- Git

## Instalación y Ejecución

### Opción 1: Con Docker Compose (Recomendado)

Hay dos archivos de compose con el mismo concepto Docker:

| Archivo | Para qué | Comando |
|---------|----------|---------|
| `docker-compose.yml` | **Desarrollo** (hot-reload con bind mounts) | `docker compose up --build -d` |
| `docker-compose.prod.yml` | **Producción** (imágenes compiladas) | `docker compose -f docker-compose.prod.yml up -d --build` |

#### Desarrollo

1. Clone el repositorio
2. Ejecute: `docker compose up --build -d`
3. El backend estará disponible en: **http://localhost:3021**
4. El frontend (dev server Vite) estará disponible en: **http://localhost:5173**
5. PostgreSQL (interno) en: http://localhost:5433 (atado a `127.0.0.1`, solo accesible desde la máquina)

> Si la base ya existe con un esquema viejo (entorno de desarrollo):
> `docker compose down -v && docker compose up --build -d`
> (`-v` borra también los volúmenes de `node_modules` y la base; no use `-v` en producción).

#### Producción

1. Clone el repositorio en el servidor
2. `cp .env.example .env` y configure los secretos (ver "Despliegue en Producción" abajo)
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. El frontend (estáticos servidos por **Nginx**) estará en: **http://localhost:5173**
5. El backend en: **http://localhost:3021**
6. PostgreSQL NO se expone: queda solo en la red interna de Docker

### Credenciales por defecto (seed)

| Rol       | Email                      | Password          |
|-----------|----------------------------|-------------------|
| Admin     | admin@psicometrico.com     | Admin123!         |
| Evaluador | evaluador@psicometrico.com | Evaluador123!     |

### Opción 2: Ejecución Local

#### Backend

1. Navegue al directorio `backend`
2. Instale dependencias: `npm install`
3. Configure la base de datos PostgreSQL y actualice el archivo `.env`
4. Ejecute las migraciones: `npx prisma migrate dev`
5. Ejecute el seed: `npx ts-node prisma/seed.ts`
6. Inicie el servidor: `npm run start:dev`

#### Frontend

1. Navegue al directorio `frontend`
2. Instale dependencias: `npm install`
3. Inicie el servidor de desarrollo: `npm run dev`

## Pantallas del Frontend

| Ruta          | Descripción                                                          | Acceso    |
|---------------|----------------------------------------------------------------------|-----------|
| `/login`      | Inicio de sesión (JWT)                                               | Público   |
| `/`           | Dashboard con estadísticas y acciones rápidas                        | Autenticado |
| `/pruebas`    | Listado de pruebas psicométricas                                     | Autenticado |
| `/pruebas/:id`| Detalle de una prueba (dimensiones y preguntas)                      | Autenticado |
| `/candidatos` | Registro, listado y búsqueda de candidatos por cédula                | Autenticado |
| `/aplicar`    | Asistente para aplicar una prueba (4 pasos)                          | Autenticado |
| `/resultados` | Resultados por aplicación con gráficas, informe psicométrico y descarga CSV/PDF | Autenticado |
| `/historial`  | Historial de aplicaciones por candidato (timeline) + descarga CSV               | Autenticado |
| `/reportes`   | Resumen estadístico y exportación CSV/PDF                                        | Autenticado |
| `/usuarios`   | Administración de usuarios (solo ADMIN)                                          | ADMIN      |
| `/admin-pruebas` | Crear, editar, activar/desactivar y eliminar pruebas (formulario por secciones) | ADMIN      |

## API Endpoints

- `GET /health` - Verifica el estado del backend
- `POST /auth/login` - Inicia sesión (JWT)
- `GET /auth/me` - Perfil del usuario autenticado
- `GET /pruebas` - Lista las pruebas activas
- `GET /pruebas/todas` - Lista todas las pruebas (incluye inactivas, con conteos) - solo ADMIN
- `GET /pruebas/:id` - Obtiene una prueba específica (con dimensiones, preguntas, opciones y umbrales)
- `POST /pruebas` - Crea una prueba completa (dimensiones, preguntas, opciones, umbrales en `$transaction`) - solo ADMIN
- `PUT /pruebas/:id` - Actualiza/rebuild la estructura de una prueba - solo ADMIN
- `DELETE /pruebas/:id` - Elimina una prueba (bloqueada si tiene aplicaciones) - solo ADMIN
- `PATCH /pruebas/:id/estado` - Activa/desactiva una prueba sin reconstruir la estructura (no pierde datos) - solo ADMIN
- `POST /candidatos` - Registra un candidato
- `GET /candidatos` - Lista candidatos
- `GET /candidatos/buscar/:cedula` - Busca candidato por cédula
- `POST /aplicaciones` - Crea una nueva aplicación de prueba (el evaluador se toma del token JWT; `numeroIntento` se auto-incrementa)
- `GET /aplicaciones` - Lista aplicaciones (con candidato, prueba y resultados)
- `GET /aplicaciones/:id` - Obtiene una aplicación con sus resultados
- `POST /aplicaciones/:id/respuestas` - Guarda las respuestas
- `POST /aplicaciones/:id/finalizar` - Finaliza y califica la aplicación
- `GET /candidatos/:id/historial` - Historial de aplicaciones de un candidato
- `GET /reportes/resumen` - Estadísticas globales
- `GET /reportes/aplicaciones/csv` - Exporta todas las aplicaciones a CSV
- `GET /reportes/aplicaciones/:id/csv` - Exporta una aplicación (dimensiones + global) a CSV
- `GET /reportes/aplicaciones/:id/pdf` - Genera el **informe PDF** de una aplicación
- `GET /reportes/candidatos/:id/historial-csv` - Exporta el historial completo de un candidato a CSV
- `POST /usuarios` - Crea un usuario (solo ADMIN)
- `GET /usuarios` - Lista usuarios (solo ADMIN)

> Las rutas protegidas requieren el header `Authorization: Bearer <token>`.
> Rol `ADMIN`: todo. Rol `EVALUADOR`: pruebas, candidatos, aplicaciones, reportes y su perfil. Crear/ver usuarios: solo `ADMIN`.

## Variables de Entorno

Todos los valores sensibles del despliegue se configuran desde un único archivo `.env` en la raíz del proyecto
(consulte `.env.example` para ver las variables con su descripción). El `docker-compose.yml` los inyecta
automáticamente; el backend carga su `.env` con `dotenv` y el seed los usa para crear los usuarios iniciales.

### Backend
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: secreto para firmar los tokens JWT. **Requerido en producción** (fail-fast: el compose aborta sin él y el backend rechaza el valor por defecto)
- `CORS_ORIGIN`: origen(es) permitidos para CORS, separados por coma (por defecto `http://localhost:5173`). Si la página se sirve desde otra URL/host, debe estar listada aquí
- `PORT`: puerto del backend (por defecto `3000`)
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_EVALUADOR_EMAIL`, `SEED_EVALUADOR_PASSWORD`: credenciales de los usuarios iniciales del seed

### PostgreSQL
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: credenciales y nombre de la base (la contraseña debe ser alfanumérica)

### Frontend
- `VITE_API_URL`: URL pública del backend API

## Despliegue en Producción

```bash
# 1. Clonar el repositorio en el servidor
git clone git@github.com:megaman0012/PSICOMETRICO.git && cd PSICOMETRICO

# 2. Crear la configuración desde la plantilla
cp .env.example .env

# 3. Generar un JWT_SECRET seguro y pegarlo en el .env
openssl rand -base64 48

# 4. Editar el .env y cambiar: JWT_SECRET, POSTGRES_PASSWORD,
#    SEED_ADMIN_PASSWORD, SEED_EVALUADOR_PASSWORD y (si aplica) CORS_ORIGIN

# 5. Levantar los servicios (imágenes de PRODUCCIÓN)
docker compose -f docker-compose.prod.yml up -d --build
```

`docker-compose.prod.yml` usa imágenes **multi-stage** y es distinto del de desarrollo:

- El backend se **compila** (`nest build`) y arranca el binario (`node dist/src/main.js`), no
  `start:dev` con watch. `NODE_ENV=production`.
- El frontend se compila (`vite build`) y lo sirve **Nginx** dentro del contenedor (no `vite dev`).
- **No hay bind mounts ni volúmenes de `node_modules`**: la imagen trae su propio código y
  dependencias (imposible el incidente del "volumen anónimo viejo").
- `JWT_SECRET` es **obligatorio**: si no está en el `.env`, el compose aborta; si usa el valor por
  defecto de desarrollo, el backend se niega a arrancar (fail-fast).
- El entrypoint de producción solo hace `prisma migrate deploy` + seed idempotente (sin el reset
  destructivo de desarrollo) y arranca el binario.
- PostgreSQL no publica puertos (solo red interna). Backend y frontend tienen healthcheck.

La base se inicializa sola la primera vez (migraciones + seed con las credenciales del `.env`).
El seed solo corre cuando la base está vacía, así que los datos no se pierden al reiniciar.

### Acceso inicial
- App: `http://<servidor>:5173` | API: `http://<servidor>:3021`
- Usuario administrador: el `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` configurados
- Usuario evaluador: el `SEED_EVALUADOR_EMAIL` / `SEED_EVALUADOR_PASSWORD` configurados

### Notas
- Si accede desde otro equipo, ponga en `VITE_API_URL` la IP/dominio público del servidor
  (`http://IP:3021`) **y en `CORS_ORIGIN`** la URL con la que se abre la página
  (`http://IP:5173` o el dominio). En producción `VITE_API_URL` se inyecta en el **build** de la
  imagen: si la cambia, reconstruya con `docker compose -f docker-compose.prod.yml up -d --build`.
- No ejecute desarrollo y producción a la vez en la misma máquina con el mismo `.env`.
- Recomendado detrás de un proxy (Nginx/Traefik) con **HTTPS** para producción definitiva; ahí
  mapee el frontend a `80/443` y, si oculta el backend, ajuste `VITE_API_URL` en consecuencia.

## Comandos de mantenimiento (Makefile)

Para estandarizar los comandos y evitar el `down -v` destructivo por accidente, hay un `Makefile`
en la raíz del proyecto:

```bash
make up          # Levantar desarrollo (hot-reload)
make down        # Apagar desarrollo (NO borra datos)
make logs        # Logs en vivo (desarrollo)
make prod        # Levantar producción (imágenes compiladas)
make prod-down   # Apagar producción
make prod-logs   # Logs en vivo (producción)
make test        # Tests backend (59/59) + build frontend
make backup      # Backup de la base a ./backups
make restore FILE=backups/psicometrico_YYYYMMDD_HHMMSS.sql   # Restaurar un backup
```

> ⚠️ **Nunca use `docker compose down -v`**: borra el volumen `postgres_data` con todos los datos.

## Backups

La única fuente de datos persistente es el volumen `postgres_data`. Dos formas de respaldarlo:

**1. Manual (Makefile):**
```bash
make backup                                     # genera backups/psicometrico_<fecha>.sql
make restore FILE=backups/psicometrico_20260816_033000.sql   # restaura sobre la BD actual
```

**2. Programado (cron) — producción:**
```bash
# Editar crontab:  crontab -e
30 3 * * * COMPOSE_FILE=docker-compose.prod.yml /home/server-gea/Documentos/psicometrico/backup.sh >> /home/server-gea/Documentos/psicometrico/backups/backup.log 2>&1
```

`backup.sh` hace `pg_dump` del contenedor `postgres` y rota los backups más viejos que
`BACKUP_RETENTION_DAYS` (por defecto 14 días). Pruebe el restore en una base de prueba antes de
necesitarlo de verdad.

## CI (GitHub Actions)

En cada push/PR a `main`, `.github/workflows/ci.yml` ejecuta:
- **Backend**: `npm ci` → `prisma generate` → `npm test` → `npm run build`
- **Frontend**: `npm ci` → `npm run build` (typecheck + bundle)

Un error de TypeScript como el del incidente del 13/08 se detecta en CI antes de tocar el servidor.

## Solución de Problemas

### Login: "Credenciales inválidas" vs "No se pudo conectar con el servidor"
Desde el 16/08/2026 el frontend distingue ambos casos:
- **401 → "Credenciales inválidas"**: el usuario/contraseña son incorrectos (el backend responde
  401 y espera 600 ms antes de rechazar, para frenar fuerza bruta).
  ⚠️ Además hay **rate-limit**: máximo **5 intentos de login cada 15 minutos** por IP. Si lo supera,
  el backend responde `429 Too Many Requests` y el frontend muestra el aviso correspondiente.
- **Sin respuesta / 5xx → "No se pudo conectar con el servidor..."**: el backend está caído o la
  URL no es accesible. Verifique que responda:

```bash
curl http://localhost:3021
# o el healthcheck:
curl http://localhost:3021/health
```

Si no responde, revise el log del contenedor:

```bash
docker compose logs backend
```

Causas frecuentes (visto el 13/08/2026):
1. **Error de TypeScript en modo watch** → el backend no arranca (`Found N errors. Watching...`).
   Corregir el código y reconstruir.
2. **Volumen de `node_modules` desactualizado (solo desarrollo)** → `Cannot find module '...'` tras
   instalar una dependencia nueva. Ahora es un **volumen nombrado** (no anónimo) que se puede
   recrear sin tocar la base:

   ```bash
   docker compose down
   docker volume rm psicometrico_backend_node_modules psicometrico_frontend_node_modules
   docker compose up -d --build
   ```

> En **producción** esto no ocurre: `docker-compose.prod.yml` no monta `node_modules` (la imagen
> trae sus propias dependencias). Regla en desarrollo al agregar una dependencia al backend:
> `npm install --package-lock-only` (host) → `docker compose up --build`. Si persiste el error,
> recrear el volumen nombrado (nunca `down -v` a menos que quieras borrar también la BD).

### Backend no arranca por `JWT_SECRET`
En **producción** el compose aborta si `JWT_SECRET` no está en el `.env`, y el backend se niega a
arrancar si está vacío o usa el valor por defecto de desarrollo (fail-fast real). Genere uno:

```bash
openssl rand -base64 48
```

En **desarrollo** (`docker-compose.yml`) el compose inyecta el valor por defecto para que todo
funcione sin configurar nada.

## Licencia

MIT