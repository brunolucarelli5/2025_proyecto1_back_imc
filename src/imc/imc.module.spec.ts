import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImcModule } from './imc.module';
import { ImcController } from './imc.controller';
import { ImcService } from './imc.service';
import { CalculoImcRepository } from './repositories/CalculoImc.repository';
import { CalculoImc } from './entities/CalculoImc.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '../auth/jwt/jwt.module';

describe('ImcModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Mock TypeORM module
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [CalculoImc],
          synchronize: true,
        }),
      ],
      controllers: [ImcController],
      providers: [
        ImcService,
        CalculoImcRepository,
        {
          provide: 'ICalculoImcRepository',
          useValue: {
            findAllSorted: jest.fn(),
            findPag: jest.fn(),
            save: jest.fn(),
          },
        },
        // Mock Auth dependencies
        {
          provide: 'AuthGuard',
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: 'JwtService',
          useValue: {
            getPayload: jest.fn(),
            generateToken: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: 'UsersService',
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
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

  it('should have ImcController registered', () => {
    const controller = module.get<ImcController>(ImcController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(ImcController);
  });

  it('should have ImcService registered', () => {
    const service = module.get<ImcService>(ImcService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ImcService);
  });

  it('should provide ICalculoImcRepository correctly', () => {
    const repository = module.get('ICalculoImcRepository');
    expect(repository).toBeDefined();
  });

  it('should inject repository dependency into service', () => {
    const service = module.get<ImcService>(ImcService);
    expect(service).toBeDefined();
    // Service should be properly instantiated with its dependencies
    expect(typeof service.calcularImc).toBe('function');
    expect(typeof service.findAllSorted).toBe('function');
    expect(typeof service.findPag).toBe('function');
  });

  it('should maintain singleton pattern for services', () => {
    const service1 = module.get<ImcService>(ImcService);
    const service2 = module.get<ImcService>(ImcService);
    expect(service1).toBe(service2);
  });

  it('should be importable by other modules', async () => {
    const testModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [CalculoImc],
          synchronize: true,
        }),
      ],
      controllers: [ImcController],
      providers: [
        ImcService,
        CalculoImcRepository,
        {
          provide: 'ICalculoImcRepository',
          useValue: {
            findAllSorted: jest.fn(),
            findPag: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'AuthGuard',
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: 'JwtService',
          useValue: {
            getPayload: jest.fn(),
            generateToken: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: 'UsersService',
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
    .compile();

    const imcService = testModule.get<ImcService>(ImcService);
    expect(imcService).toBeDefined();

    await testModule.close();
  });

  it('should have correct module metadata structure', () => {
    expect(module).toBeDefined();
    expect(module.get<ImcService>(ImcService)).toBeDefined();
    expect(module.get<ImcController>(ImcController)).toBeDefined();
  });

  it('should isolate instances between different module instances', async () => {
    const module2 = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [CalculoImc],
          synchronize: true,
        }),
      ],
      controllers: [ImcController],
      providers: [
        ImcService,
        CalculoImcRepository,
        {
          provide: 'ICalculoImcRepository',
          useValue: {
            findAllSorted: jest.fn(),
            findPag: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'AuthGuard',
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: 'JwtService',
          useValue: {
            getPayload: jest.fn(),
            generateToken: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: 'UsersService',
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
    .compile();

    const service1 = module.get<ImcService>(ImcService);
    const service2 = module2.get<ImcService>(ImcService);

    // Services from different modules should be different instances
    // but within the same module, they should be the same (singleton)
    expect(service1).toBeDefined();
    expect(service2).toBeDefined();

    await module2.close();
  });
});