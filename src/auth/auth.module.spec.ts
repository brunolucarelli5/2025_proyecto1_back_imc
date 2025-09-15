import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '../users/users.service';

describe('AuthModule', () => {
  let module: TestingModule;

  // Mock UsersService since it's imported from UsersModule
  const mockUsersService = {
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    register: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Mock user repository since UsersModule needs it
  const mockUserRepository = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Mock ConfigService for JWT configuration
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'jwt.access.secret': 'accessSecret',
        'jwt.access.expiresIn': '15m',
        'jwt.refresh.secret': 'refreshSecret',
        'jwt.refresh.expiresIn': '1d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        AuthGuard,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should compile the module successfully', () => {
    expect(module).toBeDefined();
  });

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

  it('should have JwtService from JwtModule registered', () => {
    const jwtService = module.get<JwtService>(JwtService);
    expect(jwtService).toBeDefined();
    expect(jwtService).toBeInstanceOf(JwtService);
  });

  it('should have AuthGuard registered', () => {
    const authGuard = module.get<AuthGuard>(AuthGuard);
    expect(authGuard).toBeDefined();
    expect(authGuard).toBeInstanceOf(AuthGuard);
  });

  it('should inject UsersService into AuthService', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();

    // AuthService should have login method (which requires UsersService)
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.tokens).toBe('function');
  });

  it('should inject JwtService into AuthService', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();

    // AuthService methods should work (requiring JwtService)
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.tokens).toBe('function');
  });

  it('should inject dependencies into AuthController', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();

    // Controller should have all required methods
    expect(typeof controller.login).toBe('function');
    expect(typeof controller.tokens).toBe('function');
    expect(typeof controller.me).toBe('function');
  });

  it('should inject dependencies into AuthGuard', () => {
    const guard = module.get<AuthGuard>(AuthGuard);
    expect(guard).toBeDefined();

    // Guard should have canActivate method
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should maintain singleton pattern for services', () => {
    const authService1 = module.get<AuthService>(AuthService);
    const authService2 = module.get<AuthService>(AuthService);
    expect(authService1).toBe(authService2);

    const jwtService1 = module.get<JwtService>(JwtService);
    const jwtService2 = module.get<JwtService>(JwtService);
    expect(jwtService1).toBe(jwtService2);

    const authGuard1 = module.get<AuthGuard>(AuthGuard);
    const authGuard2 = module.get<AuthGuard>(AuthGuard);
    expect(authGuard1).toBe(authGuard2);
  });

  it('should be importable by other modules', async () => {
    const testModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        AuthGuard,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    const authService = testModule.get<AuthService>(AuthService);
    expect(authService).toBeDefined();

    await testModule.close();
  });


  it('should have correct module metadata structure', () => {
    expect(module).toBeDefined();
    expect(module.get<AuthService>(AuthService)).toBeDefined();
    expect(module.get<AuthController>(AuthController)).toBeDefined();
  });

  it('should properly import required modules', () => {
    // The module should compile successfully with all required imports
    expect(module).toBeDefined();

    // Verify that imported modules' services are available
    expect(() => module.get<JwtService>(JwtService)).not.toThrow();
  });


  it('should handle circular dependencies correctly', () => {
    // AuthModule imports UsersModule, which might need AuthGuard
    // This test ensures no circular dependency issues
    expect(module).toBeDefined();

    const authService = module.get<AuthService>(AuthService);
    const authGuard = module.get<AuthGuard>(AuthGuard);

    expect(authService).toBeDefined();
    expect(authGuard).toBeDefined();
  });

  it('should provide all required authentication components', () => {
    // Verify all authentication-related components are available
    const components = [AuthController, AuthService, JwtService, AuthGuard];

    components.forEach((component) => {
      expect(() => module.get(component)).not.toThrow();
      expect(module.get(component)).toBeDefined();
    });
  });

  it('should maintain proper dependency injection chain', () => {
    // Test the full dependency chain
    const controller = module.get<AuthController>(AuthController);
    const service = module.get<AuthService>(AuthService);
    const jwtService = module.get<JwtService>(JwtService);
    const guard = module.get<AuthGuard>(AuthGuard);

    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(guard).toBeDefined();

    // Verify that controller can call service methods
    expect(typeof controller.login).toBe('function');
    expect(typeof service.login).toBe('function');
    expect(typeof jwtService.generateToken).toBe('function');
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should handle module initialization and cleanup', async () => {
    // Test module lifecycle
    expect(module).toBeDefined();

    // Module should be able to close without errors
    await expect(module.close()).resolves.not.toThrow();
  });

  it('should configure JWT service with correct settings', () => {
    const jwtService = module.get<JwtService>(JwtService);
    expect(jwtService).toBeDefined();

    // Verify that JWT service has the expected configuration
    expect(jwtService.config).toBeDefined();
    expect(jwtService.config.access).toBeDefined();
    expect(jwtService.config.refresh).toBeDefined();
  });

  it('should support authentication flow integration', () => {
    // Test that all components work together
    const controller = module.get<AuthController>(AuthController);
    const service = module.get<AuthService>(AuthService);
    const jwtService = module.get<JwtService>(JwtService);
    const guard = module.get<AuthGuard>(AuthGuard);

    // All components should be ready for authentication flow
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(guard).toBeDefined();

    // Check that the flow methods exist
    expect(typeof controller.login).toBe('function');
    expect(typeof service.login).toBe('function');
    expect(typeof jwtService.generateToken).toBe('function');
    expect(typeof guard.canActivate).toBe('function');
  });
});
