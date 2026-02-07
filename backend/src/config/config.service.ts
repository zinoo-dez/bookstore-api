import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService) {}

  // Database Configuration
  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL')!;
  }

  get databaseConnectionLimit(): number {
    return this.configService.get<number>('DATABASE_CONNECTION_LIMIT', 10);
  }

  // JWT Configuration
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '24h');
  }

  // Server Configuration
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // CORS Configuration
  get corsOrigin(): string | undefined {
    return this.configService.get<string>('CORS_ORIGIN');
  }

  // Bcrypt Configuration
  get bcryptRounds(): number {
    return this.configService.get<number>('BCRYPT_ROUNDS', 10);
  }

  // Swagger Configuration
  get swaggerTitle(): string {
    return this.configService.get<string>('SWAGGER_TITLE', 'Bookstore API');
  }

  get swaggerDescription(): string {
    return this.configService.get<string>(
      'SWAGGER_DESCRIPTION',
      'A comprehensive bookstore API',
    );
  }

  get swaggerVersion(): string {
    return this.configService.get<string>('SWAGGER_VERSION', '1.0');
  }

  get swaggerPath(): string {
    return this.configService.get<string>('SWAGGER_PATH', 'api/docs');
  }

  // Rate Limiting Configuration
  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 60);
  }

  get rateLimitLimit(): number {
    return this.configService.get<number>('RATE_LIMIT_LIMIT', 100);
  }

  // Logging Configuration
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }
}
