#!/bin/sh
# ============================================================
# Backup de la base psicométrica (postgres_data)
#
# Uso manual:
#   ./backup.sh
#   COMPOSE_FILE=docker-compose.prod.yml ./backup.sh   # si corre la pila de producción
#
# Programado con cron (todos los días 03:30):
#   30 3 * * * /home/server-gea/Documentos/psicometrico/backup.sh >> /home/server-gea/Documentos/psicometrico/backups/backup.log 2>&1
#
# Restore (ver README → "Backups"): `make restore FILE=backups/...sql`
# ============================================================
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$DIR/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_PROJECT_DIR="$DIR"

mkdir -p "$BACKUP_DIR"
DATE="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/psicometrico_$DATE.sql"

echo "==> [$DATE] Generando backup: $FILE"

docker compose -f "$COMPOSE_PROJECT_DIR/$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-psicometrico}" > "$FILE"

# Rotación: borrar backups más viejos que RETENTION_DAYS
find "$BACKUP_DIR" -name 'psicometrico_*.sql' -mtime +"$RETENTION_DAYS" -delete

echo "==> [$DATE] Backup completado: $(du -h "$FILE" | cut -f1)"
