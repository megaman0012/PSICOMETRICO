import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Empresa } from '@prisma/client';
import { CrearEmpresaDto } from './dto/crear-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async listar(): Promise<Empresa[]> {
    return this.prisma.empresa.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { candidatos: true } } },
    });
  }

  async crear(dto: CrearEmpresaDto): Promise<Empresa> {
    return this.prisma.empresa.create({ data: dto });
  }

  async actualizar(id: number, dto: CrearEmpresaDto): Promise<Empresa> {
    return this.prisma.empresa.update({ where: { id }, data: dto });
  }
}
