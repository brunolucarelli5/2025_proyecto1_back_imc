import { Test, TestingModule } from '@nestjs/testing';
import { ImcController } from './imc.controller';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { PaginacionHistorialImcDto } from './dto/paginacion-historial-imc.dto';
import { SortValidationPipe } from './pipes/sort-validation.pipe';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('ImcController', () => {
  let controller: ImcController;
  let service: jest.Mocked<ImcService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockCalculoResponse = {
    id: '1',
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date(),
    user: mockUser,
  };

  const mockHistorial = [
    {
      id: '1',
      altura: 1.75,
      peso: 70,
      imc: 22.86,
      categoria: 'Normal',
      fecha_calculo: new Date(),
      user: { ...mockUser, password: 'hashed', imcs: [] } as any,
    },
  ];

  const mockPaginationResponse = {
    data: mockHistorial as any,
    total: 10,
  };

  beforeEach(async () => {
    const mockImcService = {
      calcularImc: jest.fn(),
      findAllSorted: jest.fn(),
      findPag: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockAuthGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImcController],
      providers: [
        {
          provide: ImcService,
          useValue: mockImcService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        SortValidationPipe,
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .compile();

    controller = module.get<ImcController>(ImcController);
    service = module.get<ImcService>(ImcService) as jest.Mocked<ImcService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('calcular', () => {
    it('should calculate IMC successfully', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      service.calcularImc.mockResolvedValue(mockCalculoResponse);

      const result = await controller.calcular(dto, mockRequest as any);

      expect(service.calcularImc).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockCalculoResponse);
    });

    it('should handle service errors', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      service.calcularImc.mockRejectedValue(new Error('Service error'));

      await expect(controller.calcular(dto, mockRequest as any)).rejects.toThrow('Service error');
      expect(service.calcularImc).toHaveBeenCalledWith(dto, mockUser);
    });

    it('should handle different calculation values', async () => {
      const variations = [
        { altura: 1.60, peso: 50 },
        { altura: 1.80, peso: 80 },
        { altura: 2.00, peso: 100 },
      ];

      for (const dto of variations) {
        service.calcularImc.mockResolvedValue({ ...mockCalculoResponse, ...dto });

        const result = await controller.calcular(dto, mockRequest as any);

        expect(service.calcularImc).toHaveBeenCalledWith(dto, mockUser);
        expect(result.altura).toBe(dto.altura);
        expect(result.peso).toBe(dto.peso);
      }
    });
  });

  describe('getHistorial', () => {
    it('should get historial with different sort options', async () => {
      service.findAllSorted.mockResolvedValue(mockHistorial as any);

      const resultDesc = await controller.getHistorial('desc', mockRequest as any);
      expect(service.findAllSorted).toHaveBeenCalledWith('desc', '1');
      expect(resultDesc).toEqual(mockHistorial);

      const resultAsc = await controller.getHistorial('asc', mockRequest as any);
      expect(service.findAllSorted).toHaveBeenCalledWith('asc', '1');
      expect(resultAsc).toEqual(mockHistorial);
    });

    it('should handle empty historial', async () => {
      service.findAllSorted.mockResolvedValue([]);
      const result = await controller.getHistorial('desc', mockRequest as any);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      service.findAllSorted.mockRejectedValue(new Error('Database error'));

      await expect(controller.getHistorial('desc', mockRequest as any)).rejects.toThrow('Database error');
    });
  });

  describe('findPag', () => {
    it('should get paginated results with different parameters', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      service.findPag.mockResolvedValue(mockPaginationResponse);

      const result = await controller.findPag(paginacion, 'desc', mockRequest as any);

      expect(service.findPag).toHaveBeenCalledWith(paginacion, 'desc', '1');
      expect(result).toEqual(mockPaginationResponse);
    });

    it('should handle empty pagination results', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 999, mostrar: 5 };
      const emptyResponse = { data: [], total: 0 };
      service.findPag.mockResolvedValue(emptyResponse);

      const result = await controller.findPag(paginacion, 'desc', mockRequest as any);
      expect(result).toEqual(emptyResponse);
    });

    it('should handle service errors in pagination', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      service.findPag.mockRejectedValue(new Error('Pagination error'));

      await expect(controller.findPag(paginacion, 'desc', mockRequest as any)).rejects.toThrow('Pagination error');
    });
  });

  describe('obtenerDashboard', () => {
    it('should get dashboard data for user', async () => {
      const mockDashboard = {
        historiales: [],
        promedio_desviacion: { promedio: 22.5, desviacion: 2.1 },
        categorias: { cantBajoPeso: 0, cantNormal: 1, cantSobrepeso: 0, cantObeso: 0 }
      };

      service.obtenerDashboard = jest.fn().mockResolvedValue(mockDashboard);

      const result = await controller.obtenerDashboard(mockRequest as any);

      expect(result).toEqual(mockDashboard);
      expect(service.obtenerDashboard).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('integration scenarios', () => {
    it('should have all required methods', () => {
      expect(typeof controller.calcular).toBe('function');
      expect(typeof controller.getHistorial).toBe('function');
      expect(typeof controller.findPag).toBe('function');
      expect(typeof controller.obtenerDashboard).toBe('function');
    });

    it('should use correct user ID from request', async () => {
      const differentUser = { ...mockUser, id: 999 };
      const requestWithDifferentUser = { user: differentUser };

      service.findAllSorted.mockResolvedValue([]);

      await controller.getHistorial('desc', requestWithDifferentUser as any);

      expect(service.findAllSorted).toHaveBeenCalledWith('desc', 999);
    });
  });
});