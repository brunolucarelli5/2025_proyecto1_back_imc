import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { CalculoImcRepository } from './CalculoImc.repository';
import { CalculoImc } from '../entities/CalculoImc.entity';
import { CreateHistorialImcDto } from '../dto/create-historial-imc.dto';
import { UserEntity } from '../../users/entities/user.entity';

describe('CalculoImcRepository', () => {
  let repository: CalculoImcRepository;
  let typeormRepository: Repository<CalculoImc>;

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

  const mockRepository = {
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
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CalculoImcRepository>(CalculoImcRepository);
    typeormRepository = module.get<Repository<CalculoImc>>(getRepositoryToken(CalculoImc));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllSorted', () => {
    it('should return sorted results in ASC order', async () => {
      const expectedResults = [mockCalculoImc];
      mockRepository.find.mockResolvedValue(expectedResults);

      const result = await repository.findAllSorted('ASC', 1);

      expect(result).toEqual(expectedResults);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        order: { fecha_calculo: 'ASC' },
      });
    });

    it('should return sorted results in DESC order', async () => {
      const expectedResults = [mockCalculoImc];
      mockRepository.find.mockResolvedValue(expectedResults);

      const result = await repository.findAllSorted('DESC', 1);

      expect(result).toEqual(expectedResults);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        order: { fecha_calculo: 'DESC' },
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(repository.findAllSorted('ASC', 1)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(repository.findAllSorted('ASC', 1)).rejects.toThrow(
        'Error al obtener el historial ordenado (ASC) de IMC'
      );
    });
  });

  describe('findPag', () => {
    it('should return paginated results with correct structure', async () => {
      const mockData = [mockCalculoImc];
      const mockTotal = 10;
      mockRepository.findAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await repository.findPag(2, 5, 'DESC', 1);

      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
        order: { fecha_calculo: 'DESC' },
      });
    });

    it('should calculate correct skip value for different pages', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      // Page 1
      await repository.findPag(1, 10, 'ASC', 1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 })
      );

      // Page 3
      await repository.findPag(3, 10, 'ASC', 1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20 })
      );
    });

    it('should handle different sort orders', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await repository.findPag(1, 5, 'ASC', 1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { fecha_calculo: 'ASC' } })
      );

      await repository.findPag(1, 5, 'DESC', 1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { fecha_calculo: 'DESC' } })
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockRepository.findAndCount.mockRejectedValue(new Error('Database error'));

      await expect(repository.findPag(1, 5, 'ASC', 1)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(repository.findPag(1, 5, 'ASC', 1)).rejects.toThrow(
        'Error al paginar el historial de IMC'
      );
    });
  });

  describe('save', () => {
    it('should save historial successfully', async () => {
      const createHistorialDto: CreateHistorialImcDto = {
        altura: 1.75,
        peso: 70,
        imc: 22.86,
        categoria: 'Normal',
        user: mockUser,
      };

      mockRepository.save.mockResolvedValue(mockCalculoImc);

      const result = await repository.save(createHistorialDto);

      expect(result).toEqual(mockCalculoImc);
      expect(mockRepository.save).toHaveBeenCalledWith(createHistorialDto);
    });

    it('should throw InternalServerErrorException on save error', async () => {
      const createHistorialDto: CreateHistorialImcDto = {
        altura: 1.75,
        peso: 70,
        imc: 22.86,
        categoria: 'Normal',
        user: mockUser,
      };

      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(createHistorialDto)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(repository.save(createHistorialDto)).rejects.toThrow(
        'Error al crear el historial de IMC'
      );
    });
  });
});