import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { Payload } from '../interfaces/payload.interface';
import * as jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

const mockSign = jest.fn();
const mockVerify = jest.fn();

describe('JwtService', () => {
  let service: JwtService;

  beforeAll(() => {
    (jwt.sign as jest.Mock) = mockSign;
    (jwt.verify as jest.Mock) = mockVerify;
  });

  const mockPayload: Payload = {
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSign.mockReset();
    mockVerify.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('config', () => {
    it('should have correct configuration values', () => {
      expect(service.config).toBeDefined();
      expect(service.config.access).toBeDefined();
      expect(service.config.refresh).toBeDefined();

      expect(service.config.access.secret).toBe('accessSecret');
      expect(service.config.access.expiresIn).toBe('15m');

      expect(service.config.refresh.secret).toBe('refreshSecret');
      expect(service.config.refresh.expiresIn).toBe('1d');
    });
  });

  describe('generateToken', () => {
    it('should generate access token by default', () => {
      const mockToken = 'mock-access-token';
      mockSign.mockReturnValue(mockToken);

      const result = service.generateToken({ email: 'test@example.com' });

      expect(result).toBe(mockToken);
      expect(mockSign).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'accessSecret',
        { expiresIn: '15m' }
      );
    });

    it('should generate access token when explicitly specified', () => {
      const mockToken = 'mock-access-token';
      mockSign.mockReturnValue(mockToken);

      const result = service.generateToken({ email: 'test@example.com' }, 'access');

      expect(result).toBe(mockToken);
      expect(mockSign).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'accessSecret',
        { expiresIn: '15m' }
      );
    });

    it('should generate refresh token when specified', () => {
      const mockToken = 'mock-refresh-token';
      mockSign.mockReturnValue(mockToken);

      const result = service.generateToken({ email: 'test@example.com' }, 'refresh');

      expect(result).toBe(mockToken);
      expect(mockSign).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'refreshSecret',
        { expiresIn: '1d' }
      );
    });

    it('should handle different payload structures', () => {
      const payloads = [
        { email: 'user1@example.com' },
        { email: 'user2@test.org' },
        { email: 'complex.email+tag@domain-name.co.uk' }
      ];

      mockSign.mockReturnValue('mock-token');

      payloads.forEach(payload => {
        service.generateToken(payload);
        expect(mockSign).toHaveBeenCalledWith(
          payload,
          'accessSecret',
          { expiresIn: '15m' }
        );
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid and not near expiry', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
      const validPayload = { email: 'test@example.com', exp: futureExp };

      mockVerify.mockReturnValue(validPayload);
      mockSign.mockReturnValue('new-access-token');

      const result = service.refreshToken('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(mockVerify).toHaveBeenCalledWith('valid-refresh-token', 'refreshSecret');
      expect(mockSign).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'accessSecret',
        { expiresIn: '15m' }
      );
    });

    it('should return new access and refresh tokens when refresh token is near expiry', () => {
      // Token expires in 10 minutes (less than 20 minute threshold)
      const nearExpiry = Math.floor(Date.now() / 1000) + 600;
      const validPayload = { email: 'test@example.com', exp: nearExpiry };

      mockVerify.mockReturnValue(validPayload);
      mockSign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = service.refreshToken('expiring-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
      expect(mockVerify).toHaveBeenCalledWith('expiring-refresh-token', 'refreshSecret');
      expect(mockSign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when token has no exp', () => {
      const invalidPayload = { email: 'test@example.com' }; // No exp field
      mockVerify.mockReturnValue(invalidPayload);

      expect(() => service.refreshToken('token-without-exp')).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      expect(() => service.refreshToken('invalid-token')).toThrow(UnauthorizedException);
    });

    it('should handle edge case where token expires exactly at threshold', () => {
      // Token expires in exactly 20 minutes (at the threshold)
      const exactThreshold = Math.floor(Date.now() / 1000) + 1200;
      const validPayload = { email: 'test@example.com', exp: exactThreshold };

      mockVerify.mockReturnValue(validPayload);
      mockSign.mockReturnValue('new-access-token');

      const result = service.refreshToken('threshold-token');

      // Should only return access token (not refresh) since it's not < 20 minutes
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should handle different email formats in payload', () => {
      const emails = [
        'simple@test.com',
        'complex.email+tag@domain.co.uk',
        'user123@example.org'
      ];

      emails.forEach(email => {
        const futureExp = Math.floor(Date.now() / 1000) + 1800;
        const payload = { email, exp: futureExp };

        mockVerify.mockReturnValue(payload);
        mockSign.mockReturnValue('token');

        const result = service.refreshToken('token');

        expect(result.accessToken).toBe('token');
        expect(mockSign).toHaveBeenCalledWith({ email }, 'accessSecret', { expiresIn: '15m' });
      });
    });
  });

  describe('getPayload', () => {
    it('should return payload for valid access token', () => {
      mockVerify.mockReturnValue(mockPayload);

      const result = service.getPayload('valid-access-token');

      expect(result).toEqual(mockPayload);
      expect(mockVerify).toHaveBeenCalledWith('valid-access-token', 'accessSecret');
    });

    it('should return payload for valid refresh token when specified', () => {
      mockVerify.mockReturnValue(mockPayload);

      const result = service.getPayload('valid-refresh-token', 'refresh');

      expect(result).toEqual(mockPayload);
      expect(mockVerify).toHaveBeenCalledWith('valid-refresh-token', 'refreshSecret');
    });

    it('should throw UnauthorizedException when token returns string', () => {
      mockVerify.mockReturnValue('string-token');

      expect(() => service.getPayload('string-token')).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token lacks email field', () => {
      const payloadWithoutEmail = { exp: 1234567890, iat: 1234567890 };
      mockVerify.mockReturnValue(payloadWithoutEmail);

      expect(() => service.getPayload('token-without-email')).toThrow(UnauthorizedException);
    });

    it('should handle token verification errors', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => service.getPayload('expired-token')).toThrow();
    });

    it('should validate payload structure correctly', () => {
      const validPayloads = [
        { email: 'test@example.com', exp: 1234567890, iat: 1234567890 },
        { email: 'user@test.org', exp: 1234567890 },
        { email: 'complex.email+tag@domain.co.uk', exp: 1234567890, iat: 1234567890, custom: 'field' }
      ];

      validPayloads.forEach(payload => {
        mockVerify.mockReturnValue(payload);
        const result = service.getPayload('token');
        expect(result).toEqual(payload);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle various jwt verification errors', () => {
      const jwtErrors = [
        new Error('TokenExpiredError'),
        new Error('JsonWebTokenError'),
        new Error('NotBeforeError'),
        new Error('Invalid signature')
      ];

      jwtErrors.forEach(error => {
        mockVerify.mockImplementation(() => {
          throw error;
        });

        expect(() => service.getPayload('invalid-token')).toThrow();
      });
    });

    it('should handle null and undefined tokens gracefully', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Token required');
      });

      expect(() => service.refreshToken(null as any)).toThrow();
      expect(() => service.refreshToken(undefined as any)).toThrow();
      expect(() => service.getPayload(null as any)).toThrow();
      expect(() => service.getPayload(undefined as any)).toThrow();
    });

    it('should maintain consistent behavior across token types', () => {
      const payload = { email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + 1000 };

      mockVerify.mockReturnValue(payload);

      // Test both access and refresh token handling
      const accessResult = service.getPayload('token', 'access');
      const refreshResult = service.getPayload('token', 'refresh');

      expect(accessResult).toEqual(payload);
      expect(refreshResult).toEqual(payload);
    });
  });

  describe('Security considerations', () => {
    it('should use different secrets for access and refresh tokens', () => {
      expect(service.config.access.secret).not.toBe(service.config.refresh.secret);
      expect(service.config.access.secret).toBe('accessSecret');
      expect(service.config.refresh.secret).toBe('refreshSecret');
    });

    it('should have appropriate token expiration times', () => {
      expect(service.config.access.expiresIn).toBe('15m'); // Short-lived
      expect(service.config.refresh.expiresIn).toBe('1d'); // Long-lived
    });

    it('should properly validate token structure before processing', () => {
      const maliciousPayloads = [
        null,
        undefined,
        'string',
        123,
        [],
        {},
        { notEmail: 'test' },
        { email: null },
        { email: '' }
      ];

      maliciousPayloads.forEach(payload => {
        mockVerify.mockReturnValue(payload);

        if (typeof payload === 'string' || !payload || !(payload as any).email) {
          expect(() => service.getPayload('token')).toThrow(UnauthorizedException);
        }
      });
    });
  });
});