"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AppConfigService = class AppConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get databaseUrl() {
        return this.configService.get('DATABASE_URL');
    }
    get databaseConnectionLimit() {
        return this.configService.get('DATABASE_CONNECTION_LIMIT', 10);
    }
    get jwtSecret() {
        return this.configService.get('JWT_SECRET');
    }
    get jwtExpiresIn() {
        return this.configService.get('JWT_EXPIRES_IN', '24h');
    }
    get port() {
        return this.configService.get('PORT', 3000);
    }
    get nodeEnv() {
        return this.configService.get('NODE_ENV', 'development');
    }
    get isDevelopment() {
        return this.nodeEnv === 'development';
    }
    get isProduction() {
        return this.nodeEnv === 'production';
    }
    get isTest() {
        return this.nodeEnv === 'test';
    }
    get corsOrigin() {
        return this.configService.get('CORS_ORIGIN');
    }
    get bcryptRounds() {
        return this.configService.get('BCRYPT_ROUNDS', 10);
    }
    get swaggerTitle() {
        return this.configService.get('SWAGGER_TITLE', 'Bookstore API');
    }
    get swaggerDescription() {
        return this.configService.get('SWAGGER_DESCRIPTION', 'A comprehensive bookstore API');
    }
    get swaggerVersion() {
        return this.configService.get('SWAGGER_VERSION', '1.0');
    }
    get swaggerPath() {
        return this.configService.get('SWAGGER_PATH', 'api/docs');
    }
    get rateLimitTtl() {
        return this.configService.get('RATE_LIMIT_TTL', 60);
    }
    get rateLimitLimit() {
        return this.configService.get('RATE_LIMIT_LIMIT', 100);
    }
    get logLevel() {
        return this.configService.get('LOG_LEVEL', 'info');
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppConfigService);
//# sourceMappingURL=config.service.js.map