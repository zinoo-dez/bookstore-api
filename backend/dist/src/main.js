"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const swagger_1 = require("@nestjs/swagger");
const config_service_1 = require("./config/config.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_service_1.AppConfigService);
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    if (configService.corsOrigin) {
        app.enableCors({
            origin: configService.corsOrigin,
            credentials: true,
        });
    }
    const config = new swagger_1.DocumentBuilder()
        .setTitle(configService.swaggerTitle)
        .setDescription(configService.swaggerDescription)
        .setVersion(configService.swaggerVersion)
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('auth', 'Authentication endpoints')
        .addTag('books', 'Book management endpoints')
        .addTag('cart', 'Shopping cart endpoints')
        .addTag('orders', 'Order management endpoints')
        .addTag('users', 'User management endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup(configService.swaggerPath, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    console.log(`🚀 Application is running on: http://localhost:${configService.port}`);
    console.log(`📚 Swagger documentation: http://localhost:${configService.port}/${configService.swaggerPath}`);
    console.log(`🌍 Environment: ${configService.nodeEnv}`);
    await app.listen(configService.port);
}
void bootstrap();
//# sourceMappingURL=main.js.map