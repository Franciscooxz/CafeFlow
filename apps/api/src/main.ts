import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { corsOrigin } from './common/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  // El default de Express (100kb) no alcanza para el logo en base64 (MAX_LOGO_DATA_URL_LENGTH).
  app.useBodyParser('json', { limit: '256kb' });
  // El rewrite de Next no agrega X-Forwarded-For y deja pasar el que mande el
  // cliente, así que confiar en él solo es seguro si un proxy propio (nginx,
  // Cloudflare) delante de Next lo sobrescribe. Sin TRUST_PROXY, req.ip es la IP
  // de Next para todos.
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY);
  }

  const port = process.env.API_PORT ?? 3001;
  const prefix = process.env.API_PREFIX ?? 'api/v1';

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Global prefix
  app.setGlobalPrefix(prefix);

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CafeFlow API')
      .setDescription('Sistema POS para cafeterías — API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📚 Swagger: http://localhost:${port}/docs`);
  }

  await app.listen(port);
  console.log(`🚀 CafeFlow API running on http://localhost:${port}/${prefix}`);
}

bootstrap();
