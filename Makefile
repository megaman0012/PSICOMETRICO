# ============================================================
# Plataforma Psicométrica — comandos de mantenimiento
#
# Uso:
#   make up            Levantar desarrollo (hot-reload)
#   make down          Apagar desarrollo (NO borra datos)
#   make logs          Logs en vivo (desarrollo)
#   make prod          Levantar producción (imágenes compiladas)
#   make prod-down     Apagar producción
#   make prod-logs     Logs en vivo (producción)
#   make test          Tests backend + build frontend
#   make backup        Backup de postgres_data a ./backups
#   make restore FILE  Restaurar un backup
#
# ⚠️ NUNCA use `docker compose down -v`: borra el volumen postgres_data.
# ============================================================

COMPOSE_DEV = docker compose
COMPOSE_PROD = docker compose -f docker-compose.prod.yml
BACKUP_DIR = backups

.PHONY: up down logs ps prod prod-down prod-logs test reset backup restore

## Desarrollo ---------------------------------------------------

up:
	$(COMPOSE_DEV) up -d --build

down:
	$(COMPOSE_DEV) down

logs:
	$(COMPOSE_DEV) logs -f

ps:
	$(COMPOSE_DEV) ps

## Producción ---------------------------------------------------

prod:
	$(COMPOSE_PROD) up -d --build

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f

prod-ps:
	$(COMPOSE_PROD) ps

## Calidad ------------------------------------------------------

test:
	cd backend && npm test -- --runInBand
	cd frontend && npm run build

## Backups ------------------------------------------------------

backup:
	@mkdir -p $(BACKUP_DIR)
	@DATE=$$(date +%Y%m%d_%H%M%S); \
	echo "==> Generando backup $$DATE..."; \
	docker compose exec -T postgres pg_dump -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-psicometrico} > $(BACKUP_DIR)/psicometrico_$$DATE.sql; \
	echo "==> Backup guardado en $(BACKUP_DIR)/psicometrico_$$DATE.sql"

restore:
	@test -n "$(FILE)" || (echo "Uso: make restore FILE=backups/psicometrico_YYYYMMDD_HHMMSS.sql"; exit 1)
	@test -f "$(FILE)" || (echo "Archivo no existe: $(FILE)"; exit 1)
	@echo "==> Restaurando $(FILE) en la base (sobrescribe datos actuales)..."
	docker compose exec -T postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-psicometrico} < $(FILE)
	@echo "==> Restaurado."
