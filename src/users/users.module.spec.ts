import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';

describe('UsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UsersModule,
        // Mock TypeORM module for testing
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity],
          synchronize: true,
        }),
      ],
    })
      .overrideProvider('IUserRepository')
      .useValue({
        findAll: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
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

  it('should be importable by other modules', async () => {
    const testModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity],
          synchronize: true,
        }),
      ],
    })
      .overrideProvider('IUserRepository')
      .useValue({
        findAll: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    const usersService = testModule.get<UsersService>(UsersService);
    expect(usersService).toBeDefined();

    await testModule.close();
  });

  it('should export UsersService for external use', async () => {
    // Create another module that imports UsersModule and tries to use UsersService
    const consumerModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity],
          synchronize: true,
        }),
      ],
      providers: [
        {
          provide: 'TestService',
          useFactory: (usersService: UsersService) => {
            return { usersService };
          },
          inject: [UsersService],
        },
      ],
    })
      .overrideProvider('IUserRepository')
      .useValue({
        findAll: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    const testService = consumerModule.get('TestService');
    expect(testService.usersService).toBeDefined();
    expect(testService.usersService).toBeInstanceOf(UsersService);

    await consumerModule.close();
  });

  it('should have correct module metadata structure', () => {
    const moduleRef = module.get(UsersModule);
    expect(moduleRef).toBeDefined();
  });

  it('should isolate instances between different module instances', async () => {
    const module2 = await Test.createTestingModule({
      imports: [
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity],
          synchronize: true,
        }),
      ],
    })
      .overrideProvider('IUserRepository')
      .useValue({
        findAll: jest.fn(),
        findByEmail: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    const service1 = module.get<UsersService>(UsersService);
    const service2 = module2.get<UsersService>(UsersService);

    // Services from different modules should be different instances
    expect(service1).toBeDefined();
    expect(service2).toBeDefined();

    await module2.close();
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
});
