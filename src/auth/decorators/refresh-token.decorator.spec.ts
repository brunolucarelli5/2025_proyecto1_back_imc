import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { RefreshToken } from './refresh-token.decorator';

describe('RefreshToken Decorator', () => {
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockHttpContext = (authorizationHeader?: string) => {
    const mockRequest = {
      headers: {
        authorization: authorizationHeader,
      },
    };

    const mockHttpContext = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    };

    mockExecutionContext.switchToHttp.mockReturnValue(mockHttpContext);
    return { mockRequest, mockHttpContext };
  };

  it('should extract token from valid Bearer authorization header', () => {
    const expectedToken = 'valid-refresh-token';
    createMockHttpContext(`Bearer ${expectedToken}`);

    const result = RefreshToken(undefined, mockExecutionContext);

    expect(result).toBe(expectedToken);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  it('should extract token from JWT Bearer authorization header', () => {
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    createMockHttpContext(`Bearer ${jwtToken}`);

    const result = RefreshToken(undefined, mockExecutionContext);

    expect(result).toBe(jwtToken);
  });

  it('should extract token with special characters', () => {
    const tokenWithSpecialChars = 'token-with_special.chars123';
    createMockHttpContext(`Bearer ${tokenWithSpecialChars}`);

    const result = RefreshToken(undefined, mockExecutionContext);

    expect(result).toBe(tokenWithSpecialChars);
  });

  it('should handle tokens with multiple segments after Bearer', () => {
    createMockHttpContext('Bearer token with spaces');

    const result = RefreshToken(undefined, mockExecutionContext);

    expect(result).toBe('token with spaces');
  });

  it('should throw BadRequestException when authorization header is missing', () => {
    createMockHttpContext(); // No authorization header

    expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
      BadRequestException,
    );
    expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
      'El header Authorization debe tener el formato Bearer [token]',
    );
  });

  it('should throw BadRequestException when authorization header is empty string', () => {
    createMockHttpContext('');

    expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
      BadRequestException,
    );
    expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
      'El header Authorization debe tener el formato Bearer [token]',
    );
  });

  it('should throw BadRequestException when authorization header does not start with Bearer', () => {
    const invalidHeaders = ['Basic token', 'bearer refresh-token'];

    invalidHeaders.forEach((header) => {
      createMockHttpContext(header);

      expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
        BadRequestException,
      );
      expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
        'El header Authorization debe tener el formato Bearer [token]',
      );
    });
  });

  it('should throw BadRequestException for malformed Bearer headers', () => {
    const malformedHeaders = [
      'Bearer', // No token
      'Bearer ', // Only space after Bearer
      'BearerToken', // No space
      ' Bearer token', // Leading space
      'Bearer  ', // Multiple spaces, no token
    ];

    malformedHeaders.forEach((header) => {
      createMockHttpContext(header);

      if (header === 'Bearer ' || header === 'Bearer  ') {
        // These cases should extract empty string as token, not throw
        const result = RefreshToken(undefined, mockExecutionContext);
        expect(result).toBe('');
      } else {
        expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
          BadRequestException,
        );
      }
    });
  });

  it('should handle different case variations correctly', () => {
    const testCases = [
      { header: 'Bearer token', expected: 'token', shouldWork: true },
      { header: 'bearer token', expected: null, shouldWork: false },
      { header: 'BEARER token', expected: null, shouldWork: false },
      { header: 'BeareR token', expected: null, shouldWork: false },
    ];

    testCases.forEach(({ header, expected, shouldWork }) => {
      createMockHttpContext(header);

      if (shouldWork) {
        const result = RefreshToken(undefined, mockExecutionContext);
        expect(result).toBe(expected);
      } else {
        expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
          BadRequestException,
        );
      }
    });
  });

  it('should extract token when header has additional whitespace', () => {
    const validHeaders = [
      { header: 'Bearer token', expected: 'token' },
      { header: 'Bearer  token', expected: ' token' }, // Extra space becomes part of token
      { header: 'Bearer token ', expected: 'token ' }, // Trailing space becomes part of token
      { header: 'Bearer  token  with  spaces', expected: ' token  with  spaces' },
    ];

    validHeaders.forEach(({ header, expected }) => {
      createMockHttpContext(header);

      const result = RefreshToken(undefined, mockExecutionContext);
      expect(result).toBe(expected);
    });
  });

  it('should work with real-world JWT tokens', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    createMockHttpContext(`Bearer ${token}`);

    const result = RefreshToken(undefined, mockExecutionContext);
    expect(result).toBe(token);
  });


  it('should be case-sensitive for Bearer prefix', () => {
    const caseSensitiveTests = [
      { prefix: 'Bearer', shouldWork: true },
      { prefix: 'bearer', shouldWork: false },
      { prefix: 'BEARER', shouldWork: false },
      { prefix: 'BeaRer', shouldWork: false },
    ];

    caseSensitiveTests.forEach(({ prefix, shouldWork }) => {
      createMockHttpContext(`${prefix} token`);

      if (shouldWork) {
        const result = RefreshToken(undefined, mockExecutionContext);
        expect(result).toBe('token');
      } else {
        expect(() => RefreshToken(undefined, mockExecutionContext)).toThrow(
          BadRequestException,
        );
      }
    });
  });

  it('should extract everything after "Bearer " as token', () => {
    const header = 'Bearer part1 part2 part3';
    createMockHttpContext(header);

    const result = RefreshToken(undefined, mockExecutionContext);
    const expected = header.substring('Bearer '.length);
    expect(result).toBe(expected);
  });
});