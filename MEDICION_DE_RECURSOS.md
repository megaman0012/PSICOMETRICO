# Medición de Recursos y Alcance - v0.2

Mediciones tomadas en producción (`16/08/2026`, contenedores healthy, datos reales: 3 pruebas
semilla con 50 preguntas / 200 opciones, 2 candidatos, 70 respuestas, 4 aplicaciones).

## Uso real de recursos (idle, `docker stats`)

| Contenedor            | RAM        | CPU (idle) | Imagen (virtual) |
|-----------------------|------------|------------|------------------|
| backend (NestJS)      | ~80 MiB    | ~0%        | 457 MB           |
| postgres (PostgreSQL 15) | ~103 MiB | ~0%        | 464 MB           |
| frontend (nginx estático) | ~4.4 MiB | ~0%     | 52.9 MB          |
| **Total pila**        | **~188 MiB** | **~0%**  | ~975 MB (imágenes) |

- **BD actual**: 9.5 MB (`pg_database_size`), `max_connections=100`, `shared_buffers=128MB`.
- **Backup diario** (`pg_dump`): ~69 KB por dump.

## Requisitos mínimos para funcionar bien

| Recurso  | Mínimo     | Recomendado  | Notas                                        |
|----------|------------|--------------|----------------------------------------------|
| CPU      | 1 vCPU     | 2 vCPU       | Picos al generar PDF y en importación masiva |
| RAM      | 512 MiB    | 2 GiB        | Pila real ~190 MiB + SO (swap recomendada)   |
| Disco    | 10 GiB     | 20 GiB       | Imágenes ~1 GB + BD (crece ~20 KB por examen)|
| Red      | básica     | 1 Mbps+     | Solo uso interno de oficina hoy               |

> La pila actual corre cómoda en **1 vCPU / 1 GiB RAM** (esta máquina es mucho mayor).

## Alcance en simultáneo (concurrencia)

- **Límite efectivo actual**: rate-limit global **60 peticiones/min por IP**
  (`ThrottlerModule`, `app.module.ts`) — ~1 petición/s por IP. Es la restricción que manda.
- **Flujo de un examen público** = **3 peticiones** (1 GET examen + 1 POST respuestas + 1 POST finalizar).
- **Resultado**: ~**20 candidatos/min por IP**. Para un laboratorio con pocos puestos, de sobra;
  si cada candidato viene de una IP distinta (móvil/internet), escala con la cantidad de IPs.
- **Backend sin throttle**: 369 req/s (`/health`, c=20, latencia media 2.7 ms) y 429 req/s en el
  frontend estático. Node maneja cientos de conexiones concurrentes sin problema.
- **BD**: 100 conexiones máximas (Prisma usa pool); lejos del límite con este tráfico.
- **Tiempos medidos**: `/health` ~3 ms · `/aplicaciones` (consulta con BD) 13–43 ms.

## Alcance de almacenamiento

Crecimiento por examen completo (batería de 3 pruebas = 3 aplicaciones):

| Dato por examen       | Filas               | Tamaño aprox. |
|-----------------------|---------------------|---------------|
| Aplicaciones          | 3                   | ~0.6 KB       |
| Respuestas            | 150                 | ~15 KB        |
| ResultadoDimension    | 15                  | ~3 KB         |
| ResultadoGlobal       | 3                   | ~0.5 KB       |
| Invitación + rest     | 1 + varia           | ~1 KB         |
| **Total**             | ~172 filas          | **~20 KB**    |

Proyección:

| Exámenes aplicados | Espacio estimado |
|--------------------|------------------|
| 1,000              | ~20 MB           |
| 10,000             | ~200 MB          |
| 100,000            | ~2 GB            |
| ~500,000           | ~10 GB           |

**Conclusión**: para una empresa de guardias (decenas de candidatos al mes), la BD crece
~1–3 MB al año. Con 10 GiB de disco hay margen para décadas. El cuello de botella práctico
es el **rate-limit por IP (concurrencia)**, no el almacenamiento ni la CPU/RAM.

## Punto de versión v0.2

- Tag: `v0.2` (sobre `f30009c`).
- Qué incluye vs v0.1: modo producción Docker (P0), login honesto + code-splitting (P1),
  healthchecks/hardening/CI/Makefile/backups (P2/P3), **features nuevas**: empresas,
  baterías, invitaciones con examen público, importación masiva de candidatos, exportación
  CSV, SMTP, fecha de nacimiento/edad, y cobertura de tests 101/101 + docs actualizadas.
- Recomendaciones de mejora continua (fuera de alcance de v0.2): HTTPS/reverse proxy y
  monitorización (uptime, alertas) si se expone a Internet.
