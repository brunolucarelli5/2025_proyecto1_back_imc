import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('JwtService', () => {
  let service: JwtService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfig = {
    'jwt.access.secret': 'accessSecret123',
    'jwt.access.expiresIn': '15m',
    'jwt.refresh.secret': 'refreshSecret456',
    'jwt.refresh.expiresIn': '7d',
  };

  const mockPayload = {
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(service).toBeDefined();
      expect(service.config).toEqual({
        access: {
          secret: 'accessSecret123',
          expiresIn: '15m',
        },
        refresh: {
          secret: 'refreshSecret456',
          expiresIn: '7d',
        },
      });
    });

    it('should throw error when JWT configuration is missing', async () => {
      const incompleteConfigs = [
        { 'jwt.access.secret': null },
        { 'jwt.access.expiresIn': null },
        { 'jwt.refresh.secret': null },
        { 'jwt.refresh.expiresIn': null },
        {}, // All missing
      ];

      for (const config of incompleteConfigs) {
        const mockIncompleteConfigService = {
          get: jest.fn((key: string) => config[key] || null),
        };

        await expect(
          Test.createTestingModule({
            providers: [
              JwtService,
              {
                provide: ConfigService,
                useValue: mockIncompleteConfigService,
              },
            ],
          }).compile()
        ).rejects.toThrow(InternalServerErrorException);
      }
    });
  });

  describe('generateToken', () => {
    const payload = { email: 'test@example.com' };

    it('should generate access token by default', () => {
      (jwt.sign as jest.Mock).mockReturnValue('generated.access.token');

      const result = service.generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'accessSecret123', { expiresIn: '15m' });
      expect(result).toBe('generated.access.token');
    });

    it('should generate refresh token when specified', () => {
      (jwt.sign as jest.Mock).mockReturnValue('generated.refresh.token');

      const result = service.generateToken(payload, 'refresh');

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'refreshSecret456', { expiresIn: '7d' });
      expect(result).toBe('generated.refresh.token');
    });

    it('should handle different payload structures', () => {
      const payloadTestCases = [
        { email: 'simple@test.com' },
        { email: 'complex.email+tag@subdomain.example.org' },
        { email: 'test@domain.co', userId: 123 },
        { email: 'user@test.com', role: 'admin', permissions: ['read', 'write'] },
      ];

      (jwt.sign as jest.Mock).mockReturnValue('token');

      payloadTestCases.forEach(testPayload => {
        service.generateToken(testPayload);
        expect(jwt.sign).toHaveBeenCalledWith(testPayload, 'accessSecret123', { expiresIn: '15m' });
      });
    });

    it('should handle both token types with boundary testing', () => {
      const tokenTypes: ('access' | 'refresh')[] = ['access', 'refresh'];
      (jwt.sign as jest.Mock).mockReturnValue('token');

      tokenTypes.forEach(type => {
        service.generateToken(payload, type);
        const expectedSecret = type === 'access' ? 'accessSecret123' : 'refreshSecret456';
        const expectedExpiry = type === 'access' ? '15m' : '7d';

        expect(jwt.sign).toHaveBeenCalledWith(payload, expectedSecret, { expiresIn: expectedExpiry });
      });
    });
  });

  describe('refreshToken', () => {
    const validRefreshToken = 'valid.refresh.token';

    it('should generate new access token when refresh token is valid and not expiring soon', () => {
      const payload = {
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (jwt.sign as jest.Mock).mockReturnValue('new.access.token');

      const result = service.refreshToken(validRefreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(validRefreshToken, 'refreshSecret456');
      expect(jwt.sign).toHaveBeenCalledWith({ email: 'test@example.com' }, 'accessSecret123', { expiresIn: '15m' });
      expect(result).toEqual({
        accessToken: 'new.access.token',
      });
    });

    it('should generate both tokens when refresh token is expiring soon', () => {
      const payload = {
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now (less than 20 min threshold)
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (jwt.sign as jest.Mock).mockReturnValueOnce('new.access.token').mockReturnValueOnce('new.refresh.token');

      const result = service.refreshToken(validRefreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(validRefreshToken, 'refreshSecret456');
      expect(jwt.sign).toHaveBeenCalledWith({ email: 'test@example.com' }, 'accessSecret123', { expiresIn: '15m' });
      expect(jwt.sign).toHaveBeenCalledWith({ email: 'test@example.com' }, 'refreshSecret456', { expiresIn: '7d' });
      expect(result).toEqual({
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      });
    });

    it('should test boundary conditions for token expiration', () => {
      const boundaryTestCases = [
        { exp: Math.floor(Date.now() / 1000) + 1200, expectRefresh: false }, // 20 minutes (exactly at boundary)
        { exp: Math.floor(Date.now() / 1000) + 1199, expectRefresh: true },  // 19.98 minutes (under boundary)
        { exp: Math.floor(Date.now() / 1000) + 60, expectRefresh: true },    // 1 minute
        { exp: Math.floor(Date.now() / 1000) + 1800, expectRefresh: false }, // 30 minutes
      ];

      boundaryTestCases.forEach(({ exp, expectRefresh }) => {
        const payload = { email: 'test@example.com', exp };
        (jwt.verify as jest.Mock).mockReturnValue(payload);
        (jwt.sign as jest.Mock).mockReturnValue('token');

        const result = service.refreshToken(validRefreshToken);

        if (expectRefresh) {
          expect(result).toHaveProperty('refreshToken');
        } else {
          expect(result).not.toHaveProperty('refreshToken');
        }
        expect(result).toHaveProperty('accessToken');
      });
    });

    it('should throw UnauthorizedException when token is missing expiration', () => {
      const payloadWithoutExp = { email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(payloadWithoutExp);

      expect(() => service.refreshToken(validRefreshToken)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', () => {
      const invalidTokens = [
        'invalid.token.format',
        'expired.token.here',
        'malformed.jwt.token',
        '',
        'a'.repeat(1000), // Very long invalid token
      ];

      invalidTokens.forEach(token => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
          throw new Error('Token verification failed');
        });

        expect(() => service.refreshToken(token)).toThrow(UnauthorizedException);
      });
    });
  });

  describe('getPayload', () => {
    const validToken = 'valid.jwt.token';

    it('should return payload for valid access token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = service.getPayload(validToken);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, 'accessSecret123');
      expect(result).toEqual(mockPayload);
    });

    it('should return payload for valid refresh token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = service.getPayload(validToken, 'refresh');

      expect(jwt.verify).toHaveBeenCalledWith(validToken, 'refreshSecret456');
      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when payload is string', () => {
      (jwt.verify as jest.Mock).mockReturnValue('string-payload');

      expect(() => service.getPayload(validToken)).toThrow(UnauthorizedException);
      expect(() => service.getPayload(validToken)).toThrow('Token inválido: no tiene el formato esperado (objeto JwtPayload con email).');
    });

    it('should throw UnauthorizedException when payload lacks email', () => {
      const payloadsWithoutEmail = [
        { userId: 123 },
        { username: 'test' },
        { sub: 'subject' },
        {},
      ];

      payloadsWithoutEmail.forEach(payload => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);

        expect(() => service.getPayload(validToken)).toThrow(UnauthorizedException);
        expect(() => service.getPayload(validToken)).toThrow('Token inválido: no tiene el formato esperado (objeto JwtPayload con email).');
      });
    });

    it('should handle different token types correctly', () => {
      const tokenTypes: ('access' | 'refresh')[] = ['access', 'refresh'];
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      tokenTypes.forEach(type => {
        const result = service.getPayload(validToken, type);
        const expectedSecret = type === 'access' ? 'accessSecret123' : 'refreshSecret456';

        expect(jwt.verify).toHaveBeenCalledWith(validToken, expectedSecret);
        expect(result).toEqual(mockPayload);
      });
    });
  });
});