-- CreateEnum
CREATE TYPE "TipoAgregacion" AS ENUM ('SUMA', 'PROMEDIO');

-- CreateTable
CREATE TABLE "Prueba" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prueba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dimension" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "pruebaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "tipoAgregacion" "TipoAgregacion" NOT NULL DEFAULT 'SUMA',

    CONSTRAINT "Dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" SERIAL NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pruebaId" INTEGER NOT NULL,
    "dimensionId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcionRespuesta" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL,
    "preguntaId" INTEGER NOT NULL,

    CONSTRAINT "OpcionRespuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UmbralClasificacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "puntuacionMinima" DECIMAL(65,30) NOT NULL,
    "puntuacionMaxima" DECIMAL(65,30) NOT NULL,
    "interpretacion" TEXT NOT NULL,
    "pruebaId" INTEGER,
    "dimensionId" INTEGER,

    CONSTRAINT "UmbralClasificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoDimension" (
    "id" SERIAL NOT NULL,
    "aplicacionId" INTEGER NOT NULL,
    "dimensionId" INTEGER NOT NULL,
    "puntuacion" DECIMAL(65,30) NOT NULL,
    "porcentaje" DECIMAL(65,30) NOT NULL,
    "clasificacion" TEXT,
    "interpretacion" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoGlobal" (
    "id" SERIAL NOT NULL,
    "aplicacionId" INTEGER NOT NULL,
    "puntuacion" DECIMAL(65,30) NOT NULL,
    "clasificacion" TEXT,
    "interpretacion" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pruebaId" INTEGER NOT NULL,

    CONSTRAINT "ResultadoGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aplicacion" (
    "id" SERIAL NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "pruebaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "numeroIntento" INTEGER NOT NULL DEFAULT 1,
    "completada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Aplicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidato" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "cargoPostulado" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'EVALUADOR',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" SERIAL NOT NULL,
    "aplicacionId" INTEGER NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "opcionRespuestaId" INTEGER NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prueba_nombre_key" ON "Prueba"("nombre");

-- CreateIndex
CREATE INDEX "Dimension_pruebaId_idx" ON "Dimension"("pruebaId");

-- CreateIndex
CREATE UNIQUE INDEX "Dimension_pruebaId_nombre_key" ON "Dimension"("pruebaId", "nombre");

-- CreateIndex
CREATE INDEX "Pregunta_pruebaId_idx" ON "Pregunta"("pruebaId");

-- CreateIndex
CREATE INDEX "Pregunta_dimensionId_idx" ON "Pregunta"("dimensionId");

-- CreateIndex
CREATE INDEX "OpcionRespuesta_preguntaId_idx" ON "OpcionRespuesta"("preguntaId");

-- CreateIndex
CREATE INDEX "UmbralClasificacion_pruebaId_idx" ON "UmbralClasificacion"("pruebaId");

-- CreateIndex
CREATE INDEX "UmbralClasificacion_dimensionId_idx" ON "UmbralClasificacion"("dimensionId");

-- CreateIndex
CREATE INDEX "ResultadoDimension_aplicacionId_idx" ON "ResultadoDimension"("aplicacionId");

-- CreateIndex
CREATE INDEX "ResultadoDimension_dimensionId_idx" ON "ResultadoDimension"("dimensionId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoDimension_aplicacionId_dimensionId_key" ON "ResultadoDimension"("aplicacionId", "dimensionId");

-- CreateIndex
CREATE INDEX "ResultadoGlobal_aplicacionId_idx" ON "ResultadoGlobal"("aplicacionId");

-- CreateIndex
CREATE INDEX "ResultadoGlobal_pruebaId_idx" ON "ResultadoGlobal"("pruebaId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoGlobal_aplicacionId_key" ON "ResultadoGlobal"("aplicacionId");

-- CreateIndex
CREATE INDEX "Aplicacion_candidatoId_pruebaId_idx" ON "Aplicacion"("candidatoId", "pruebaId");

-- CreateIndex
CREATE INDEX "Aplicacion_pruebaId_idx" ON "Aplicacion"("pruebaId");

-- CreateIndex
CREATE INDEX "Aplicacion_usuarioId_idx" ON "Aplicacion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_cedula_key" ON "Candidato"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_email_key" ON "Candidato"("email");

-- CreateIndex
CREATE INDEX "Candidato_cedula_idx" ON "Candidato"("cedula");

-- CreateIndex
CREATE INDEX "Candidato_email_idx" ON "Candidato"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Respuesta_aplicacionId_preguntaId_key" ON "Respuesta"("aplicacionId", "preguntaId");

-- CreateIndex
CREATE INDEX "Respuesta_aplicacionId_idx" ON "Respuesta"("aplicacionId");

-- CreateIndex
CREATE INDEX "Respuesta_preguntaId_idx" ON "Respuesta"("preguntaId");

-- CreateIndex
CREATE INDEX "Respuesta_opcionRespuestaId_idx" ON "Respuesta"("opcionRespuestaId");

-- AddForeignKey
ALTER TABLE "Dimension" ADD CONSTRAINT "Dimension_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcionRespuesta" ADD CONSTRAINT "OpcionRespuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UmbralClasificacion" ADD CONSTRAINT "UmbralClasificacion_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UmbralClasificacion" ADD CONSTRAINT "UmbralClasificacion_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoDimension" ADD CONSTRAINT "ResultadoDimension_aplicacionId_fkey" FOREIGN KEY ("aplicacionId") REFERENCES "Aplicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoDimension" ADD CONSTRAINT "ResultadoDimension_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoGlobal" ADD CONSTRAINT "ResultadoGlobal_aplicacionId_fkey" FOREIGN KEY ("aplicacionId") REFERENCES "Aplicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoGlobal" ADD CONSTRAINT "ResultadoGlobal_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aplicacion" ADD CONSTRAINT "Aplicacion_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aplicacion" ADD CONSTRAINT "Aplicacion_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aplicacion" ADD CONSTRAINT "Aplicacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_aplicacionId_fkey" FOREIGN KEY ("aplicacionId") REFERENCES "Aplicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_opcionRespuestaId_fkey" FOREIGN KEY ("opcionRespuestaId") REFERENCES "OpcionRespuesta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
