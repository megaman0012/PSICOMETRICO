import { Module } from '@nestjs/common';
import { AplicacionesService } from './aplicaciones.service';
import { AplicacionesController } from './aplicaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CalificacionModule } from '../calificacion/calificacion.module';

@Module({
  imports: [PrismaModule, CalificacionModule],
  controllers: [AplicacionesController],
  providers: [AplicacionesService],
})
export class AplicacionesModule {}