import { Module } from '@nestjs/common';
import { InvitacionesService } from './invitaciones.service';
import { InvitacionesController } from './invitaciones.controller';
import { ExamenPublicoController } from './examen-publico.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CalificacionModule } from '../calificacion/calificacion.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, CalificacionModule, MailModule],
  controllers: [InvitacionesController, ExamenPublicoController],
  providers: [InvitacionesService],
  exports: [InvitacionesService],
})
export class InvitacionesModule {}
