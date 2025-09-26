import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { RefreshToken } from './refresh-token.decorator';

describe('RefreshToken Decorator', () => {
  let mockContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to execute the decorator
  const executeDecorator = (context: ExecutionContext) => {
    // The decorator is created with createParamDecorator which returns a function
    // We need to simulate how NestJS would call it
    return RefreshToken(undefined, context);
  };

  describe('valid token extraction', () => {
    it('should extract token from valid Bearer authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      mockRequest.headers['authorization'] = `Bearer ${token}`;

      const result = executeDecorator(mockContext);

      expect(result).toBe(token);
    });

    it('should handle different token formats and lengths', () => {
      const tokenTestCases = [
        'short.token',
        'medium.length.token.format',
        'very.long.token.with.multiple.segments.and.complex.payload.data.that.exceeds.normal.jwt.length',
        'a', // Single character token
        'token.with.special.chars-_+=/',
      ];

      tokenTestCases.forEach(token => {
        mockRequest.headers['authorization'] = `Bearer ${token}`;

        const result = executeDecorator(mockContext);

        expect(result).toBe(token);
      });
    });
  });

  describe('boundary value testing for authorization header', () => {
    it('should handle edge cases in authorization header format', () => {
      const token = 'test.token';
      const boundaryTestCases = [
        { header: `Bearer ${token}`, expected: token, description: 'standard format' },
        { header: `Bearer  ${token}`, expected: token, description: 'extra space after Bearer' },
      ];

      boundaryTestCases.forEach(testCase => {
        mockRequest.headers['authorization'] = testCase.header;

        const result = executeDecorator(mockContext);

        expect(result).toBe(testCase.expected);
      });
    });

    it('should handle minimum and maximum length tokens', () => {
      const lengthTestCases = [
        { token: 'a', description: 'minimum single character' },
        { token: 'ab', description: 'two characters' },
        { token: 'x'.repeat(100), description: 'medium length' },
        { token: 'y'.repeat(1000), description: 'maximum practical length' },
      ];

      lengthTestCases.forEach(testCase => {
        mockRequest.headers['authorization'] = `Bearer ${testCase.token}`;

        const result = executeDecorator(mockContext);

        expect(result).toBe(testCase.token);
      });
    });
  });

  describe('error cases and invalid formats', () => {
    it('should throw BadRequestException when authorization header is missing', () => {
      mockRequest.headers = {}; // No authorization header

      expect(() => executeDecorator(mockContext)).toThrow(BadRequestException);
      expect(() => executeDecorator(mockContext)).toThrow('El header Authorization debe tener el formato Bearer [token]');
    });

    it('should throw BadRequestException when authorization header is null or undefined', () => {
      const invalidHeaders = [null, undefined];

      invalidHeaders.forEach(header => {
        mockRequest.headers['authorization'] = header;

        expect(() => executeDecorator(mockContext)).toThrow(BadRequestException);
        expect(() => executeDecorator(mockContext)).toThrow('El header Authorization debe tener el formato Bearer [token]');
      });
    });

    it('should throw BadRequestException when header does not start with Bearer', () => {
      const invalidFormats = [
        'Basic token123',
        'Token token123',
        'bearer token123', // lowercase
        'BEARER token123', // uppercase
        'token123', // No prefix
        'Bearertoken123', // No space
      ];

      invalidFormats.forEach(header => {
        mockRequest.headers['authorization'] = header;

        expect(() => executeDecorator(mockContext)).toThrow(BadRequestException);
        expect(() => executeDecorator(mockContext)).toThrow('El header Authorization debe tener el formato Bearer [token]');
      });
    });

    it('should throw BadRequestException when Bearer prefix exists but token is missing', () => {
      const incompleteHeaders = [
        'Bearer',
        'Bearer ',
        'Bearer  ', // Multiple spaces but no token
      ];

      incompleteHeaders.forEach(header => {
        mockRequest.headers['authorization'] = header;

        expect(() => executeDecorator(mockContext)).toThrow(BadRequestException);
        expect(() => executeDecorator(mockContext)).toThrow('El header Authorization debe tener el formato Bearer [token]');
      });
    });

    it('should handle empty string authorization header', () => {
      mockRequest.headers['authorization'] = '';

      expect(() => executeDecorator(mockContext)).toThrow(BadRequestException);
      expect(() => executeDecorator(mockContext)).toThrow('El header Authorization debe tener el formato Bearer [token]');
    });
  });

  describe('equivalence partitioning', () => {
    it('should categorize valid authorization headers', () => {
      // Valid equivalence class: Properly formatted Bearer tokens
      const validTokens = [
        'standard.jwt.token',
        'short',
        'very.long.token.with.multiple.segments',
        'token-with-dashes',
        'token_with_underscores',
        'token.with.dots',
        'tokenWithNumbers123',
        'TOKEN.WITH.CAPS',
      ];

      validTokens.forEach(token => {
        mockRequest.headers['authorization'] = `Bearer ${token}`;

        const result = executeDecorator(mockContext);

        expect(result).toBe(token);
      });
    });

    it('should categorize invalid authorization headers', () => {
      // Invalid equivalence class: Malformed headers
      const invalidHeaders = [
        null,
        undefined,
        '',
        'NotBearer token123',
        'Bearer', // Missing token
        'token123', // Missing Bearer prefix
        'Basic token123', // Wrong auth type
      ];

      invalidHeaders.forEach(header => {
        mockRequest.headers['authorization'] = header;

        expect(() => executeDecorator(mockContext)).toThrow(BadRequestException);
      });
    });
  });

  describe('context handling', () => {
    it('should correctly access request from execution context', () => {
      const token = 'context.test.token';
      mockRequest.headers['authorization'] = `Bearer ${token}`;

      const switchToHttpSpy = jest.spyOn(mockContext, 'switchToHttp');
      const getRequestSpy = jest.spyOn(mockContext.switchToHttp(), 'getRequest');

      const result = executeDecorator(mockContext);

      expect(switchToHttpSpy).toHaveBeenCalled();
      expect(getRequestSpy).toHaveBeenCalled();
      expect(result).toBe(token);
    });

    it('should handle case sensitivity correctly', () => {
      const token = 'case.test.token';

      // Test lowercase 'authorization' header
      mockRequest.headers = { 'authorization': `Bearer ${token}` };

      const result = executeDecorator(mockContext);
      expect(result).toBe(token);
    });
  });
});