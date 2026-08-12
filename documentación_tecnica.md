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
- **Tests**: 59/59 pasando (`npm test` en `backend/`).
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
- **Tests**: 59/59 pasando (8 suites: calificación, auth service, auth controller, roles guard, pruebas, candidatos, aplicaciones, reportes).
- **Pendiente**: code-splitting del bundle del frontend (Recharts > 500 kB), `.env` de producción con secretos reales y HTTPS detrás de proxy.