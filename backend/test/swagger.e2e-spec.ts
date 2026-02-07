import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import * as fc from 'fast-check';

describe('Swagger Documentation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same global configuration as main.ts
    app.useGlobalFilters(new AllExceptionsFilter());
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

    // Configure Swagger
    const config = new DocumentBuilder()
      .setTitle('Bookstore API')
      .setDescription(
        'A comprehensive bookstore API with authentication, book management, shopping cart, and order processing',
      )
      .setVersion('1.0')
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
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Swagger Documentation Accessibility', () => {
    it('should serve Swagger UI at /api/docs', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('swagger-ui');
          expect(res.text).toContain('<div id="swagger-ui"></div>');
          expect(res.text).toContain('swagger-ui-bundle.js');
        });
    });

    it('should serve Swagger JSON at /api/docs-json', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('paths');
          expect(res.body.info.title).toBe('Bookstore API');
          expect(res.body.info.version).toBe('1.0');
        });
    });

    it('should include all API endpoints in documentation', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          const paths = res.body.paths;

          // Check auth endpoints
          expect(paths).toHaveProperty('/auth/register');
          expect(paths).toHaveProperty('/auth/login');

          // Check books endpoints
          expect(paths).toHaveProperty('/books');
          expect(paths).toHaveProperty('/books/{id}');

          // Check cart endpoints
          expect(paths).toHaveProperty('/cart');
          expect(paths).toHaveProperty('/cart/{bookId}');

          // Check orders endpoints
          expect(paths).toHaveProperty('/orders');
          expect(paths).toHaveProperty('/orders/{id}');
        });
    });

    it('should include security definitions for JWT', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('components');
          expect(res.body.components).toHaveProperty('securitySchemes');
          expect(res.body.components.securitySchemes).toHaveProperty(
            'JWT-auth',
          );
          expect(res.body.components.securitySchemes['JWT-auth'].type).toBe(
            'http',
          );
          expect(res.body.components.securitySchemes['JWT-auth'].scheme).toBe(
            'bearer',
          );
        });
    });

    it('should include API tags', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tags');
          const tagNames = res.body.tags.map((tag: any) => tag.name);
          expect(tagNames).toContain('auth');
          expect(tagNames).toContain('books');
          expect(tagNames).toContain('cart');
          expect(tagNames).toContain('orders');
          expect(tagNames).toContain('users');
        });
    });
  });

  describe('Property Tests', () => {
    /**
     * **Property 32: Swagger documentation is accessible**
     * **Validates: Requirements 9.1**
     */
    it('Property 32: Swagger documentation is accessible', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('/api/docs', '/api/docs-json'),
          async (endpoint) => {
            const response = await request(app.getHttpServer())
              .get(endpoint)
              .expect(200);

            if (endpoint === '/api/docs') {
              // Swagger UI should contain expected elements
              expect(response.text).toContain('swagger-ui');
              expect(response.text).toContain('<div id="swagger-ui"></div>');
              expect(response.text).toContain('swagger-ui-bundle.js');
            } else {
              // Swagger JSON should have proper OpenAPI structure
              expect(response.body).toHaveProperty('openapi');
              expect(response.body).toHaveProperty('info');
              expect(response.body).toHaveProperty('paths');
              expect(response.body.info.title).toBe('Bookstore API');
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe('API Documentation Content', () => {
    it('should document request/response schemas', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          const paths = res.body.paths;

          // Check that POST /auth/register has request body schema
          expect(paths['/auth/register'].post).toHaveProperty('requestBody');
          expect(
            paths['/auth/register'].post.requestBody.content[
              'application/json'
            ],
          ).toHaveProperty('schema');

          // Check that endpoints have response schemas
          expect(paths['/auth/register'].post).toHaveProperty('responses');
          expect(paths['/auth/register'].post.responses['201']).toHaveProperty(
            'description',
          );
        });
    });

    it('should include operation summaries and descriptions', () => {
      return request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200)
        .expect((res) => {
          const paths = res.body.paths;

          // Check that operations have summaries
          expect(paths['/auth/register'].post).toHaveProperty('summary');
          expect(paths['/books'].get).toHaveProperty('summary');
          expect(paths['/cart'].post).toHaveProperty('summary');
          expect(paths['/orders'].post).toHaveProperty('summary');
        });
    });
  });
});
