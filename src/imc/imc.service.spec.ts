import { Test, TestingModule } from '@nestjs/testing';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { ICalculoImcRepository } from './repositories/CalculoImc.repository.interface';
import { UserEntity } from '../users/entities/user.entity';
import { CalculoImc } from './entities/CalculoImc.entity';

describe('ImcService', () => {
  let service: ImcService;
  let mockRepository: jest.Mocked<ICalculoImcRepository>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: []
  } as unknown as UserEntity;

  const mockCalculoImc: CalculoImc = {
    id: 1,
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date(),
    user: mockUser
  };

  beforeEach(async () => {
    mockRepository = {
      findAllSorted: jest.fn(),
      findPag: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<ICalculoImcRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImcService,
        {
          provide: 'ICalculoImcRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ImcService>(ImcService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calcularImc', () => {
    it('should calculate IMC and categorize correctly for all categories', async () => {
      const testCases = [
        {
          dto: { altura: 1.75, peso: 50 },
          expectedIMC: 16.33,
          expectedCategory: 'Bajo peso',
        },
        {
          dto: { altura: 1.75, peso: 70 },
          expectedIMC: 22.86,
          expectedCategory: 'Normal',
        },
        {
          dto: { altura: 1.75, peso: 80 },
          expectedIMC: 26.12,
          expectedCategory: 'Sobrepeso',
        },
        {
          dto: { altura: 1.75, peso: 100 },
          expectedIMC: 32.65,
          expectedCategory: 'Obeso',
        },
      ];

      for (const { dto, expectedIMC, expectedCategory } of testCases) {
        const mockResponse = { ...mockCalculoImc, imc: expectedIMC, categoria: expectedCategory };
        mockRepository.save.mockResolvedValue(mockResponse);

        const result = await service.calcularImc(dto, mockUser);

        expect(result.imc).toBeCloseTo(expectedIMC, 2);
        expect(result.categoria).toBe(expectedCategory);
        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            altura: dto.altura,
            peso: dto.peso,
            imc: expectedIMC,
            categoria: expectedCategory,
            user: mockUser
          })
        );
      }
    });

    it('should handle exact category boundaries', async () => {
      const altura = 1.75;
      const boundaryTests = [
        { imc: 18.5, category: 'Normal' },
        { imc: 25.0, category: 'Sobrepeso' },
        { imc: 30.0, category: 'Obeso' },
      ];

      for (const { imc, category } of boundaryTests) {
        const peso = imc * altura * altura;
        const dto: CalculoImcDto = { altura, peso };

        const mockResponse = { ...mockCalculoImc, imc, categoria: category };
        mockRepository.save.mockResolvedValue(mockResponse);

        const result = await service.calcularImc(dto, mockUser);
        expect(result.imc).toBeCloseTo(imc, 2);
        expect(result.categoria).toBe(category);
      }
    });

    it('should handle extreme valid values and precision', async () => {
      const extremeTests = [
        {
          dto: { altura: 0.01, peso: 0.01 },
          expectedIMC: 100,
          expectedCategory: 'Obeso',
        },
        {
          dto: { altura: 2.99, peso: 499.99 },
          expectedIMC: 55.9,
          expectedCategory: 'Obeso',
        },
      ];

      for (const { dto, expectedIMC, expectedCategory } of extremeTests) {
        const mockResponse = { ...mockCalculoImc, imc: expectedIMC, categoria: expectedCategory };
        mockRepository.save.mockResolvedValue(mockResponse);

        const result = await service.calcularImc(dto, mockUser);
        expect(result.imc).toBeCloseTo(expectedIMC, 1);
        expect(result.categoria).toBe(expectedCategory);
      }
    });
  });

  describe('findAllSorted', () => {
    it('should return sorted results in ASC order', async () => {
      const mockResults = [mockCalculoImc];
      mockRepository.findAllSorted.mockResolvedValue(mockResults);

      const result = await service.findAllSorted('asc', 1);

      expect(result).toEqual(mockResults);
      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('ASC', 1);
    });

    it('should return sorted results in DESC order by default', async () => {
      const mockResults = [mockCalculoImc];
      mockRepository.findAllSorted.mockResolvedValue(mockResults);

      const result = await service.findAllSorted('desc', 1);

      expect(result).toEqual(mockResults);
      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('DESC', 1);
    });

    it('should handle case-insensitive sort parameter', async () => {
      const mockResults = [mockCalculoImc];
      mockRepository.findAllSorted.mockResolvedValue(mockResults);

      await service.findAllSorted('ASC' as any, 1);
      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('ASC', 1);

      await service.findAllSorted('desc', 1);
      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('DESC', 1);
    });
  });

  describe('findPag', () => {
    it('should return paginated results', async () => {
      const mockPaginationDto = { pag: 1, mostrar: 10 };
      const mockResponse = { data: [mockCalculoImc], total: 1 };

      mockRepository.findPag.mockResolvedValue(mockResponse);

      const result = await service.findPag(mockPaginationDto, 'desc', 1);

      expect(result).toEqual(mockResponse);
      expect(mockRepository.findPag).toHaveBeenCalledWith(1, 10, 'DESC', 1);
    });

    it('should handle different sort orders for pagination', async () => {
      const mockPaginationDto = { pag: 2, mostrar: 5 };
      const mockResponse = { data: [], total: 0 };

      mockRepository.findPag.mockResolvedValue(mockResponse);

      await service.findPag(mockPaginationDto, 'asc', 1);
      expect(mockRepository.findPag).toHaveBeenCalledWith(2, 5, 'ASC', 1);
    });
  });

  describe('Integration and categorization', () => {
    it('should use helper functions correctly', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      const expectedIMC = 70 / (1.75 * 1.75);
      const expectedRounded = Math.round(expectedIMC * 100) / 100;

      const mockResponse = { ...mockCalculoImc, imc: expectedRounded };
      mockRepository.save.mockResolvedValue(mockResponse);

      const result = await service.calcularImc(dto, mockUser);
      expect(result.imc).toBe(expectedRounded);
    });

    it('should properly format response without password', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      mockRepository.save.mockResolvedValue(mockCalculoImc);

      const result = await service.calcularImc(dto, mockUser);

      expect(result.user).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('email');
    });
  });
});
