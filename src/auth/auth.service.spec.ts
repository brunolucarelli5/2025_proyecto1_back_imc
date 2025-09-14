import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt/jwt.service';
import { LoginDTO } from './dto/login.dto';
import { UserEntity } from '../users/entities/user.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: UserEntity = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: [],
    // BaseEntity methods
    hasId: jest.fn().mockReturnValue(true),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  } as unknown as UserEntity;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      generateToken: jest.fn().mockReturnValue('token'),
      refreshToken: jest.fn().mockReturnValue({ accessToken: 'token' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;

    jest.clearAllMocks();
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
      password: 'plainPassword',
    };

    it('should login successfully with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(validLoginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        validLoginDto.email,
      );
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        validLoginDto.password,
        mockUser.password,
      );
      expect(jwtService.generateToken).toHaveBeenCalledTimes(2);
      expect(jwtService.generateToken).toHaveBeenNthCalledWith(1, {
        email: mockUser.email,
      });
      expect(jwtService.generateToken).toHaveBeenNthCalledWith(
        2,
        { email: mockUser.email },
        'refresh',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validLoginDto)).rejects.toThrow(
        'No se pudo loguear. Correo electrónico inválido.',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        validLoginDto.email,
      );
      expect(bcrypt.compareSync).not.toHaveBeenCalled();
      expect(jwtService.generateToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validLoginDto)).rejects.toThrow(
        'No se pudo loguear. Contraseña incorrecta.',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        validLoginDto.email,
      );
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        validLoginDto.password,
        mockUser.password,
      );
      expect(jwtService.generateToken).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive email lookup', async () => {
      const uppercaseEmailDto = {
        email: 'TEST@EXAMPLE.COM',
        password: 'plainPassword',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(uppercaseEmailDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(
        uppercaseEmailDto.email,
      );
    });

    it('should handle different email formats', async () => {
      const emailVariations = [
        'user@test.com',
        'complex.email+tag@domain.co.uk',
        'user123@example.org',
      ];

      for (const email of emailVariations) {
        const dto = { email, password: 'password' };
        const userWithEmail = { ...mockUser, email } as UserEntity;

        usersService.findByEmail.mockResolvedValue(userWithEmail);
        (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
        jwtService.generateToken.mockReturnValue('token');

        await service.login(dto);

        expect(usersService.findByEmail).toHaveBeenCalledWith(email);
        expect(jwtService.generateToken).toHaveBeenCalledWith({ email });
      }
    });

    it('should handle various password formats', async () => {
      const passwords = [
        'simplepass',
        'Complex123!',
        'pássword',
        'パスワード',
        'пароль123',
      ];

      usersService.findByEmail.mockResolvedValue(mockUser);
      jwtService.generateToken.mockReturnValue('token');

      for (const password of passwords) {
        const dto = { email: validLoginDto.email, password };

        (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
        await service.login(dto);

        expect(bcrypt.compareSync).toHaveBeenCalledWith(
          password,
          mockUser.password,
        );
      }
    });

    it('should propagate UsersService errors', async () => {
      const errorMessage = 'Database connection error';
      usersService.findByEmail.mockRejectedValue(new Error(errorMessage));

      await expect(service.login(validLoginDto)).rejects.toThrow(errorMessage);
    });

    it('should handle JWT service errors', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      await expect(service.login(validLoginDto)).rejects.toThrow(
        'JWT generation failed',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully with valid Bearer header', async () => {
      const authHeader = 'Bearer valid-refresh-token';
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      jwtService.refreshToken.mockReturnValue(expectedResult);

      const result = await service.refreshToken(authHeader);

      expect(result).toEqual(expectedResult);
      expect(jwtService.refreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });

    it('should throw BadRequestException when authHeader is undefined', async () => {
      await expect(service.refreshToken(undefined)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refreshToken(undefined)).rejects.toThrow(
        'El header Authorization es obligatorio, y en este caso tener el formato Bearer [refresh-token].',
      );
    });

    it('should throw BadRequestException when authHeader is null', async () => {
      await expect(service.refreshToken(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refreshToken(null as any)).rejects.toThrow(
        'El header Authorization es obligatorio, y en este caso tener el formato Bearer [refresh-token].',
      );
    });

    it('should throw BadRequestException when authHeader does not start with Bearer', async () => {
      const invalidHeaders = [
        'Basic token',
        'Token refresh-token',
        'refresh-token',
        'Bearer',
        'bearer refresh-token',
        'BEARER refresh-token',
      ];

      for (const header of invalidHeaders) {
        await expect(service.refreshToken(header)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.refreshToken(header)).rejects.toThrow(
          'El header Authorization es obligatorio, y en este caso tener el formato Bearer [refresh-token].',
        );
      }
    });

    it('should handle Bearer header with empty token', async () => {
      const authHeader = 'Bearer ';

      jwtService.refreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(authHeader)).rejects.toThrow(
        'Invalid token',
      );
      expect(jwtService.refreshToken).toHaveBeenCalledWith('');
    });

    it('should handle Bearer header with multiple spaces', async () => {
      const authHeader = 'Bearer   token-with-spaces';

      jwtService.refreshToken.mockReturnValue({
        accessToken: 'new-access-token',
      });

      const result = await service.refreshToken(authHeader);

      expect(result.accessToken).toBe('new-access-token');
      expect(jwtService.refreshToken).toHaveBeenCalledWith(
        '  token-with-spaces',
      );
    });

    it('should extract token correctly from various Bearer formats', async () => {
      const testCases = [
        {
          header: 'Bearer simple-token',
          expectedToken: 'simple-token',
        },
        {
          header:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          expectedToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
        {
          header: 'Bearer token-with-dashes-and_underscores',
          expectedToken: 'token-with-dashes-and_underscores',
        },
      ];

      jwtService.refreshToken.mockReturnValue({ accessToken: 'new-token' });

      for (const { header, expectedToken } of testCases) {
        await service.refreshToken(header);
        expect(jwtService.refreshToken).toHaveBeenCalledWith(expectedToken);
      }
    });

    it('should propagate JWT service errors', async () => {
      const authHeader = 'Bearer invalid-token';
      const errorMessage = 'Token expired';

      jwtService.refreshToken.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(service.refreshToken(authHeader)).rejects.toThrow(
        errorMessage,
      );
      expect(jwtService.refreshToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle edge cases with whitespace', async () => {
      const authHeaders = [
        ' Bearer token',
        'Bearer token ',
        ' Bearer token ',
        '\tBearer token',
        'Bearer\ttoken',
      ];

      // Only exact 'Bearer ' prefix should work
      const validHeaders = authHeaders.filter((h) => h.startsWith('Bearer '));
      const invalidHeaders = authHeaders.filter(
        (h) => !h.startsWith('Bearer '),
      );

      jwtService.refreshToken.mockReturnValue({ accessToken: 'token' });

      for (const header of validHeaders) {
        await service.refreshToken(header);
        // Should extract everything after 'Bearer '
        const expectedToken = header.split(' ')[1];
        expect(jwtService.refreshToken).toHaveBeenCalledWith(expectedToken);
      }

      for (const header of invalidHeaders) {
        await expect(service.refreshToken(header)).rejects.toThrow(
          BadRequestException,
        );
      }
    });
  });

  describe('Integration and edge cases', () => {
    it('should maintain security during login flow', async () => {
      const sensitiveLoginDto: LoginDTO = {
        email: 'admin@sensitive.com',
        password: 'SuperSecretPassword123!',
      };

      const sensitiveUser = {
        ...mockUser,
        email: sensitiveLoginDto.email,
        password: 'hashedSuperSecretPassword',
      } as UserEntity;

      usersService.findByEmail.mockResolvedValue(sensitiveUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken
        .mockReturnValueOnce('secure-access-token')
        .mockReturnValueOnce('secure-refresh-token');

      const result = await service.login(sensitiveLoginDto);

      expect(result.accessToken).toBe('secure-access-token');
      expect(result.refreshToken).toBe('secure-refresh-token');

      // Verify password was compared, not stored in plain text
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        sensitiveLoginDto.password,
        sensitiveUser.password,
      );
    });

    it('should handle concurrent login attempts', async () => {
      const loginAttempts = [
        { email: 'user1@test.com', password: 'pass1' },
        { email: 'user2@test.com', password: 'pass2' },
        { email: 'user3@test.com', password: 'pass3' },
      ];

      // Mock users
      loginAttempts.forEach((attempt, index) => {
        const user = { ...mockUser, id: index + 1, email: attempt.email } as UserEntity;
        usersService.findByEmail.mockImplementation(async (email) =>
          email === attempt.email ? user : null,
        );
      });

      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken.mockReturnValue('token');

      const loginPromises = loginAttempts.map((attempt) =>
        service.login(attempt),
      );
      const results = await Promise.all(loginPromises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });
    });

    it('should handle malformed but valid Bearer headers', async () => {
      const edgeCaseHeaders = [
        'Bearer a',
        'Bearer 1',
        'Bearer ',
        'Bearer token.with.dots',
        'Bearer token with spaces',
      ];

      jwtService.refreshToken.mockReturnValue({ accessToken: 'token' });

      for (const header of edgeCaseHeaders) {
        const expectedToken = header.split(' ')[1];
        await service.refreshToken(header);
        expect(jwtService.refreshToken).toHaveBeenCalledWith(expectedToken);
      }
    });
  });

  describe('Error propagation and logging', () => {
    it('should properly propagate all error types from dependencies', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };

      // Test UsersService errors
      usersService.findByEmail.mockRejectedValue(new Error('DB Error'));
      await expect(service.login(loginDto)).rejects.toThrow('DB Error');

      // Test bcrypt errors (simulated)
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockImplementation(() => {
        throw new Error('Bcrypt error');
      });
      await expect(service.login(loginDto)).rejects.toThrow('Bcrypt error');

      // Test JWT errors
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken.mockImplementation(() => {
        throw new Error('JWT Error');
      });
      await expect(service.login(loginDto)).rejects.toThrow('JWT Error');
    });
  });
});
