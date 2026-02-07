import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(AppConfigService);

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  if (configService.corsOrigin) {
    app.enableCors({
      origin: configService.corsOrigin,
      credentials: true,
    });
  }

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle(configService.swaggerTitle)
    .setDescription(configService.swaggerDescription)
    .setVersion(configService.swaggerVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('books', 'Book management endpoints')
    .addTag('cart', 'Shopping cart endpoints')
    .addTag('orders', 'Order management endpoints')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(configService.swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(
    `🚀 Application is running on: http://localhost:${configService.port}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${configService.port}/${configService.swaggerPath}`,
  );
  console.log(`🌍 Environment: ${configService.nodeEnv}`);

  await app.listen(configService.port);
}
void bootstrap();
