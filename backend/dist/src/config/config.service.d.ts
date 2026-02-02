import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class AppConfigService {
    private readonly configService;
    constructor(configService: NestConfigService);
    get databaseUrl(): string;
    get databaseConnectionLimit(): number;
    get jwtSecret(): string;
    get jwtExpiresIn(): string;
    get port(): number;
    get nodeEnv(): string;
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get isTest(): boolean;
    get corsOrigin(): string | undefined;
    get bcryptRounds(): number;
    get swaggerTitle(): string;
    get swaggerDescription(): string;
    get swaggerVersion(): string;
    get swaggerPath(): string;
    get rateLimitTtl(): number;
    get rateLimitLimit(): number;
    get logLevel(): string;
}
