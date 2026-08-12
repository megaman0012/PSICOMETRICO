# Plataforma Psicométrica

Sistema para administrar, calificar y analizar pruebas psicométricas para candidatos a guardia de seguridad.

## Arquitectura

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts
- **Base de datos**: PostgreSQL
- **Containerización**: Docker Compose

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

1. Clone el repositorio
2. Ejecute: `docker compose up --build -d`
3. El backend estará disponible en: **http://localhost:3021**
4. El frontend estará disponible en: **http://localhost:5173**
5. PostgreSQL (interno) en: http://localhost:5433

> Si la base ya existe con un esquema viejo (entorno de desarrollo):
> `docker compose down -v && docker compose up --build -d`

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
- `JWT_SECRET`: secreto para firmar los tokens JWT. **Requerido** (el backend no arranca sin él)
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
#    SEED_ADMIN_PASSWORD y SEED_EVALUADOR_PASSWORD (deje las URLs de acceso listas)

# 5. Levantar los servicios
docker compose up -d --build
```

La base se inicializa sola la primera vez (migraciones + seed con las credenciales del `.env`).
El seed solo corre cuando la base está vacía, así que los datos no se pierden al reiniciar.

### Acceso inicial
- App: `http://<servidor>:5173` | API: `http://<servidor>:3021`
- Usuario administrador: el `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` configurados
- Usuario evaluador: el `SEED_EVALUADOR_EMAIL` / `SEED_EVALUADOR_PASSWORD` configurados

### Notas
- Si accede desde otro equipo, ponga en `VITE_API_URL` la IP/dominio público del servidor (`http://IP:3021`) y abra los puertos 5173/3021.
- Recomendado detrás de un proxy (Nginx/Traefik) con **HTTPS** para producción definitiva.

## Licencia

MIT