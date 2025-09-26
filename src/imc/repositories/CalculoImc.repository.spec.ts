import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { CalculoImcRepository } from './CalculoImc.repository';
import { CalculoImc } from '../entities/CalculoImc.entity';
import { CreateHistorialImcDto } from '../dto/create-historial-imc.dto';

describe('CalculoImcRepository', () => {
  let repository: CalculoImcRepository;
  let typeormRepo: jest.Mocked<Repository<CalculoImc>>;

  const mockCalculoImc = {
    id: 1,
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date('2023-01-01'),
    user: { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' },
  } as CalculoImc;

  const mockTypeormRepo = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculoImcRepository,
        {
          provide: getRepositoryToken(CalculoImc),
          useValue: mockTypeormRepo,
        },
      ],
    }).compile();

    repository = module.get<CalculoImcRepository>(CalculoImcRepository);
    typeormRepo = module.get<Repository<CalculoImc>>(getRepositoryToken(CalculoImc)) as jest.Mocked<Repository<CalculoImc>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllSorted', () => {
    it('should return sorted calculations for ASC order', async () => {
      const calculations = [mockCalculoImc];
      typeormRepo.find.mockResolvedValue(calculations);

      const result = await repository.findAllSorted('ASC', 1);

      expect(result).toEqual(calculations);
      expect(typeormRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        order: { fecha_calculo: 'ASC' },
      });
    });

    it('should return sorted calculations for DESC order', async () => {
      const calculations = [mockCalculoImc];
      typeormRepo.find.mockResolvedValue(calculations);

      const result = await repository.findAllSorted('DESC', 1);

      expect(result).toEqual(calculations);
      expect(typeormRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        order: { fecha_calculo: 'DESC' },
      });
    });

    it('should return empty array when no calculations found', async () => {
      typeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAllSorted('DESC', 999);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      typeormRepo.find.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.findAllSorted('ASC', 1)).rejects.toThrow(InternalServerErrorException);
      await expect(repository.findAllSorted('ASC', 1)).rejects.toThrow('Error al obtener el historial ordenado (ASC) de IMC. Error: Error: Database connection failed');
    });
  });

  describe('findPag', () => {
    it('should return paginated results correctly', async () => {
      const data = [mockCalculoImc];
      const total = 10;
      typeormRepo.findAndCount.mockResolvedValue([data, total]);

      const result = await repository.findPag(1, 5, 'DESC', 1);

      expect(result).toEqual({ data, total });
      expect(typeormRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        skip: 0,
        take: 5,
        order: { fecha_calculo: 'DESC' },
      });
    });

    it('should calculate skip correctly for different pages', async () => {
      const data = [mockCalculoImc];
      const total = 25;
      typeormRepo.findAndCount.mockResolvedValue([data, total]);

      await repository.findPag(3, 10, 'ASC', 1);

      expect(typeormRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        skip: 20, // (3-1) * 10 = 20
        take: 10,
        order: { fecha_calculo: 'ASC' },
      });
    });

    it('should handle first page', async () => {
      const data = [mockCalculoImc];
      const total = 5;
      typeormRepo.findAndCount.mockResolvedValue([data, total]);

      const result = await repository.findPag(1, 5, 'DESC', 1);

      expect(typeormRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        skip: 0,
        take: 5,
        order: { fecha_calculo: 'DESC' },
      });
    });

    it('should handle large page numbers', async () => {
      typeormRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findPag(100, 5, 'DESC', 1);

      expect(result).toEqual({ data: [], total: 0 });
      expect(typeormRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        skip: 495, // (100-1) * 5
        take: 5,
        order: { fecha_calculo: 'DESC' },
      });
    });

    it('should handle different page sizes', async () => {
      const data = [mockCalculoImc];
      const total = 1;
      typeormRepo.findAndCount.mockResolvedValue([data, total]);

      await repository.findPag(1, 1, 'ASC', 1);

      expect(typeormRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        skip: 0,
        take: 1,
        order: { fecha_calculo: 'ASC' },
      });
    });

    it('should handle database errors', async () => {
      typeormRepo.findAndCount.mockRejectedValue(new Error('Database timeout'));

      await expect(repository.findPag(1, 5, 'DESC', 1)).rejects.toThrow(InternalServerErrorException);
      await expect(repository.findPag(1, 5, 'DESC', 1)).rejects.toThrow('Error al paginar el historial de IMC. Error:Error: Database timeout');
    });
  });

  describe('save', () => {
    const historialDto: CreateHistorialImcDto = {
      altura: 1.75,
      peso: 70,
      imc: 22.86,
      categoria: 'Normal',
      user: { id: 1 } as any,
    };

    it('should save calculation successfully', async () => {
      typeormRepo.save.mockResolvedValue(mockCalculoImc);

      const result = await repository.save(historialDto);

      expect(result).toEqual(mockCalculoImc);
      expect(typeormRepo.save).toHaveBeenCalledWith(historialDto);
    });

    it('should handle save errors', async () => {
      typeormRepo.save.mockRejectedValue(new Error('Constraint violation'));

      await expect(repository.save(historialDto)).rejects.toThrow(InternalServerErrorException);
      await expect(repository.save(historialDto)).rejects.toThrow('Error al crear el historial de IMC. Error:Error: Constraint violation');
    });

    it('should handle foreign key errors', async () => {
      typeormRepo.save.mockRejectedValue(new Error('Foreign key constraint failed'));

      await expect(repository.save(historialDto)).rejects.toThrow(InternalServerErrorException);
    });
  });
});