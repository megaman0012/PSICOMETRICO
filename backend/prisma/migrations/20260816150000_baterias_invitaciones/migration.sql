-- CreateEnum
CREATE TYPE "EstadoInvitacion" AS ENUM ('PENDIENTE', 'COMPLETADA', 'EXPIRADA', 'REVOCADA');

-- AlterTable
ALTER TABLE "Aplicacion" ADD COLUMN     "invitacionId" INTEGER;

-- CreateTable
CREATE TABLE "Bateria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bateria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BateriaPrueba" (
    "id" SERIAL NOT NULL,
    "bateriaId" INTEGER NOT NULL,
    "pruebaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BateriaPrueba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitacion" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "bateriaId" INTEGER NOT NULL,
    "estado" "EstadoInvitacion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaExpiracion" TIMESTAMP(3) NOT NULL,
    "fechaCompletada" TIMESTAMP(3),
    "intentos" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bateria_empresaId_idx" ON "Bateria"("empresaId");

-- CreateIndex
CREATE INDEX "BateriaPrueba_pruebaId_idx" ON "BateriaPrueba"("pruebaId");

-- CreateIndex
CREATE UNIQUE INDEX "BateriaPrueba_bateriaId_pruebaId_key" ON "BateriaPrueba"("bateriaId", "pruebaId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitacion_token_key" ON "Invitacion"("token");

-- CreateIndex
CREATE INDEX "Invitacion_token_idx" ON "Invitacion"("token");

-- CreateIndex
CREATE INDEX "Invitacion_candidatoId_idx" ON "Invitacion"("candidatoId");

-- CreateIndex
CREATE INDEX "Invitacion_bateriaId_idx" ON "Invitacion"("bateriaId");

-- CreateIndex
CREATE INDEX "Aplicacion_invitacionId_idx" ON "Aplicacion"("invitacionId");

-- AddForeignKey
ALTER TABLE "Aplicacion" ADD CONSTRAINT "Aplicacion_invitacionId_fkey" FOREIGN KEY ("invitacionId") REFERENCES "Invitacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bateria" ADD CONSTRAINT "Bateria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BateriaPrueba" ADD CONSTRAINT "BateriaPrueba_bateriaId_fkey" FOREIGN KEY ("bateriaId") REFERENCES "Bateria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BateriaPrueba" ADD CONSTRAINT "BateriaPrueba_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_bateriaId_fkey" FOREIGN KEY ("bateriaId") REFERENCES "Bateria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

