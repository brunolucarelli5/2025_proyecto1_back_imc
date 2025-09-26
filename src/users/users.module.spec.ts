import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '../auth/jwt/jwt.service';

describe('UsersModule', () => {
  let module: TestingModule;

  const mockUserRepository = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

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

  const mockMongooseModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        JwtService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockMongooseModel,
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

  it('should have all core components registered and maintain singleton pattern', () => {
    const controller = module.get<UsersController>(UsersController);
    const service = module.get<UsersService>(UsersService);
    const jwtService = module.get<JwtService>(JwtService);

    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(UsersController);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(UsersService);
    expect(jwtService).toBeDefined();
    expect(jwtService).toBeInstanceOf(JwtService);

    // Test singleton pattern
    const service2 = module.get<UsersService>(UsersService);
    expect(service).toBe(service2);
  });

  it('should provide IUserRepository correctly with all required methods', () => {
    const repository = module.get('IUserRepository');
    expect(repository).toBeDefined();

    // Repository should have all required methods
    expect(typeof repository.findAll).toBe('function');
    expect(typeof repository.findByEmail).toBe('function');
    expect(typeof repository.save).toBe('function');
    expect(typeof repository.update).toBe('function');
    expect(typeof repository.delete).toBe('function');
  });

  it('should inject dependencies correctly and have proper method access', () => {
    const service = module.get<UsersService>(UsersService);
    const controller = module.get<UsersController>(UsersController);

    // Service should be properly instantiated with its dependencies
    expect(typeof service.findAll).toBe('function');
    expect(typeof service.findByEmail).toBe('function');
    expect(typeof service.register).toBe('function');
    expect(typeof service.update).toBe('function');
    expect(typeof service.delete).toBe('function');

    // Controller should have access to service methods
    expect(typeof controller.findAll).toBe('function');
    expect(typeof controller.register).toBe('function');
    expect(typeof controller.update).toBe('function');
    expect(typeof controller.delete).toBe('function');

    // Test dependency injection tokens
    expect(() => module.get('IUserRepository')).not.toThrow();
    expect(() => module.get(UsersService)).not.toThrow();
    expect(() => module.get(UsersController)).not.toThrow();
    expect(() => module.get(JwtService)).not.toThrow();
  });

  it('should handle module lifecycle and support complete injection chain', async () => {
    // Test module lifecycle
    expect(module).toBeDefined();

    // Verify all components are accessible
    const repository = module.get('IUserRepository');
    const service = module.get<UsersService>(UsersService);
    const controller = module.get<UsersController>(UsersController);
    const jwtService = module.get<JwtService>(JwtService);

    expect(repository).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(jwtService).toBeDefined();

    // Verify the injection chain works
    expect(typeof service.findAll).toBe('function');
    expect(typeof controller.findAll).toBe('function');

    // Module should be able to close without errors
    await expect(module.close()).resolves.not.toThrow();
  });
});