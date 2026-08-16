import { Module } from '@nestjs/common';
import { BateriasService } from './baterias.service';
import { BateriasController } from './baterias.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BateriasController],
  providers: [BateriasService],
  exports: [BateriasService],
})
export class BateriasModule {}
