-- AlterTable
ALTER TABLE "Candidato" ADD COLUMN     "empresaId" INTEGER,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificadoTitulo" TEXT,
    "certificadoTexto" TEXT,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- CreateIndex
CREATE INDEX "Empresa_nombre_idx" ON "Empresa"("nombre");

-- CreateIndex
CREATE INDEX "Candidato_empresaId_idx" ON "Candidato"("empresaId");

-- AddForeignKey
ALTER TABLE "Candidato" ADD CONSTRAINT "Candidato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

