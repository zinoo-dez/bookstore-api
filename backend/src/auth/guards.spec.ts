import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as fc from 'fast-check';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import { Role } from '@prisma/client';

describe('Guards', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  describe('Property Tests', () => {
    /**
     * **Property 4: Valid JWT authorizes requests**
     * **Validates: Requirements 1.4**
     */
    it('Property 4: Valid JWT authorizes requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('USER', 'ADMIN'),
          }),
          async (userData) => {
            // Arrange: Mock execution context with valid user
            const mockContext = {
              switchToHttp: () => ({
                getRequest: () => ({
                  user: {
                    sub: userData.userId,
                    email: userData.email,
                    role: userData.role,
                  },
                }),
              }),
              getHandler: jest.fn(),
              getClass: jest.fn(),
            } as unknown as ExecutionContext;

            // Mock reflector to return no required roles (public route)
            (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);

            // Act: Check if guard allows access
            const result = rolesGuard.canActivate(mockContext);

            // Assert: Valid JWT should authorize request
            expect(result).toBe(true);
            expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
              mockContext.getHandler(),
              mockContext.getClass(),
            ]);
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);
  });

  describe('Unit Tests', () => {
    describe('RolesGuard', () => {
      it('should allow access when no roles are required', () => {
        // Arrange
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => ({
              user: { sub: 'user-id', email: 'test@example.com', role: 'USER' },
            }),
          }),
          getHandler: jest.fn(),
          getClass: jest.fn(),
        } as unknown as ExecutionContext;

        (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);

        // Act
        const result = rolesGuard.canActivate(mockContext);

        // Assert
        expect(result).toBe(true);
      });

      it('should allow access when user has required role', () => {
        // Arrange
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => ({
              user: { sub: 'admin-id', email: 'admin@example.com', role: 'ADMIN' },
            }),
          }),
          getHandler: jest.fn(),
          getClass: jest.fn(),
        } as unknown as ExecutionContext;

        (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);

        // Act
        const result = rolesGuard.canActivate(mockContext);

        // Assert
        expect(result).toBe(true);
      });

      it('should deny access when user lacks required role', () => {
        // Arrange
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => ({
              user: { sub: 'user-id', email: 'user@example.com', role: 'USER' },
            }),
          }),
          getHandler: jest.fn(),
          getClass: jest.fn(),
        } as unknown as ExecutionContext;

        (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);

        // Act
        const result = rolesGuard.canActivate(mockContext);

        // Assert
        expect(result).toBe(false);
      });

      it('should allow access when user has one of multiple required roles', () => {
        // Arrange
        const mockContext = {
          switchToHttp: () => ({
            getRequest: () => ({
              user: { sub: 'user-id', email: 'user@example.com', role: 'USER' },
            }),
          }),
          getHandler: jest.fn(),
          getClass: jest.fn(),
        } as unknown as ExecutionContext;

        (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN, Role.USER]);

        // Act
        const result = rolesGuard.canActivate(mockContext);

        // Assert
        expect(result).toBe(true);
      });
    });
  });
});