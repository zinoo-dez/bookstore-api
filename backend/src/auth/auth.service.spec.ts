import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string, defaultValue?: any) => {
                const config: { [key: string]: any } = {
                  BCRYPT_ROUNDS: 10,
                  JWT_SECRET: 'test-secret',
                  JWT_EXPIRES_IN: '24h',
                };
                return config[key] || defaultValue;
              }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Property Tests', () => {
    /**
     * **Property 1: User registration creates account**
     * **Validates: Requirements 1.1**
     */
    it('Property 1: User registration creates account', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (userData: RegisterDto) => {
            // Arrange: Mock that user doesn't exist and creation succeeds
            const mockUser = {
              id: 'test-id',
              email: userData.email,
              name: userData.name,
              role: 'USER' as const,
              createdAt: new Date(),
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
              null,
            );
            (prismaService.user.create as jest.Mock).mockResolvedValue(
              mockUser,
            );

            // Act: Register user
            const result = await service.register(userData);

            // Assert: User account is created
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
              where: { email: userData.email },
            });
            expect(prismaService.user.create).toHaveBeenCalledWith({
              data: {
                email: userData.email,
                name: userData.name,
                password: expect.any(String), // hashed password
              },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
              },
            });
            expect(result).toEqual(mockUser);
            expect(result).not.toHaveProperty('password');
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 2: Valid login returns JWT token**
     * **Validates: Requirements 1.2**
     */
    it('Property 2: Valid login returns JWT token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (loginData) => {
            // Arrange: Mock existing user with hashed password
            const hashedPassword = '$2b$10$mockHashedPassword';
            const mockUser = {
              id: 'test-user-id',
              email: loginData.email,
              name: 'Test User',
              password: hashedPassword,
              role: 'USER' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockToken = 'mock-jwt-token';

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
              mockUser,
            );
            (jwtService.signAsync as jest.Mock).mockResolvedValue(mockToken);

            // Mock bcrypt.compare to return true for valid password
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            // Act: Login user
            const result = await service.login(loginData);

            // Assert: JWT token is returned
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
              where: { email: loginData.email },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(
              loginData.password,
              hashedPassword,
            );
            expect(jwtService.signAsync).toHaveBeenCalledWith({
              sub: mockUser.id,
              email: mockUser.email,
              role: mockUser.role,
            });
            expect(result).toEqual({
              access_token: mockToken,
            });
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 3: Invalid password rejects login**
     * **Validates: Requirements 1.3**
     */
    it('Property 3: Invalid password rejects login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (loginData) => {
            // Arrange: Mock existing user with different hashed password
            const hashedPassword = '$2b$10$differentHashedPassword';
            const mockUser = {
              id: 'test-user-id',
              email: loginData.email,
              name: 'Test User',
              password: hashedPassword,
              role: 'USER' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
              mockUser,
            );

            // Mock bcrypt.compare to return false for invalid password
            const bcrypt = require('bcrypt');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            // Act & Assert: Login should be rejected
            await expect(service.login(loginData)).rejects.toThrow(
              'Invalid credentials',
            );

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
              where: { email: loginData.email },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(
              loginData.password,
              hashedPassword,
            );
            expect(jwtService.signAsync).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 5: Passwords are hashed**
     * **Validates: Requirements 1.5**
     */
    it('Property 5: Passwords are hashed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (userData: RegisterDto) => {
            // Arrange: Mock that user doesn't exist
            const mockUser = {
              id: 'test-id',
              email: userData.email,
              name: userData.name,
              role: 'USER' as const,
              createdAt: new Date(),
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
              null,
            );
            (prismaService.user.create as jest.Mock).mockResolvedValue(
              mockUser,
            );

            // Spy on bcrypt.hash to verify it's called
            const bcrypt = require('bcrypt');
            const hashSpy = jest
              .spyOn(bcrypt, 'hash')
              .mockResolvedValue('$2b$10$hashedPassword');

            // Act: Register user
            await service.register(userData);

            // Assert: Password is hashed before storage
            expect(hashSpy).toHaveBeenCalledWith(userData.password, 10);
            expect(prismaService.user.create).toHaveBeenCalledWith({
              data: {
                email: userData.email,
                name: userData.name,
                password: '$2b$10$hashedPassword', // hashed password, not plain text
              },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
              },
            });

            // Verify the password passed to create is not the original password
            const createCall = (prismaService.user.create as jest.Mock).mock
              .calls[0][0];
            expect(createCall.data.password).not.toBe(userData.password);
            expect(createCall.data.password).toMatch(/^\$2b\$10\$/); // bcrypt hash format
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 6: Duplicate email registration rejected**
     * **Validates: Requirements 1.6**
     */
    it('Property 6: Duplicate email registration rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (userData: RegisterDto) => {
            // Arrange: Mock that user already exists with this email
            const existingUser = {
              id: 'existing-user-id',
              email: userData.email,
              name: 'Existing User',
              password: '$2b$10$existingHashedPassword',
              role: 'USER' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
              existingUser,
            );

            // Act & Assert: Registration should be rejected
            await expect(service.register(userData)).rejects.toThrow(
              'Email already registered',
            );

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
              where: { email: userData.email },
            });
            expect(prismaService.user.create).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);
  });

  describe('Unit Tests', () => {
    describe('register', () => {
      it('should register a user with valid data', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        };

        const mockUser = {
          id: 'test-id',
          email: registerDto.email,
          name: registerDto.name,
          role: 'USER' as const,
          createdAt: new Date(),
        };

        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

        // Act
        const result = await service.register(registerDto);

        // Assert
        expect(result).toEqual(mockUser);
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: registerDto.email },
        });
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: {
            email: registerDto.email,
            name: registerDto.name,
            password: expect.any(String),
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });
      });

      it('should throw BadRequestException for duplicate email', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'existing@example.com',
          name: 'Test User',
          password: 'password123',
        };

        const existingUser = {
          id: 'existing-id',
          email: registerDto.email,
          name: 'Existing User',
          password: 'hashedPassword',
          role: 'USER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          existingUser,
        );

        // Act & Assert
        await expect(service.register(registerDto)).rejects.toThrow(
          'Email already registered',
        );
        expect(prismaService.user.create).not.toHaveBeenCalled();
      });
    });

    describe('login', () => {
      it('should login with valid credentials', async () => {
        // Arrange
        const loginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = {
          id: 'test-id',
          email: loginDto.email,
          name: 'Test User',
          password: '$2b$10$hashedPassword',
          role: 'USER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockToken = 'mock-jwt-token';

        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          mockUser,
        );
        (jwtService.signAsync as jest.Mock).mockResolvedValue(mockToken);

        const bcrypt = require('bcrypt');
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

        // Act
        const result = await service.login(loginDto);

        // Assert
        expect(result).toEqual({ access_token: mockToken });
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: loginDto.email },
        });
        expect(jwtService.signAsync).toHaveBeenCalledWith({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        });
      });

      it('should throw UnauthorizedException for non-existent user', async () => {
        // Arrange
        const loginDto = {
          email: 'nonexistent@example.com',
          password: 'password123',
        };

        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(service.login(loginDto)).rejects.toThrow(
          'Invalid credentials',
        );
        expect(jwtService.signAsync).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException for invalid password', async () => {
        // Arrange
        const loginDto = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        const mockUser = {
          id: 'test-id',
          email: loginDto.email,
          name: 'Test User',
          password: '$2b$10$hashedPassword',
          role: 'USER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          mockUser,
        );

        const bcrypt = require('bcrypt');
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        // Act & Assert
        await expect(service.login(loginDto)).rejects.toThrow(
          'Invalid credentials',
        );
        expect(jwtService.signAsync).not.toHaveBeenCalled();
      });
    });
  });
});
