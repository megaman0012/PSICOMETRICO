import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prueba } from '@prisma/client';
import { CrearPruebaDto, CrearDimensionDto } from './dto/crear-prueba.dto';

const INCLUDE_COMPLETO = {
  dimensiones: {
    include: {
      preguntas: {
        include: {
          opciones: true,
        },
        orderBy: { orden: 'asc' },
      },
      umbrales: true,
    },
    orderBy: { orden: 'asc' },
  },
  preguntas: {
    include: {
      opciones: true,
    },
    orderBy: { orden: 'asc' },
  },
  umbrales: true,
} as const;

@Injectable()
export class PruebasService {
  constructor(private prisma: PrismaService) {}

  async encontrarTodas(): Promise<Prueba[]> {
    return this.prisma.prueba.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async encontrarTodasAdmin(): Promise<Prueba[]> {
    return this.prisma.prueba.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { dimensiones: true, aplicaciones: true } },
      },
    });
  }

  async encontrarPorId(id: number): Promise<Prueba | null> {
    return this.prisma.prueba.findUnique({
      where: { id },
      include: INCLUDE_COMPLETO,
    });
  }

  async crear(dto: CrearPruebaDto): Promise<Prueba> {
    return this.prisma.$transaction(async (tx) => {
      const existe = await tx.prueba.findUnique({ where: { nombre: dto.nombre } });
      if (existe) {
        throw new ConflictException(`Ya existe una prueba con el nombre "${dto.nombre}"`);
      }

      const prueba = await tx.prueba.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion ?? null,
          version: dto.version ?? '1.0',
          activa: dto.activa ?? true,
        },
      });

      await this.crearEstructura(tx, prueba.id, dto);

      return tx.prueba.findUnique({
        where: { id: prueba.id },
        include: INCLUDE_COMPLETO,
      }) as Promise<Prueba>;
    });
  }

  async actualizar(id: number, dto: CrearPruebaDto): Promise<Prueba> {
    const prueba = await this.prisma.prueba.findUnique({ where: { id } });
    if (!prueba) {
      throw new NotFoundException(`Prueba con ID ${id} no encontrada`);
    }

    return this.prisma.$transaction(async (tx) => {
      const conflict = await tx.prueba.findFirst({
        where: { nombre: dto.nombre, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(`Ya existe otra prueba con el nombre "${dto.nombre}"`);
      }

      await tx.prueba.update({
        where: { id },
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion ?? null,
          version: dto.version ?? '1.0',
          activa: dto.activa ?? true,
        },
      });

      // Reconstruir estructura: dimensiones, preguntas, opciones y umbrales
      await this.eliminarEstructura(tx, id);
      await this.crearEstructura(tx, id, dto);

      return tx.prueba.findUnique({
        where: { id },
        include: INCLUDE_COMPLETO,
      }) as Promise<Prueba>;
    });
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const prueba = await this.prisma.prueba.findUnique({
      where: { id },
      include: { _count: { select: { aplicaciones: true } } },
    });
    if (!prueba) {
      throw new NotFoundException(`Prueba con ID ${id} no encontrada`);
    }
    if (prueba._count.aplicaciones > 0) {
      throw new BadRequestException(
        `No se puede eliminar la prueba "${prueba.nombre}": tiene ${prueba._count.aplicaciones} aplicación(es) registrada(s). Desactive la prueba en su lugar.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.eliminarEstructura(tx, id);
      await tx.prueba.delete({ where: { id } });
    });

    return { mensaje: `Prueba "${prueba.nombre}" eliminada correctamente` };
  }

  async cambiarEstado(id: number, activa: boolean): Promise<Prueba> {
    const prueba = await this.prisma.prueba.findUnique({ where: { id } });
    if (!prueba) {
      throw new NotFoundException(`Prueba con ID ${id} no encontrada`);
    }
    return this.prisma.prueba.update({ where: { id }, data: { activa } });
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  private async crearEstructura(
    tx: any,
    pruebaId: number,
    dto: CrearPruebaDto,
  ): Promise<void> {
    for (const dim of dto.dimensiones ?? []) {
      await this.crearDimension(tx, pruebaId, dim);
    }

    // Umbrales globales de la prueba (sin dimensión)
    for (const umbral of dto.umbrales ?? []) {
      await tx.umbralClasificacion.create({
        data: {
          nombre: umbral.nombre,
          descripcion: umbral.descripcion ?? null,
          puntuacionMinima: umbral.puntuacionMinima,
          puntuacionMaxima: umbral.puntuacionMaxima,
          interpretacion: umbral.interpretacion,
          pruebaId,
        },
      });
    }
  }

  private async crearDimension(tx: any, pruebaId: number, dim: CrearDimensionDto): Promise<void> {
    const dimension = await tx.dimension.create({
      data: {
        nombre: dim.nombre,
        descripcion: dim.descripcion ?? null,
        pruebaId,
        orden: dim.orden ?? 0,
        tipoAgregacion: dim.tipoAgregacion ?? 'SUMA',
      },
    });

    for (const umbral of dim.umbrales ?? []) {
      await tx.umbralClasificacion.create({
        data: {
          nombre: umbral.nombre,
          descripcion: umbral.descripcion ?? null,
          puntuacionMinima: umbral.puntuacionMinima,
          puntuacionMaxima: umbral.puntuacionMaxima,
          interpretacion: umbral.interpretacion,
          pruebaId,
          dimensionId: dimension.id,
        },
      });
    }

    for (const pregunta of dim.preguntas ?? []) {
      const creada = await tx.pregunta.create({
        data: {
          enunciado: pregunta.enunciado,
          tipo: pregunta.tipo ?? 'LIKERT',
          pruebaId,
          dimensionId: dimension.id,
          orden: pregunta.orden ?? 0,
        },
      });
      for (const opcion of pregunta.opciones ?? []) {
        await tx.opcionRespuesta.create({
          data: {
            texto: opcion.texto,
            valor: opcion.valor,
            esCorrecta: opcion.esCorrecta ?? false,
            preguntaId: creada.id,
          },
        });
      }
    }
  }

  // Elimina todas las filas dependientes de la prueba (resultados, respuestas, opciones, preguntas, dimensiones, umbrales).
  private async eliminarEstructura(tx: any, pruebaId: number): Promise<void> {
    const preguntas = await tx.pregunta.findMany({
      where: { pruebaId },
      select: { id: true },
    });
    const preguntaIds = preguntas.map((p: { id: number }) => p.id);

    if (preguntaIds.length > 0) {
      await tx.respuesta.deleteMany({ where: { preguntaId: { in: preguntaIds } } });
      await tx.opcionRespuesta.deleteMany({ where: { preguntaId: { in: preguntaIds } } });
    }

    await tx.resultadoDimension.deleteMany({
      where: { dimension: { pruebaId } },
    });
    await tx.resultadoGlobal.deleteMany({ where: { pruebaId } });
    await tx.pregunta.deleteMany({ where: { pruebaId } });
    await tx.dimension.deleteMany({ where: { pruebaId } });
    await tx.umbralClasificacion.deleteMany({ where: { pruebaId } });
  }
}
