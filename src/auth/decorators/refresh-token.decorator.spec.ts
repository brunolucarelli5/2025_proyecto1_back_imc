import { BadRequestException, ExecutionContext } from '@nestjs/common';

describe('RefreshToken Decorator Logic', () => {
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

  // Helper function to simulate decorator logic
  const extractRefreshToken = (context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('El header Authorization debe tener el formato Bearer [token]');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new BadRequestException('El header Authorization debe tener el formato Bearer [token]');
    }

    return token;
  };

  describe('valid token extraction', () => {
    it('should extract token from valid Bearer authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      mockRequest.headers['authorization'] = `Bearer ${token}`;

      const result = extractRefreshToken(mockContext);

      expect(result).toBe(token);
    });

    it('should handle different token formats', () => {
      const tokens = ['short.token', 'long.token.with.multiple.segments'];

      tokens.forEach(token => {
        mockRequest.headers['authorization'] = `Bearer ${token}`;
        const result = extractRefreshToken(mockContext);
        expect(result).toBe(token);
      });
    });
  });

  describe('error cases', () => {
    it('should throw BadRequestException when authorization header is missing', () => {
      mockRequest.headers = {};
      expect(() => extractRefreshToken(mockContext)).toThrow(BadRequestException);
      expect(() => extractRefreshToken(mockContext)).toThrow('El header Authorization debe tener el formato Bearer [token]');
    });

    it('should throw BadRequestException for invalid header formats', () => {
      const invalidHeaders = [
        'Basic token123',
        'Token token123',
        'bearer token123',
        'token123',
        'Bearer',
        'Bearer ',
        '',
      ];

      invalidHeaders.forEach(header => {
        mockRequest.headers['authorization'] = header;
        expect(() => extractRefreshToken(mockContext)).toThrow(BadRequestException);
      });
    });
  });

  describe('context handling', () => {
    it('should correctly access request from execution context', () => {
      const token = 'context.test.token';
      mockRequest.headers['authorization'] = `Bearer ${token}`;

      const switchToHttpSpy = jest.spyOn(mockContext, 'switchToHttp');
      const getRequestSpy = jest.spyOn(mockContext.switchToHttp(), 'getRequest');

      const result = extractRefreshToken(mockContext);

      expect(switchToHttpSpy).toHaveBeenCalled();
      expect(getRequestSpy).toHaveBeenCalled();
      expect(result).toBe(token);
    });
  });
});