import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '../auth/jwt/jwt.service';

describe('UsersModule', () => {
  let module: TestingModule;

  // Mock repositories and services
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

  const mockTypeOrmRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
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
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepository,
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

  it('should have UsersController registered', () => {
    const controller = module.get<UsersController>(UsersController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(UsersController);
  });

  it('should have UsersService registered', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(UsersService);
  });

  it('should provide IUserRepository correctly', () => {
    const repository = module.get('IUserRepository');
    expect(repository).toBeDefined();
  });

  it('should inject repository dependency into service', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();

    // Service should be properly instantiated with its dependencies
    expect(typeof service.findAll).toBe('function');
    expect(typeof service.findByEmail).toBe('function');
    expect(typeof service.register).toBe('function');
    expect(typeof service.update).toBe('function');
    expect(typeof service.delete).toBe('function');
  });

  it('should inject service dependency into controller', () => {
    const controller = module.get<UsersController>(UsersController);
    expect(controller).toBeDefined();

    // Controller should have access to service methods
    expect(typeof controller.findAll).toBe('function');
    expect(typeof controller.register).toBe('function');
    expect(typeof controller.update).toBe('function');
    expect(typeof controller.delete).toBe('function');
  });

  it('should maintain singleton pattern for services', () => {
    const service1 = module.get<UsersService>(UsersService);
    const service2 = module.get<UsersService>(UsersService);
    expect(service1).toBe(service2);

    const controller1 = module.get<UsersController>(UsersController);
    const controller2 = module.get<UsersController>(UsersController);
    expect(controller1).toBe(controller2);
  });



  it('should have correct module metadata structure', () => {
    expect(module).toBeDefined();
    expect(module.get<UsersService>(UsersService)).toBeDefined();
    expect(module.get<UsersController>(UsersController)).toBeDefined();
  });


  it('should handle repository pattern correctly', () => {
    const repository = module.get('IUserRepository');
    const service = module.get<UsersService>(UsersService);

    expect(repository).toBeDefined();
    expect(service).toBeDefined();

    // Repository should have all required methods
    expect(typeof repository.findAll).toBe('function');
    expect(typeof repository.findByEmail).toBe('function');
    expect(typeof repository.save).toBe('function');
    expect(typeof repository.update).toBe('function');
    expect(typeof repository.delete).toBe('function');
  });

  it('should properly configure dependency injection tokens', () => {
    // Test that the correct tokens are used for dependency injection
    expect(() => {
      module.get('IUserRepository');
    }).not.toThrow();

    expect(() => {
      module.get(UsersService);
    }).not.toThrow();

    expect(() => {
      module.get(UsersController);
    }).not.toThrow();
  });

  it('should handle module initialization and cleanup', async () => {
    // Test module lifecycle
    expect(module).toBeDefined();

    // Module should be able to close without errors
    await expect(module.close()).resolves.not.toThrow();
  });

  it('should provide JwtService and maintain dependency injection', () => {
    const jwtService = module.get<JwtService>(JwtService);
    expect(jwtService).toBeDefined();
    expect(jwtService).toBeInstanceOf(JwtService);
    expect(() => module.get('IUserRepository')).not.toThrow();
  });
});
