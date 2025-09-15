import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImcController } from './imc.controller';
import { ImcService } from './imc.service';
import { CalculoImcRepository } from './repositories/CalculoImc.repository';
import { CalculoImc } from './entities/CalculoImc.entity';
import { JwtService } from '../auth/jwt/jwt.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';

describe('ImcModule', () => {
  let module: TestingModule;

  // Mock repositories and services
  const mockCalculoImcRepository = {
    findAllSorted: jest.fn(),
    findPag: jest.fn(),
    save: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    register: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
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

  const mockTypeOrmRepositoryCalculoImc = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTypeOrmRepositoryUser = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ImcController],
      providers: [
        ImcService,
        CalculoImcRepository,
        JwtService,
        AuthGuard,
        UsersService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'ICalculoImcRepository',
          useValue: mockCalculoImcRepository,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(CalculoImc),
          useValue: mockTypeOrmRepositoryCalculoImc,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepositoryUser,
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


  it('should have correct module metadata structure', () => {
    expect(module).toBeDefined();
    expect(module.get<ImcService>(ImcService)).toBeDefined();
    expect(module.get<ImcController>(ImcController)).toBeDefined();
  });


  it('should provide all services correctly', () => {
    const jwtService = module.get<JwtService>(JwtService);
    const authGuard = module.get<AuthGuard>(AuthGuard);
    const usersService = module.get<UsersService>(UsersService);
    const repository = module.get<CalculoImcRepository>(CalculoImcRepository);

    expect(jwtService).toBeDefined();
    expect(authGuard).toBeDefined();
    expect(usersService).toBeDefined();
    expect(repository).toBeDefined();
  });

  it('should maintain consistent dependency injection', () => {
    // Test that all providers can be resolved without circular dependencies
    expect(() => module.get<ImcService>(ImcService)).not.toThrow();
    expect(() => module.get<ImcController>(ImcController)).not.toThrow();
    expect(() => module.get<JwtService>(JwtService)).not.toThrow();
    expect(() => module.get<AuthGuard>(AuthGuard)).not.toThrow();
    expect(() => module.get<UsersService>(UsersService)).not.toThrow();
    expect(() => module.get('ICalculoImcRepository')).not.toThrow();
    expect(() => module.get('IUserRepository')).not.toThrow();
  });

  it('should handle repository pattern correctly', () => {
    const imcRepository = module.get('ICalculoImcRepository');
    const userRepository = module.get('IUserRepository');

    expect(imcRepository).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(typeof imcRepository.findAllSorted).toBe('function');
    expect(typeof userRepository.findByEmail).toBe('function');
  });
});