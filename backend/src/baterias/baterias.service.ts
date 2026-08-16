import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Bateria, Prisma } from '@prisma/client';
import { CrearBateriaDto } from './dto/crear-bateria.dto';

@Injectable()
export class BateriasService {
  constructor(private prisma: PrismaService) {}

  private includePruebas(): Prisma.BateriaInclude {
    return {
      empresa: true,
      pruebas: {
        include: { prueba: true },
        orderBy: { orden: 'asc' },
      },
      _count: { select: { invitaciones: true } },
    };
  }

  async listar(): Promise<Bateria[]> {
    return this.prisma.bateria.findMany({
      include: this.includePruebas(),
      orderBy: { nombre: 'asc' },
    });
  }

  async listarActivas(): Promise<Bateria[]> {
    return this.prisma.bateria.findMany({
      where: { activa: true },
      include: this.includePruebas(),
      orderBy: { nombre: 'asc' },
    });
  }

  async crear(dto: CrearBateriaDto): Promise<Bateria> {
    const { pruebaIds, ...data } = dto;
    return this.prisma.bateria.create({
      data: {
        ...data,
        pruebas: pruebaIds
          ? {
              create: pruebaIds.map((pruebaId, idx) => ({ pruebaId, orden: idx })),
            }
          : undefined,
      },
      include: this.includePruebas(),
    });
  }

  async actualizar(id: number, dto: CrearBateriaDto): Promise<Bateria> {
    const existente = await this.prisma.bateria.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Batería con ID ${id} no encontrada`);
    }
    const { pruebaIds, ...data } = dto;
    return this.prisma.bateria.update({
      where: { id },
      data: {
        ...data,
        pruebas: pruebaIds
          ? {
              deleteMany: {},
              create: pruebaIds.map((pruebaId, idx) => ({ pruebaId, orden: idx })),
            }
          : undefined,
      },
      include: this.includePruebas(),
    });
  }

  async eliminar(id: number): Promise<{ eliminada: boolean }> {
    const existente = await this.prisma.bateria.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Batería con ID ${id} no encontrada`);
    }
    await this.prisma.bateria.delete({ where: { id } });
    return { eliminada: true };
  }
}
