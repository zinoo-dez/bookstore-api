"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.configValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().required().description('PostgreSQL database connection URL'),
    JWT_SECRET: Joi.string().min(32).required().description('JWT secret key (minimum 32 characters)'),
    JWT_EXPIRES_IN: Joi.string().default('24h').description('JWT token expiration time'),
    PORT: Joi.number().port().default(3000).description('Server port number'),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    CORS_ORIGIN: Joi.string().uri().optional().description('CORS allowed origin'),
    BCRYPT_ROUNDS: Joi.number().integer().min(8).max(15).default(10).description('Bcrypt hash rounds'),
    SWAGGER_TITLE: Joi.string().default('Bookstore API').description('Swagger API title'),
    SWAGGER_DESCRIPTION: Joi.string().default('A comprehensive bookstore API').description('Swagger API description'),
    SWAGGER_VERSION: Joi.string().default('1.0').description('API version'),
    SWAGGER_PATH: Joi.string().default('api/docs').description('Swagger documentation path'),
    DATABASE_CONNECTION_LIMIT: Joi.number().integer().min(1).max(100).default(10).description('Database connection pool limit'),
    RATE_LIMIT_TTL: Joi.number().integer().min(1).default(60).description('Rate limit time window in seconds'),
    RATE_LIMIT_LIMIT: Joi.number().integer().min(1).default(100).description('Rate limit max requests per window'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info').description('Application log level'),
});
//# sourceMappingURL=config.validation.js.map