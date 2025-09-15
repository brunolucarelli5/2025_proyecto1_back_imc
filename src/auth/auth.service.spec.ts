import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
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

    it('should handle different email formats', async () => {
      const email = 'complex.email+tag@domain.co.uk';
      const dto = { email, password: 'password' };
      const userWithEmail = { ...mockUser, email } as UserEntity;

      usersService.findByEmail.mockResolvedValue(userWithEmail);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      jwtService.generateToken.mockReturnValue('token');

      await service.login(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtService.generateToken).toHaveBeenCalledWith({ email });
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

  describe('tokens', () => {
    it('should call jwtService.refreshToken and return the result', async () => {
      const token = 'valid-refresh-token';
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      jwtService.refreshToken.mockReturnValue(expectedResult);

      const result = await service.tokens(token);

      expect(result).toEqual(expectedResult);
      expect(jwtService.refreshToken).toHaveBeenCalledWith(token);
    });

    it('should propagate JWT service errors', async () => {
      const token = 'invalid-token';
      const errorMessage = 'Token expired';

      jwtService.refreshToken.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(service.tokens(token)).rejects.toThrow(errorMessage);
      expect(jwtService.refreshToken).toHaveBeenCalledWith(token);
    });

    it('should handle different token formats', async () => {
      const tokens = [
        'simple-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'token-with-dashes-and_underscores',
      ];

      jwtService.refreshToken.mockReturnValue({ accessToken: 'new-token' });

      for (const token of tokens) {
        await service.tokens(token);
        expect(jwtService.refreshToken).toHaveBeenCalledWith(token);
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
