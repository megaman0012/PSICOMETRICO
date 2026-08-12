#!/bin/sh
set -e

echo "Instalando dependencias del frontend..."
npm install

echo "Iniciando servidor de desarrollo Vite..."
exec npm run dev
