import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../../users/users.service';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { UserEntity } from '../../users/entities/user.entity';
import { Payload } from '../interfaces/payload.interface';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: []
  } as unknown as UserEntity;

  const mockPayload: Payload = {
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  let mockRequest: Partial<RequestWithUser>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    const mockJwtService = {
      getPayload: jest.fn(),
    };

    const mockUsersService = {
      findByEmail: jest.fn(),
    };

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockRequest.headers = {};
    mockRequest.user = undefined;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and set user on request for valid token', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';
      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBe(mockUser);
      expect(jwtService.getPayload).toHaveBeenCalledWith('valid-token');
      expect(usersService.findByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      // No authorization header
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'No se envió el Header junto a la solicitud'
      );
    });

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      mockRequest.headers!.authorization = '';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when authorization header format is invalid', async () => {
      const invalidHeaders = [
        'Basic token',
        'Token bearer-token',
        'bearer valid-token',
        'BEARER valid-token',
        'Bearer',
        'Bearer ',
        'valid-token',
        'NotBearer valid-token',
      ];

      for (const header of invalidHeaders) {
        mockRequest.headers!.authorization = header;

        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      }
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      mockRequest.headers!.authorization = 'Bearer';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when JWT service throws error', async () => {
      mockRequest.headers!.authorization = 'Bearer invalid-token';
      jwtService.getPayload.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';
      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Usuario no encontrado.');

      expect(jwtService.getPayload).toHaveBeenCalledWith('valid-token');
      expect(usersService.findByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('should throw UnauthorizedException when UsersService throws error', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';
      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Database error');
    });

    it('should handle different valid Bearer token formats', async () => {
      const validTokens = [
        'simple-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'token-with-dashes',
        'token_with_underscores',
        'token.with.dots',
      ];

      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockResolvedValue(mockUser);

      for (const token of validTokens) {
        mockRequest.headers!.authorization = `Bearer ${token}`;

        const result = await guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(jwtService.getPayload).toHaveBeenCalledWith(token);
        expect(mockRequest.user).toBe(mockUser);

        jest.clearAllMocks();
        mockRequest.user = undefined;
      }
    });

    it('should handle different user scenarios', async () => {
      const userVariations = [
        { ...mockUser, email: 'user1@example.com', firstName: 'User1' } as unknown as UserEntity,
        { ...mockUser, email: 'user2@test.org', firstName: 'User2' } as unknown as UserEntity,
        { ...mockUser, email: 'complex.email+tag@domain.co.uk', firstName: 'User3' } as unknown as UserEntity,
      ];

      mockRequest.headers!.authorization = 'Bearer valid-token';

      for (const user of userVariations) {
        const payload = { ...mockPayload, email: user.email };

        jwtService.getPayload.mockReturnValue(payload);
        usersService.findByEmail.mockResolvedValue(user);

        const result = await guard.canActivate(mockExecutionContext);

        expect(result).toBe(true);
        expect(mockRequest.user).toBe(user);
        expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);

        jest.clearAllMocks();
        mockRequest.user = undefined;
      }
    });

    it('should properly extract token from authorization header', async () => {
      const testCases = [
        {
          header: 'Bearer simple-token',
          expectedToken: 'simple-token',
        },
        {
          header: 'Bearer token-with-special-chars-123_456.789',
          expectedToken: 'token-with-special-chars-123_456.789',
        },
        {
          header: 'Bearer   token-with-extra-spaces',
          expectedToken: '  token-with-extra-spaces', // Everything after first space
        },
      ];

      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockResolvedValue(mockUser);

      for (const { header, expectedToken } of testCases) {
        mockRequest.headers!.authorization = header;

        await guard.canActivate(mockExecutionContext);

        expect(jwtService.getPayload).toHaveBeenCalledWith(expectedToken);

        jest.clearAllMocks();
        mockRequest.user = undefined;
      }
    });
  });

  describe('Request mutation', () => {
    it('should properly attach user to request object', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';
      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockResolvedValue(mockUser);

      expect(mockRequest.user).toBeUndefined();

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user).toBe(mockUser);
      expect(mockRequest.user!.email).toBe(mockUser.email);
      expect(mockRequest.user!.firstName).toBe(mockUser.firstName);
      expect(mockRequest.user!.lastName).toBe(mockUser.lastName);
    });

    it('should not modify request when authentication fails', async () => {
      mockRequest.headers!.authorization = 'Bearer invalid-token';
      jwtService.getPayload.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(mockRequest.user).toBeUndefined();

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow();

      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle execution context errors', async () => {
      const faultyContext = {
        switchToHttp: jest.fn().mockImplementation(() => {
          throw new Error('Context error');
        }),
      } as any;

      await expect(guard.canActivate(faultyContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle malformed execution context', async () => {
      const malformedContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(null),
        }),
      } as any;

      await expect(guard.canActivate(malformedContext)).rejects.toThrow();
    });

    it('should wrap all errors in UnauthorizedException', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';

      // Test various error scenarios
      const errorScenarios = [
        {
          setup: () => jwtService.getPayload.mockImplementation(() => { throw new Error('JWT Error'); }),
          expectedMessage: 'JWT Error',
        },
        {
          setup: () => {
            jwtService.getPayload.mockReturnValue(mockPayload);
            usersService.findByEmail.mockRejectedValue(new Error('DB Error'));
          },
          expectedMessage: 'DB Error',
        },
        {
          setup: () => {
            jwtService.getPayload.mockReturnValue(mockPayload);
            usersService.findByEmail.mockImplementation(() => { throw new Error('Service Error'); });
          },
          expectedMessage: 'Service Error',
        },
      ];

      for (const { setup, expectedMessage } of errorScenarios) {
        setup();

        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(expectedMessage);

        jest.clearAllMocks();
      }
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Test that the guard doesn't leak sensitive information
      const sensitiveHeaders = [
        'Bearer expired-sensitive-token',
        'Bearer malformed-admin-token',
        'Bearer test-user-secret-key',
      ];

      jwtService.getPayload.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      for (const header of sensitiveHeaders) {
        mockRequest.headers!.authorization = header;

        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Token verification failed');
      }
    });

    it('should validate user existence for every request', async () => {
      mockRequest.headers!.authorization = 'Bearer valid-token';
      jwtService.getPayload.mockReturnValue(mockPayload);

      // First call - user exists
      usersService.findByEmail.mockResolvedValueOnce(mockUser);
      await guard.canActivate(mockExecutionContext);

      // Second call - user no longer exists (deleted)
      usersService.findByEmail.mockResolvedValueOnce(null);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Usuario no encontrado.');

      expect(usersService.findByEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle case sensitivity in Bearer scheme', async () => {
      const caseSensitiveTests = [
        'bearer valid-token', // lowercase
        'BEARER valid-token', // uppercase
        'Bearer valid-token', // correct case
        'bEaReR valid-token', // mixed case
      ];

      jwtService.getPayload.mockReturnValue(mockPayload);
      usersService.findByEmail.mockResolvedValue(mockUser);

      for (const header of caseSensitiveTests) {
        mockRequest.headers!.authorization = header;

        if (header.startsWith('Bearer ')) {
          const result = await guard.canActivate(mockExecutionContext);
          expect(result).toBe(true);
        } else {
          await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
            'Formato de Header inválido'
          );
        }

        jest.clearAllMocks();
        mockRequest.user = undefined;
      }
    });
  });
});