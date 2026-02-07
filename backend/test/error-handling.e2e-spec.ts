import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Error Handling (e2e)', () => {
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

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Validation Errors (400)', () => {
    it('should return 400 for invalid registration data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          name: '',
          password: '123', // too short
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            timestamp: expect.any(String),
            path: '/auth/register',
            method: 'POST',
            error: expect.any(String),
            message: expect.any(Array),
          });
        });
    });

    it('should return 400 for forbidden non-whitelisted properties', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          maliciousField: 'should be rejected',
        })
        .expect(400);
    });
  });

  describe('Not Found Errors (404)', () => {
    it('should return 404 for non-existent book', () => {
      return request(app.getHttpServer())
        .get('/books/non-existent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 404,
            timestamp: expect.any(String),
            path: '/books/non-existent-id',
            method: 'GET',
            error: expect.any(String),
            message: expect.any(String),
          });
        });
    });

    it('should return 404 for non-existent route', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });
  });

  describe('Unauthorized Errors (401)', () => {
    it('should return 401 for protected routes without token', () => {
      return request(app.getHttpServer())
        .get('/cart')
        .expect(401)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 401,
            timestamp: expect.any(String),
            path: '/cart',
            method: 'GET',
          });
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Forbidden Errors (403)', () => {
    it('should return 403 for non-admin trying to create books', async () => {
      // First register and login as regular user
      const uniqueEmail = `user${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          name: 'Regular User',
          password: 'password123',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      const token = loginResponse.body.access_token;

      // Try to create book as regular user (should fail)
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '1234567890123',
          price: 19.99,
          stock: 10,
        })
        .expect(403);
    });
  });

  describe('Error Response Format', () => {
    it('should have consistent error response format', () => {
      return request(app.getHttpServer())
        .get('/books/invalid-id')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
          expect(res.body).toHaveProperty('method');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');

          expect(typeof res.body.statusCode).toBe('number');
          expect(typeof res.body.timestamp).toBe('string');
          expect(typeof res.body.path).toBe('string');
          expect(typeof res.body.method).toBe('string');
          expect(typeof res.body.error).toBe('string');
        });
    });
  });
});
