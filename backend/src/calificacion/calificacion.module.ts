import { Module } from '@nestjs/common';
import { CalificacionService } from './calificacion.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CalificacionService],
  exports: [CalificacionService],
})
export class CalificacionModule {}