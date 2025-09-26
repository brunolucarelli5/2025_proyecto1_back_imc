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
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockCalculoResponse = {
    id: 1,
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date(),
    user: mockUser,
  };

  const mockHistorial = [
    {
      id: 1,
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
    it('should calculate IMC and log message', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.calcularImc.mockResolvedValue(mockCalculoResponse);

      const result = await controller.calcular(dto, mockRequest as any);

      expect(consoleSpy).toHaveBeenCalledWith('Calculando IMC');
      expect(service.calcularImc).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockCalculoResponse);

      consoleSpy.mockRestore();
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
    it('should get historial with default sort and log message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.findAllSorted.mockResolvedValue(mockHistorial as any);

      const result = await controller.getHistorial('desc', mockRequest as any);

      expect(consoleSpy).toHaveBeenCalledWith('Obteniendo historial de IMC para test@example.com');
      expect(service.findAllSorted).toHaveBeenCalledWith('desc', 1);
      expect(result).toEqual(mockHistorial);

      consoleSpy.mockRestore();
    });

    it('should get historial with asc sort', async () => {
      service.findAllSorted.mockResolvedValue(mockHistorial as any);

      const result = await controller.getHistorial('asc', mockRequest as any);

      expect(service.findAllSorted).toHaveBeenCalledWith('asc', 1);
      expect(result).toEqual(mockHistorial);
    });

    it('should handle empty historial', async () => {
      service.findAllSorted.mockResolvedValue([]);

      const result = await controller.getHistorial('desc', mockRequest as any);

      expect(result).toEqual([]);
      expect(service.findAllSorted).toHaveBeenCalledWith('desc', 1);
    });

    it('should handle service errors', async () => {
      service.findAllSorted.mockRejectedValue(new Error('Database error'));

      await expect(controller.getHistorial('desc', mockRequest as any)).rejects.toThrow('Database error');
    });
  });

  describe('findPag', () => {
    it('should get paginated results and log message', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.findPag.mockResolvedValue(mockPaginationResponse);

      const result = await controller.findPag(paginacion, 'desc', mockRequest as any);

      expect(consoleSpy).toHaveBeenCalledWith('Obteniendo paginación de historial IMC para usuario test@example.com');
      expect(service.findPag).toHaveBeenCalledWith(paginacion, 'desc', 1);
      expect(result).toEqual(mockPaginationResponse);

      consoleSpy.mockRestore();
    });

    it('should handle different pagination parameters', async () => {
      const paginaciones = [
        { pag: 1, mostrar: 10 },
        { pag: 2, mostrar: 5 },
        { pag: 3, mostrar: 20 },
      ];

      for (const paginacion of paginaciones) {
        service.findPag.mockResolvedValue(mockPaginationResponse);

        const result = await controller.findPag(paginacion, 'asc', mockRequest as any);

        expect(service.findPag).toHaveBeenCalledWith(paginacion, 'asc', 1);
        expect(result).toEqual(mockPaginationResponse);
      }
    });

    it('should handle pagination with different sort orders', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      const sortOrders: ('asc' | 'desc')[] = ['asc', 'desc'];

      for (const sort of sortOrders) {
        service.findPag.mockResolvedValue(mockPaginationResponse);

        const result = await controller.findPag(paginacion, sort, mockRequest as any);

        expect(service.findPag).toHaveBeenCalledWith(paginacion, sort, 1);
        expect(result).toEqual(mockPaginationResponse);
      }
    });

    it('should handle empty pagination results', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 999, mostrar: 5 };
      const emptyResponse = { data: [], total: 0 };

      service.findPag.mockResolvedValue(emptyResponse);

      const result = await controller.findPag(paginacion, 'desc', mockRequest as any);

      expect(result).toEqual(emptyResponse);
      expect(service.findPag).toHaveBeenCalledWith(paginacion, 'desc', 1);
    });

    it('should handle service errors in pagination', async () => {
      const paginacion: PaginacionHistorialImcDto = { pag: 1, mostrar: 5 };
      service.findPag.mockRejectedValue(new Error('Pagination error'));

      await expect(controller.findPag(paginacion, 'desc', mockRequest as any)).rejects.toThrow('Pagination error');
    });
  });

  describe('integration scenarios', () => {
    it('should have all required methods', () => {
      expect(typeof controller.calcular).toBe('function');
      expect(typeof controller.getHistorial).toBe('function');
      expect(typeof controller.findPag).toBe('function');
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