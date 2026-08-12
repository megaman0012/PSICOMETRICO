#!/bin/sh
set -e

echo "==> Generando cliente Prisma..."
npx prisma generate

echo "==> Aplicando migraciones..."
if ! npx prisma migrate deploy; then
  echo "!! Fallo en migrate deploy. Reseteando la base (solo entorno de desarrollo)..."
  npx prisma migrate reset --force --skip-seed
  npx prisma migrate deploy
fi

echo "==> Verificando si la base de datos ya tiene datos..."
CUENTA_PRUEBAS=$(node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.prueba.count().then(c=>{console.log(c);process.exit(0)}).catch(()=>{console.log('error');process.exit(1)})")

if [ "$CUENTA_PRUEBAS" = "error" ] || [ "$CUENTA_PRUEBAS" = "0" ] || [ -z "$CUENTA_PRUEBAS" ]; then
  echo "==> Base vacía, ejecutando seed de datos..."
  npm run seed
else
  echo "==> La base ya contiene $CUENTA_PRUEBAS pruebas, omitiendo seed (no se pierden los datos)."
fi

echo "==> Iniciando backend en el puerto 3000..."
exec npm run start:dev
