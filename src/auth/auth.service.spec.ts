import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { UsersService } from '../users/users.service';
import { LoginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockTokenPair = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  };

  beforeEach(async () => {
    const mockJwtService = {
      generateToken: jest.fn(),
      refreshToken: jest.fn(),
      getPayload: jest.fn(),
    };

    const mockUsersService = {
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
    usersService = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const validLoginDto: LoginDTO = {
      email: 'test@example.com',
      password: 'validPassword123',
    };

    it('should login successfully with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken
        .mockReturnValueOnce('access.token')
        .mockReturnValueOnce('refresh.token');

      const result = await service.login(validLoginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        'validPassword123',
        'hashedPassword123',
      );
      expect(jwtService.generateToken).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(jwtService.generateToken).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'refresh',
      );
      expect(result).toEqual({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto: LoginDTO = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'No se pudo loguear. Correo electrónico inválido.',
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'No se pudo loguear. Contraseña incorrecta.',
      );
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword123',
      );
    });

    it('should handle different email formats correctly', async () => {
      const emailTestCases = [
        'user@domain.com',
        'test.user+tag@subdomain.example.org',
        'simple@test.co',
        'complex.email123@multi-level.domain.info',
      ];

      for (const email of emailTestCases) {
        usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          email,
        } as any);
        (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
        jwtService.generateToken
          .mockReturnValueOnce('access')
          .mockReturnValueOnce('refresh');

        const result = await service.login({
          email,
          password: 'validPassword123',
        });

        expect(usersService.findByEmail).toHaveBeenCalledWith(email);
        expect(jwtService.generateToken).toHaveBeenCalledWith({ email });
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
      }
    });

    it('should handle boundary password cases', async () => {
      const passwordTestCases = [
        'a', // Single character
        'x'.repeat(1000), // Very long password
        '!@#$%^&*()_+', // Special characters only
        '123456789', // Numbers only
        'PassWord123!', // Mixed case with special chars
      ];

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jwtService.generateToken.mockReturnValue('token');

      for (const password of passwordTestCases) {
        (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

        const result = await service.login({
          email: 'test@example.com',
          password,
        });

        expect(bcrypt.compareSync).toHaveBeenCalledWith(
          password,
          'hashedPassword123',
        );
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
      }
    });
  });

  describe('tokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid.refresh.token';
      const expectedTokens = {
        accessToken: 'new.access',
        refreshToken: 'new.refresh',
      };

      jwtService.refreshToken.mockResolvedValue(expectedTokens);

      const result = await service.tokens(refreshToken);

      expect(jwtService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(expectedTokens);
    });

    it('should handle different token formats', async () => {
      const tokenTestCases = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'short.token.format',
        'very.long.token.with.multiple.segments.that.exceeds.normal.length',
      ];

      for (const token of tokenTestCases) {
        jwtService.refreshToken.mockResolvedValue({
          accessToken: 'new.access',
        });

        const result = await service.tokens(token);

        expect(jwtService.refreshToken).toHaveBeenCalledWith(token);
        expect(result).toHaveProperty('accessToken');
      }
    });

    it('should propagate JWT service errors', async () => {
      const invalidToken = 'invalid.token';
      jwtService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid token'),
      );

      await expect(service.tokens(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.refreshToken).toHaveBeenCalledWith(invalidToken);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete auth flow', async () => {
      // Login
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken
        .mockReturnValueOnce('access1')
        .mockReturnValueOnce('refresh1');

      const loginResult = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(loginResult).toEqual({
        accessToken: 'access1',
        refreshToken: 'refresh1',
      });

      // Token refresh
      jwtService.refreshToken.mockResolvedValue({
        accessToken: 'access2',
        refreshToken: 'refresh2',
      });

      const refreshResult = await service.tokens('refresh1');

      expect(refreshResult).toEqual({
        accessToken: 'access2',
        refreshToken: 'refresh2',
      });
    });

    it('should handle edge cases and error propagation', async () => {
      // Test user service errors
      usersService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Database error');

      // Test bcrypt comparison edge cases
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compareSync as jest.Mock).mockImplementation(() => {
        throw new Error('Bcrypt error');
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow('Bcrypt error');
    });
  });
});
