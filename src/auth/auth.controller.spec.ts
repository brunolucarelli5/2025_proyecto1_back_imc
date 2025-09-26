import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { RequestWithUser } from './interfaces/request-with-user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockTokenPair: TokenPairDTO = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockRequest = {
    user: mockUser,
  } as RequestWithUser;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      tokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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
    it('should login successfully with valid credentials and log message', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'validPassword123',
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.login.mockResolvedValue(mockTokenPair);

      const result = await controller.login(loginDto);

      expect(consoleSpy).toHaveBeenCalledWith('Logueando al usuario test@example.com');
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockTokenPair);

      consoleSpy.mockRestore();
    });

    it('should handle different email formats in login', async () => {
      const emailTestCases = [
        'simple@test.com',
        'complex.email+tag@subdomain.example.org',
        'user123@domain.co.uk',
        'test.user@multi-level.domain.info',
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.login.mockResolvedValue(mockTokenPair);

      for (const email of emailTestCases) {
        const loginDto: LoginDTO = { email, password: 'password123' };

        const result = await controller.login(loginDto);

        expect(consoleSpy).toHaveBeenCalledWith(`Logueando al usuario ${email}`);
        expect(service.login).toHaveBeenCalledWith(loginDto);
        expect(result).toEqual(mockTokenPair);
      }

      consoleSpy.mockRestore();
    });

    it('should propagate authentication errors from service', async () => {
      const loginDto: LoginDTO = {
        email: 'invalid@example.com',
        password: 'wrongPassword',
      };

      service.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle boundary password cases in login', async () => {
      const passwordTestCases = [
        { password: 'a', description: 'single character' },
        { password: 'x'.repeat(1000), description: 'very long password' },
        { password: '!@#$%^&*()', description: 'special characters only' },
        { password: '12345678', description: 'numbers only' },
        { password: 'MixedCase123!', description: 'complex password' },
      ];

      service.login.mockResolvedValue(mockTokenPair);

      for (const testCase of passwordTestCases) {
        const loginDto: LoginDTO = {
          email: 'test@example.com',
          password: testCase.password,
        };

        const result = await controller.login(loginDto);

        expect(service.login).toHaveBeenCalledWith(loginDto);
        expect(result).toEqual(mockTokenPair);
      }
    });
  });

  describe('tokens', () => {
    it('should refresh tokens successfully and log message', async () => {
      const refreshToken = 'valid.refresh.token';
      const expectedTokens = { accessToken: 'new.access.token' };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.tokens.mockResolvedValue(expectedTokens);

      const result = await controller.tokens(refreshToken);

      expect(consoleSpy).toHaveBeenCalledWith('Generando nuevos tokens');
      expect(service.tokens).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(expectedTokens);

      consoleSpy.mockRestore();
    });

    it('should handle different token formats', async () => {
      const tokenTestCases = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'short.token',
        'medium.length.token.format',
        'very.long.token.with.multiple.segments.and.extended.payload.information',
      ];

      service.tokens.mockResolvedValue({ accessToken: 'new.token' });

      for (const token of tokenTestCases) {
        const result = await controller.tokens(token);

        expect(service.tokens).toHaveBeenCalledWith(token);
        expect(result).toHaveProperty('accessToken');
      }
    });

    it('should propagate token refresh errors from service', async () => {
      const invalidToken = 'invalid.refresh.token';
      service.tokens.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.tokens(invalidToken)).rejects.toThrow(UnauthorizedException);
      expect(service.tokens).toHaveBeenCalledWith(invalidToken);
    });

    it('should handle token refresh boundary cases', async () => {
      const boundaryTestCases = [
        { token: '', expectedCall: true },
        { token: 'a', expectedCall: true },
        { token: 'x'.repeat(10000), expectedCall: true }, // Very long token
      ];

      service.tokens.mockResolvedValue({ accessToken: 'token' });

      for (const testCase of boundaryTestCases) {
        if (testCase.expectedCall) {
          const result = await controller.tokens(testCase.token);
          expect(service.tokens).toHaveBeenCalledWith(testCase.token);
          expect(result).toHaveProperty('accessToken');
        }
      }
    });
  });

  describe('me', () => {
    it('should return current user information', async () => {
      const result = controller.me(mockRequest);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should handle different user data structures', async () => {
      const userTestCases = [
        {
          id: 1,
          email: 'simple@test.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: 999,
          email: 'complex.email+tag@subdomain.example.org',
          firstName: 'María José',
          lastName: 'García-López',
        },
        {
          id: 42,
          email: 'test@domain.co',
          firstName: 'A',
          lastName: 'B',
        },
      ];

      for (const user of userTestCases) {
        const request = { user } as RequestWithUser;
        const result = controller.me(request);

        expect(result).toEqual({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      }
    });

    it('should handle boundary user ID values', async () => {
      const idTestCases = [1, 999999, 0, -1];

      for (const id of idTestCases) {
        const request = {
          user: { ...mockUser, id },
        } as RequestWithUser;

        const result = controller.me(request);

        expect(result.id).toBe(id);
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('firstName');
        expect(result).toHaveProperty('lastName');
      }
    });

    it('should maintain consistent response structure', async () => {
      const result = controller.me(mockRequest);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(Object.keys(result)).toHaveLength(4);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      // Login
      const loginDto: LoginDTO = { email: 'test@example.com', password: 'password123' };
      service.login.mockResolvedValue(mockTokenPair);

      const loginResult = await controller.login(loginDto);
      expect(loginResult).toEqual(mockTokenPair);

      // Token refresh
      service.tokens.mockResolvedValue({ accessToken: 'new.access', refreshToken: 'new.refresh' });

      const refreshResult = await controller.tokens(mockTokenPair.refreshToken);
      expect(refreshResult).toHaveProperty('accessToken');

      // Get user info
      const userResult = controller.me(mockRequest);
      expect(userResult).toHaveProperty('email');
    });

    it('should handle error propagation correctly', async () => {
      const errorTestCases = [
        { method: 'login', error: new UnauthorizedException('Login failed') },
        { method: 'tokens', error: new UnauthorizedException('Token refresh failed') },
      ];

      for (const testCase of errorTestCases) {
        if (testCase.method === 'login') {
          service.login.mockRejectedValue(testCase.error);
          await expect(controller.login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(testCase.error);
        } else if (testCase.method === 'tokens') {
          service.tokens.mockRejectedValue(testCase.error);
          await expect(controller.tokens('token')).rejects.toThrow(testCase.error);
        }
      }
    });
  });
});