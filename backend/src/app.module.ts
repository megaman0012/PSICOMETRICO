import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { AuthModule } from './auth/auth.module';
import { PruebasModule } from './pruebas/pruebas.module';
import { CandidatosModule } from './candidatos/candidatos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AplicacionesModule } from './aplicaciones/aplicaciones.module';
import { CalificacionModule } from './calificacion/calificacion.module';
import { ReportesModule } from './reportes/reportes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    PruebasModule,
    CandidatosModule,
    UsuariosModule,
    AplicacionesModule,
    CalificacionModule,
    ReportesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}