#!/bin/sh
set -e

echo "==> Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "==> Verificando si la base de datos ya tiene datos..."
CUENTA_PRUEBAS=$(node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.prueba.count().then(c=>{console.log(c);process.exit(0)}).catch(()=>{console.log('error');process.exit(1)})")

if [ "$CUENTA_PRUEBAS" = "error" ] || [ "$CUENTA_PRUEBAS" = "0" ] || [ -z "$CUENTA_PRUEBAS" ]; then
  echo "==> Base vacía, ejecutando seed de datos..."
  node dist/prisma/seed.js
else
  echo "==> La base ya contiene $CUENTA_PRUEBAS pruebas, omitiendo seed (no se pierden los datos)."
fi

echo "==> Iniciando backend (producción) en el puerto 3000..."
exec node dist/src/main.js
