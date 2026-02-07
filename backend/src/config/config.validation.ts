import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Database Configuration
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL database connection URL'),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)'),
  JWT_EXPIRES_IN: Joi.string()
    .default('24h')
    .description('JWT token expiration time'),

  // Server Configuration
  PORT: Joi.number().port().default(3000).description('Server port number'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // CORS Configuration
  CORS_ORIGIN: Joi.string().uri().optional().description('CORS allowed origin'),

  // Bcrypt Configuration
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(8)
    .max(15)
    .default(10)
    .description('Bcrypt hash rounds'),

  // Swagger Configuration
  SWAGGER_TITLE: Joi.string()
    .default('Bookstore API')
    .description('Swagger API title'),
  SWAGGER_DESCRIPTION: Joi.string()
    .default('A comprehensive bookstore API')
    .description('Swagger API description'),
  SWAGGER_VERSION: Joi.string().default('1.0').description('API version'),
  SWAGGER_PATH: Joi.string()
    .default('api/docs')
    .description('Swagger documentation path'),

  // Database Connection Pool
  DATABASE_CONNECTION_LIMIT: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .description('Database connection pool limit'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number()
    .integer()
    .min(1)
    .default(60)
    .description('Rate limit time window in seconds'),
  RATE_LIMIT_LIMIT: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Rate limit max requests per window'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('Application log level'),
});
