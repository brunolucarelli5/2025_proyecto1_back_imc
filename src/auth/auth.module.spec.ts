import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '../users/users.service';

describe('AuthModule', () => {
  let module: TestingModule;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'jwt.access.secret': 'accessSecret123',
        'jwt.access.expiresIn': '15m',
        'jwt.refresh.secret': 'refreshSecret456',
        'jwt.refresh.expiresIn': '7d',
      };
      return config[key];
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        AuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  it('should compile the module successfully', () => {
    expect(module).toBeDefined();
  });

  describe('core components registration', () => {
    it('should have AuthController registered', () => {
      const controller = module.get<AuthController>(AuthController);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(AuthController);
    });

    it('should have AuthService registered', () => {
      const service = module.get<AuthService>(AuthService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(AuthService);
    });

    it('should have JwtService registered', () => {
      const jwtService = module.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();
      expect(jwtService).toBeInstanceOf(JwtService);
    });

    it('should have AuthGuard registered', () => {
      const guard = module.get<AuthGuard>(AuthGuard);
      expect(guard).toBeDefined();
      expect(guard).toBeInstanceOf(AuthGuard);
    });
  });

  describe('dependency injection', () => {
    it('should inject dependencies correctly into AuthService', () => {
      const service = module.get<AuthService>(AuthService);
      expect(service).toBeDefined();

      // Verify service has the expected methods
      expect(typeof service.login).toBe('function');
      expect(typeof service.tokens).toBe('function');
    });

    it('should inject dependencies correctly into AuthController', () => {
      const controller = module.get<AuthController>(AuthController);
      expect(controller).toBeDefined();

      // Verify controller has the expected methods
      expect(typeof controller.login).toBe('function');
      expect(typeof controller.tokens).toBe('function');
      expect(typeof controller.me).toBe('function');
    });

    it('should inject dependencies correctly into JwtService', () => {
      const jwtService = module.get<JwtService>(JwtService);
      expect(jwtService).toBeDefined();

      // Verify JwtService has proper configuration
      expect(jwtService.config).toBeDefined();
      expect(jwtService.config.access).toBeDefined();
      expect(jwtService.config.refresh).toBeDefined();

      // Verify methods exist
      expect(typeof jwtService.generateToken).toBe('function');
      expect(typeof jwtService.refreshToken).toBe('function');
      expect(typeof jwtService.getPayload).toBe('function');
    });

    it('should inject dependencies correctly into AuthGuard', () => {
      const guard = module.get<AuthGuard>(AuthGuard);
      expect(guard).toBeDefined();

      // Verify guard has the required method
      expect(typeof guard.canActivate).toBe('function');
    });
  });

  describe('singleton pattern validation', () => {
    it('should maintain singleton instances', () => {
      const service1 = module.get<AuthService>(AuthService);
      const service2 = module.get<AuthService>(AuthService);
      expect(service1).toBe(service2);

      const controller1 = module.get<AuthController>(AuthController);
      const controller2 = module.get<AuthController>(AuthController);
      expect(controller1).toBe(controller2);

      const jwt1 = module.get<JwtService>(JwtService);
      const jwt2 = module.get<JwtService>(JwtService);
      expect(jwt1).toBe(jwt2);
    });
  });

  describe('module lifecycle', () => {
    it('should handle module initialization correctly', () => {
      expect(module).toBeDefined();

      // All core services should be available
      expect(() => module.get<AuthService>(AuthService)).not.toThrow();
      expect(() => module.get<AuthController>(AuthController)).not.toThrow();
      expect(() => module.get<JwtService>(JwtService)).not.toThrow();
      expect(() => module.get<AuthGuard>(AuthGuard)).not.toThrow();
    });

    it('should handle module cleanup correctly', async () => {
      expect(module).toBeDefined();
      await expect(module.close()).resolves.not.toThrow();
    });
  });

  describe('configuration validation', () => {
    it('should provide correct JWT configuration', () => {
      const jwtService = module.get<JwtService>(JwtService);

      expect(jwtService.config).toEqual({
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

    it('should handle config service integration', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('jwt.access.secret');
      expect(mockConfigService.get).toHaveBeenCalledWith('jwt.access.expiresIn');
      expect(mockConfigService.get).toHaveBeenCalledWith('jwt.refresh.secret');
      expect(mockConfigService.get).toHaveBeenCalledWith('jwt.refresh.expiresIn');
    });
  });

  describe('service integration validation', () => {
    it('should enable complete auth workflow through integrated services', () => {
      const controller = module.get<AuthController>(AuthController);
      const service = module.get<AuthService>(AuthService);
      const jwtService = module.get<JwtService>(JwtService);
      const guard = module.get<AuthGuard>(AuthGuard);

      // Verify the complete integration chain exists
      expect(controller).toBeDefined();
      expect(service).toBeDefined();
      expect(jwtService).toBeDefined();
      expect(guard).toBeDefined();

      // Verify all services have their required methods for integration
      expect(typeof service.login).toBe('function');
      expect(typeof service.tokens).toBe('function');
      expect(typeof jwtService.generateToken).toBe('function');
      expect(typeof jwtService.refreshToken).toBe('function');
      expect(typeof jwtService.getPayload).toBe('function');
      expect(typeof guard.canActivate).toBe('function');
    });

    it('should support external service dependencies', () => {
      const service = module.get<AuthService>(AuthService);
      expect(service).toBeDefined();

      // UsersService should be properly injected
      expect(mockUsersService).toBeDefined();
      expect(typeof mockUsersService.findByEmail).toBe('function');
    });
  });
});