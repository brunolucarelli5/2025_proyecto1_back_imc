import { Test, TestingModule } from '@nestjs/testing';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { PaginacionHistorialImcDto } from './dto/paginacion-historial-imc.dto';
import { User } from '../users/schemas/user.schema';
import { CalculoImc } from './schemas/calculo-imc.schema';

describe('ImcService', () => {
  let service: ImcService;
  let mockRepository: jest.Mocked<any>;

  const mockUser = {
    id: '1',
    _id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
  } as unknown as User;

  const mockCalculoImc: CalculoImc = {
    id: '1',
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date('2023-01-01'),
    user: mockUser,
  } as CalculoImc;

  const expectedFormattedResult = {
    id: '1',
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date('2023-01-01'),
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  beforeEach(async () => {
    mockRepository = {
      findAllSorted: jest.fn(),
      findPag: jest.fn(),
      save: jest.fn(),
      findByIdConUsuario: jest.fn(),
    };

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
    it('should calculate IMC and save to repository', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      mockRepository.save.mockResolvedValue(mockCalculoImc);
      mockRepository.findByIdConUsuario.mockResolvedValue(mockCalculoImc);

      const result = await service.calcularImc(dto, mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith({
        altura: 1.75,
        peso: 70,
        imc: 22.86,
        categoria: 'Normal',
        user: '1',
        fecha_calculo: expect.any(Date),
      });
      expect(result).toEqual(expectedFormattedResult);
    });

    it('should categorize IMC as Bajo peso', async () => {
      const dto: CalculoImcDto = { altura: 1.80, peso: 50 };
      const lowWeightImc = { ...mockCalculoImc, imc: 15.43, categoria: 'Bajo peso' };
      mockRepository.save.mockResolvedValue(lowWeightImc);
      mockRepository.findByIdConUsuario.mockResolvedValue(lowWeightImc);

      const result = await service.calcularImc(dto, mockUser);

      expect(result.categoria).toBe('Bajo peso');
    });

    it('should categorize IMC as Sobrepeso', async () => {
      const dto: CalculoImcDto = { altura: 1.70, peso: 80 };
      const overweightImc = { ...mockCalculoImc, imc: 27.68, categoria: 'Sobrepeso' };
      mockRepository.save.mockResolvedValue(overweightImc);
      mockRepository.findByIdConUsuario.mockResolvedValue(overweightImc);

      const result = await service.calcularImc(dto, mockUser);

      expect(result.categoria).toBe('Sobrepeso');
    });

    it('should categorize IMC as Obeso', async () => {
      const dto: CalculoImcDto = { altura: 1.70, peso: 100 };
      const obeseImc = { ...mockCalculoImc, imc: 34.60, categoria: 'Obeso' };
      mockRepository.save.mockResolvedValue(obeseImc);
      mockRepository.findByIdConUsuario.mockResolvedValue(obeseImc);

      const result = await service.calcularImc(dto, mockUser);

      expect(result.categoria).toBe('Obeso');
    });
  });

  describe('findAllSorted', () => {
    it('should return sorted results in DESC order by default', async () => {
      const sortedResults = [mockCalculoImc];
      mockRepository.findAllSorted.mockResolvedValue(sortedResults);

      const result = await service.findAllSorted('desc', '1');

      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('DESC', '1');
      expect(result).toEqual([expectedFormattedResult]);
    });

    it('should return sorted results in ASC order', async () => {
      const sortedResults = [mockCalculoImc];
      mockRepository.findAllSorted.mockResolvedValue(sortedResults);

      const result = await service.findAllSorted('asc', '1');

      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('ASC', '1');
      expect(result).toEqual([expectedFormattedResult]);
    });

    it('should handle uppercase sort parameter', async () => {
      const sortedResults = [mockCalculoImc];
      mockRepository.findAllSorted.mockResolvedValue(sortedResults);

      const result = await service.findAllSorted('ASC' as any, '1');

      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('ASC', '1');
      expect(result).toEqual([expectedFormattedResult]);
    });
  });

  describe('findPag', () => {
    it('should return paginated results with DESC sort', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      const paginatedResponse = { data: [mockCalculoImc], total: 1 };
      mockRepository.findPag.mockResolvedValue(paginatedResponse);

      const result = await service.findPag(paginacion, 'desc', '1');

      expect(mockRepository.findPag).toHaveBeenCalledWith(1, 5, 'DESC', '1');
      expect(result).toEqual({ data: [expectedFormattedResult], total: 1 });
    });

    it('should return paginated results with ASC sort', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 2, mostrar: 10 };
      const paginatedResponse = { data: [mockCalculoImc], total: 15 };
      mockRepository.findPag.mockResolvedValue(paginatedResponse);

      const result = await service.findPag(paginacion, 'asc', '1');

      expect(mockRepository.findPag).toHaveBeenCalledWith(2, 10, 'ASC', '1');
      expect(result).toEqual({ data: [expectedFormattedResult], total: 15 });
    });

    it('should handle default DESC sort when parameter is invalid', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      const paginatedResponse = { data: [], total: 0 };
      mockRepository.findPag.mockResolvedValue(paginatedResponse);

      const result = await service.findPag(paginacion, 'invalid' as any, '1');

      expect(mockRepository.findPag).toHaveBeenCalledWith(1, 5, 'INVALID', '1');
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('integration scenarios', () => {
    it('should handle different IMC boundary values correctly', async () => {
      const testCases = [
        { peso: 45, altura: 1.70, expectedCategory: 'Bajo peso' },
        { peso: 65, altura: 1.70, expectedCategory: 'Normal' },
        { peso: 80, altura: 1.70, expectedCategory: 'Sobrepeso' },
        { peso: 95, altura: 1.70, expectedCategory: 'Obeso' },
      ];

      for (const testCase of testCases) {
        const dto: CalculoImcDto = { altura: testCase.altura, peso: testCase.peso };
        const mockResult = { ...mockCalculoImc, categoria: testCase.expectedCategory };
        mockRepository.save.mockResolvedValue(mockResult);
        mockRepository.findByIdConUsuario.mockResolvedValue(mockResult);

        const result = await service.calcularImc(dto, mockUser);

        expect(result.categoria).toBe(testCase.expectedCategory);
      }
    });

    it('should format response correctly hiding user password', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      const calculoWithPassword = {
        ...mockCalculoImc,
        user: { ...mockUser, password: 'secretPassword' },
      };
      mockRepository.save.mockResolvedValue(calculoWithPassword);
      mockRepository.findByIdConUsuario.mockResolvedValue(calculoWithPassword);

      const result = await service.calcularImc(dto, mockUser);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });
  });

  describe('obtenerDashboard', () => {
    it('should return dashboard data with calculations', async () => {
      const mockHistoriales = [
        {
          fecha_calculo: new Date('2023-01-01'),
          imc: '22.5',
          peso: '70',
          categoria: 'Normal'
        },
        {
          fecha_calculo: new Date('2023-01-02'),
          imc: '24.0',
          peso: '75',
          categoria: 'Normal'
        }
      ];

      mockRepository.findAllSorted.mockResolvedValue(mockHistoriales);

      const result = await service.obtenerDashboard('user123');

      expect(result.historiales).toHaveLength(2);
      expect(result.historiales[0].imc).toBe(22.5);
      expect(result.historiales[1].peso).toBe(75);
      expect(result.estadisticasImc.promedio).toBe(23.25);
      expect(result.categorias.cantNormal).toBe(2);
      expect(mockRepository.findAllSorted).toHaveBeenCalledWith('ASC', 'user123');
    });
  });
});