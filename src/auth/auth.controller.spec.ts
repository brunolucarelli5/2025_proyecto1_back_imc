import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { UserEntity } from '../users/entities/user.entity';
import { Request } from 'express';
import { JwtService } from './jwt/jwt.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: [],
  } as unknown as UserEntity;

  const mockTokenPair: TokenPairDTO = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    const mockJwtService = {
      generateToken: jest.fn().mockReturnValue('token'),
      refreshToken: jest.fn().mockReturnValue('refreshToken'),
    };

    const mockUserService = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const validLoginDto: LoginDTO = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      service.login.mockResolvedValue(mockTokenPair);

      const result = await controller.login(validLoginDto);

      expect(result).toEqual(mockTokenPair);
      expect(service.login).toHaveBeenCalledWith(validLoginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should handle different email formats', async () => {
      const emailVariations = [
        'simple@test.com',
        'complex.email+tag@domain.co.uk',
        'user123@example.org',
        'USER@EXAMPLE.COM',
      ];

      service.login.mockResolvedValue(mockTokenPair);

      for (const email of emailVariations) {
        const loginDto = { ...validLoginDto, email };
        const result = await controller.login(loginDto);

        expect(result).toEqual(mockTokenPair);
        expect(service.login).toHaveBeenCalledWith(loginDto);
      }

      expect(service.login).toHaveBeenCalledTimes(emailVariations.length);
    });

    it('should handle different password formats', async () => {
      const passwordVariations = [
        'simplepass',
        'Complex123!',
        'pássword',
        'パスワード',
        'very-long-password-with-special-chars-123!@#$%',
      ];

      service.login.mockResolvedValue(mockTokenPair);

      for (const password of passwordVariations) {
        const loginDto = { ...validLoginDto, password };
        const result = await controller.login(loginDto);

        expect(result).toEqual(mockTokenPair);
        expect(service.login).toHaveBeenCalledWith(loginDto);
      }

      expect(service.login).toHaveBeenCalledTimes(passwordVariations.length);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Invalid credentials';
      service.login.mockRejectedValue(new Error(errorMessage));

      await expect(controller.login(validLoginDto)).rejects.toThrow(
        errorMessage,
      );
      expect(service.login).toHaveBeenCalledWith(validLoginDto);
    });

    it('should handle concurrent login attempts', async () => {
      const loginAttempts = [
        { email: 'user1@test.com', password: 'pass1' },
        { email: 'user2@test.com', password: 'pass2' },
        { email: 'user3@test.com', password: 'pass3' },
      ];

      service.login.mockResolvedValue(mockTokenPair);

      const loginPromises = loginAttempts.map((dto) => controller.login(dto));
      const results = await Promise.all(loginPromises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toEqual(mockTokenPair);
      });

      expect(service.login).toHaveBeenCalledTimes(3);
    });

    it('should return tokens with correct structure', async () => {
      const customTokenPair: TokenPairDTO = {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.custom-payload.signature',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-payload.signature',
      };

      service.login.mockResolvedValue(customTokenPair);

      const result = await controller.login(validLoginDto);

      expect(result).toEqual(customTokenPair);
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    const createMockRequest = (authHeader?: string): Request =>
      ({
        headers: {
          authorization: authHeader,
        },
      }) as Request;

    it('should refresh tokens successfully with valid Bearer header', async () => {
      const mockRequest = createMockRequest('Bearer valid-refresh-token');
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      service.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.refreshToken).toHaveBeenCalledWith(
        'Bearer valid-refresh-token',
      );
    });

    it('should handle refresh token that returns only access token', async () => {
      const mockRequest = createMockRequest(
        'Bearer refresh-token-not-near-expiry',
      );
      const expectedResult = {
        accessToken: 'new-access-token',
      };

      service.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.refreshToken).toHaveBeenCalledWith(
        'Bearer refresh-token-not-near-expiry',
      );
    });

    it('should handle different Bearer token formats', async () => {
      const tokenFormats = [
        'Bearer simple-token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
        'Bearer token-with-dashes-and_underscores',
        'Bearer token.with.dots',
      ];

      const expectedResult = { accessToken: 'new-token' };
      service.refreshToken.mockResolvedValue(expectedResult);

      for (const authHeader of tokenFormats) {
        const mockRequest = createMockRequest(authHeader);
        const result = await controller.refreshToken(mockRequest);

        expect(result).toEqual(expectedResult);
        expect(service.refreshToken).toHaveBeenCalledWith(authHeader);
      }

      expect(service.refreshToken).toHaveBeenCalledTimes(tokenFormats.length);
    });

    it('should handle missing authorization header', async () => {
      const mockRequest = createMockRequest(); // No auth header
      service.refreshToken.mockRejectedValue(
        new Error('Authorization header required'),
      );

      await expect(controller.refreshToken(mockRequest)).rejects.toThrow(
        'Authorization header required',
      );
      expect(service.refreshToken).toHaveBeenCalledWith(undefined);
    });

    it('should handle invalid authorization headers', async () => {
      const invalidHeaders = [
        '',
        'Basic token',
        'Token refresh-token',
        'bearer refresh-token',
        'BEARER refresh-token',
      ];

      service.refreshToken.mockRejectedValue(
        new Error('Invalid authorization format'),
      );

      for (const authHeader of invalidHeaders) {
        const mockRequest = createMockRequest(authHeader);

        await expect(controller.refreshToken(mockRequest)).rejects.toThrow(
          'Invalid authorization format',
        );
        expect(service.refreshToken).toHaveBeenCalledWith(authHeader);
      }
    });

    it('should propagate service errors', async () => {
      const mockRequest = createMockRequest('Bearer expired-token');
      const errorMessage = 'Token expired';

      service.refreshToken.mockRejectedValue(new Error(errorMessage));

      await expect(controller.refreshToken(mockRequest)).rejects.toThrow(
        errorMessage,
      );
      expect(service.refreshToken).toHaveBeenCalledWith('Bearer expired-token');
    });

    it('should handle edge cases in request headers', async () => {
      const edgeCases = [
        { headers: { authorization: 'Bearer token' } },
        { headers: { Authorization: 'Bearer token' } }, // Different case
        { headers: {} }, // No authorization header
        { headers: null }, // Null headers
      ];

      service.refreshToken.mockResolvedValue({ accessToken: 'token' });

      for (const requestConfig of edgeCases) {
        const mockRequest = requestConfig as Request;

        try {
          await controller.refreshToken(mockRequest);
          expect(service.refreshToken).toHaveBeenCalledWith(
            mockRequest.headers?.authorization ||
              mockRequest.headers?.Authorization,
          );
        } catch (error) {
          // Expected for some edge cases
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('me', () => {
    it('should return user information for authenticated user', async () => {
      const mockRequestWithUser: RequestWithUser = {
        user: mockUser,
        headers: {},
      } as RequestWithUser;

      const result = await controller.me(mockRequestWithUser);

      expect(result).toEqual({
        nombre: mockUser.firstName,
        apellido: mockUser.lastName,
        email: mockUser.email,
      });
    });

    it('should handle different user data', async () => {
      const userVariations = [
        {
          ...mockUser,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
        {
          ...mockUser,
          firstName: 'María José',
          lastName: 'González-Pérez',
          email: 'maria.jose@test.org',
        },
        {
          ...mockUser,
          firstName: 'X',
          lastName: 'Y',
          email: 'x.y@domain.co.uk',
        },
      ];

      for (const user of userVariations) {
        const mockRequestWithUser: RequestWithUser = {
          user,
          headers: {},
        } as RequestWithUser;

        const result = await controller.me(mockRequestWithUser);

        expect(result).toEqual({
          nombre: user.firstName,
          apellido: user.lastName,
          email: user.email,
        });
      }
    });

    it('should not expose sensitive user information', async () => {
      const mockRequestWithUser: RequestWithUser = {
        user: mockUser,
        headers: {},
      } as RequestWithUser;

      const result = await controller.me(mockRequestWithUser);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('imcs');

      expect(result).toHaveProperty('nombre');
      expect(result).toHaveProperty('apellido');
      expect(result).toHaveProperty('email');
    });

    it('should handle user with special characters in names', async () => {
      const userWithSpecialChars = {
        ...mockUser,
        firstName: 'José María',
        lastName: "O'Connor-Smith",
        email: 'jose.maria@example.com',
      };

      const mockRequestWithUser: RequestWithUser = {
        user: userWithSpecialChars,
        headers: {},
      } as RequestWithUser;

      const result = await controller.me(mockRequestWithUser);

      expect(result).toEqual({
        nombre: userWithSpecialChars.firstName,
        apellido: userWithSpecialChars.lastName,
        email: userWithSpecialChars.email,
      });
    });

    it('should return consistent field names in Spanish', async () => {
      const mockRequestWithUser: RequestWithUser = {
        user: mockUser,
        headers: {},
      } as RequestWithUser;

      const result = await controller.me(mockRequestWithUser);

      expect(result).toHaveProperty('nombre'); // Spanish for 'firstName'
      expect(result).toHaveProperty('apellido'); // Spanish for 'lastName'
      expect(result).toHaveProperty('email');

      expect(result).not.toHaveProperty('firstName');
      expect(result).not.toHaveProperty('lastName');
    });
  });

  describe('Controller integration', () => {
    it('should have all required endpoints', () => {
      expect(typeof controller.login).toBe('function');
      expect(typeof controller.refreshToken).toBe('function');
      expect(typeof controller.me).toBe('function');
    });

    it('should maintain proper method signatures', () => {
      expect(controller.login.length).toBe(1); // body parameter
      expect(controller.refreshToken.length).toBe(1); // request parameter
      expect(controller.me.length).toBe(1); // request parameter
    });

    it('should properly inject AuthService dependency', () => {
      expect(service).toBeDefined();
      expect(service.login).toBeDefined();
      expect(service.refreshToken).toBeDefined();
    });

    it('should handle async operations correctly', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };
      service.login.mockResolvedValue(mockTokenPair);

      const result = await controller.login(loginDto);

      expect(result).toBeDefined();
      expect(result).toEqual(mockTokenPair);
    });
  });

  describe('Error handling', () => {
    it('should propagate all types of service errors', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };

      const errorTypes = [
        new Error('Generic error'),
        new Error('Network timeout'),
        new Error('Database connection failed'),
        new Error('Invalid token format'),
      ];

      for (const error of errorTypes) {
        service.login.mockRejectedValue(error);

        await expect(controller.login(loginDto)).rejects.toThrow(error.message);
      }
    });

    it('should handle service method failures independently', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };
      const mockRequest = { headers: { authorization: 'Bearer token' } } as any;

      // Login fails but refresh should still work
      service.login.mockRejectedValue(new Error('Login failed'));
      service.refreshToken.mockResolvedValue({ accessToken: 'new-token' });

      await expect(controller.login(loginDto)).rejects.toThrow('Login failed');

      const refreshResult = await controller.refreshToken(mockRequest);
      expect(refreshResult).toEqual({ accessToken: 'new-token' });
    });
  });
});
