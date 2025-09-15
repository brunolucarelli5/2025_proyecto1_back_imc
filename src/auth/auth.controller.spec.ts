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
      tokens: jest.fn(),
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

    it('should handle complex email format', async () => {
      const loginDto = { ...validLoginDto, email: 'complex.email+tag@domain.co.uk' };
      service.login.mockResolvedValue(mockTokenPair);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockTokenPair);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Invalid credentials';
      service.login.mockRejectedValue(new Error(errorMessage));

      await expect(controller.login(validLoginDto)).rejects.toThrow(
        errorMessage,
      );
      expect(service.login).toHaveBeenCalledWith(validLoginDto);
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

  describe('tokens', () => {
    it('should refresh tokens successfully with valid token', async () => {
      const token = 'valid-refresh-token';
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      service.tokens.mockResolvedValue(expectedResult);

      const result = await controller.tokens(token);

      expect(result).toEqual(expectedResult);
      expect(service.tokens).toHaveBeenCalledWith(token);
    });

    it('should handle refresh token that returns only access token', async () => {
      const token = 'refresh-token-not-near-expiry';
      const expectedResult = {
        accessToken: 'new-access-token',
      };

      service.tokens.mockResolvedValue(expectedResult);

      const result = await controller.tokens(token);

      expect(result).toEqual(expectedResult);
      expect(service.tokens).toHaveBeenCalledWith(token);
    });


    it('should propagate service errors', async () => {
      const token = 'expired-token';
      const errorMessage = 'Token expired';

      service.tokens.mockRejectedValue(new Error(errorMessage));

      await expect(controller.tokens(token)).rejects.toThrow(errorMessage);
      expect(service.tokens).toHaveBeenCalledWith(token);
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
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });


    it('should not expose sensitive user information', async () => {
      const mockRequestWithUser: RequestWithUser = {
        user: mockUser,
        headers: {},
      } as RequestWithUser;

      const result = await controller.me(mockRequestWithUser);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('imcs');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('email');
    });

  });

  describe('Controller integration', () => {
    it('should have all required endpoints', () => {
      expect(typeof controller.login).toBe('function');
      expect(typeof controller.tokens).toBe('function');
      expect(typeof controller.me).toBe('function');
    });

    it('should maintain proper method signatures', () => {
      expect(controller.login.length).toBe(1); // body parameter
      expect(controller.tokens.length).toBe(1); // token parameter
      expect(controller.me.length).toBe(1); // request parameter
    });

    it('should properly inject AuthService dependency', () => {
      expect(service).toBeDefined();
      expect(service.login).toBeDefined();
      expect(service.tokens).toBeDefined();
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
    it('should propagate service errors', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      };

      service.login.mockRejectedValue(new Error('Generic error'));
      await expect(controller.login(loginDto)).rejects.toThrow('Generic error');
    });
  });
});
