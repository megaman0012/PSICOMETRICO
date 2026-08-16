import 'dotenv/config';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const DEFAULT_JWT_SECRET = 'cambia_este_secreto_en_produccion';

function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEFAULT_JWT_SECRET) {
    console.error(
      '[FATAL] JWT_SECRET no está configurado o usa el valor por defecto de desarrollo.\n' +
        'En producción es obligatorio definir uno real en el .env del servidor:\n' +
        '  openssl rand -base64 48',
    );
    process.exit(1);
  }
}

function resolveCorsOrigin(): string | string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) {
    return 'http://localhost:5173';
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  validateProductionConfig();
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({
    origin: resolveCorsOrigin(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend psicométrico corriendo en http://localhost:${port}`);
}
bootstrap();
