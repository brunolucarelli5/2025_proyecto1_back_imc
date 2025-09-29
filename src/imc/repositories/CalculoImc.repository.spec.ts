import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CalculoImcRepository } from './CalculoImc.repository';
import { CalculoImc } from '../schemas/calculo-imc.schema';
import { CreateHistorialImcDto } from '../dto/create-historial-imc.dto';

describe('CalculoImcRepository', () => {
  let repository: CalculoImcRepository;
  let imcModel: any;

  const mockCalculoImc = {
    id: '1',
    altura: 1.75,
    peso: 70,
    imc: 22.86,
    categoria: 'Normal',
    fecha_calculo: new Date('2023-01-01'),
    user: { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', password: 'hashed' },
  } as unknown as CalculoImc;

  const mockInstance = {
    save: jest.fn(),
  };

  const mockImcModel = jest.fn().mockImplementation(() => mockInstance);
  Object.assign(mockImcModel, {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    countDocuments: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculoImcRepository,
        {
          provide: getModelToken(CalculoImc.name),
          useValue: mockImcModel,
        },
      ],
    }).compile();

    repository = module.get<CalculoImcRepository>(CalculoImcRepository);
    imcModel = module.get(getModelToken(CalculoImc.name)) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByIdConUsuario', () => {
    it('should return calculation with user data when found', async () => {
      imcModel.exec.mockResolvedValue(mockCalculoImc);

      const result = await repository.findByIdConUsuario('1');

      expect(result).toEqual(mockCalculoImc);
      expect(imcModel.findById).toHaveBeenCalledWith('1');
      expect(imcModel.populate).toHaveBeenCalledWith('user');
    });

    it('should throw NotFoundException when calculation not found', async () => {
      imcModel.exec.mockResolvedValue(null);

      await expect(repository.findByIdConUsuario('999')).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors', async () => {
      imcModel.exec.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.findByIdConUsuario('1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAllSorted', () => {
    it('should return sorted calculations for ASC order', async () => {
      const calculations = [mockCalculoImc];
      imcModel.exec.mockResolvedValue(calculations);

      const result = await repository.findAllSorted('ASC', '1');

      expect(result).toEqual(calculations);
      expect(imcModel.find).toHaveBeenCalledWith({ user: '1' });
      expect(imcModel.populate).toHaveBeenCalledWith('user');
      expect(imcModel.sort).toHaveBeenCalledWith({ fecha_calculo: 1 });
    });

    it('should return sorted calculations for DESC order', async () => {
      const calculations = [mockCalculoImc];
      imcModel.exec.mockResolvedValue(calculations);

      const result = await repository.findAllSorted('DESC', '1');

      expect(result).toEqual(calculations);
      expect(imcModel.find).toHaveBeenCalledWith({ user: '1' });
      expect(imcModel.populate).toHaveBeenCalledWith('user');
      expect(imcModel.sort).toHaveBeenCalledWith({ fecha_calculo: -1 });
    });

    it('should return empty array when no calculations found', async () => {
      imcModel.exec.mockResolvedValue([]);

      const result = await repository.findAllSorted('DESC', '999');

      expect(result).toEqual([]);
    });

  });

  describe('findPag', () => {
    it('should return paginated results correctly', async () => {
      const data = [mockCalculoImc];
      const total = 10;

      // Mock Promise.all result
      const execMock = jest.fn();
      execMock.mockResolvedValueOnce(data).mockResolvedValueOnce(total);
      imcModel.exec = execMock;

      const result = await repository.findPag(1, 5, 'DESC', '1');

      expect(result).toEqual({ data, total });
      expect(imcModel.find).toHaveBeenCalledWith({ user: '1' });
      expect(imcModel.populate).toHaveBeenCalledWith('user');
      expect(imcModel.sort).toHaveBeenCalledWith({ fecha_calculo: -1 });
      expect(imcModel.skip).toHaveBeenCalledWith(0);
      expect(imcModel.limit).toHaveBeenCalledWith(5);
    });

    it('should calculate skip correctly for different pages', async () => {
      const data = [mockCalculoImc];
      const total = 25;

      const execMock = jest.fn();
      execMock.mockResolvedValueOnce(data).mockResolvedValueOnce(total);
      imcModel.exec = execMock;

      await repository.findPag(3, 10, 'ASC', '1');

      expect(imcModel.find).toHaveBeenCalledWith({ user: '1' });
      expect(imcModel.sort).toHaveBeenCalledWith({ fecha_calculo: 1 });
      expect(imcModel.skip).toHaveBeenCalledWith(20); // (3-1) * 10 = 20
      expect(imcModel.limit).toHaveBeenCalledWith(10);
    });

    it('should handle first page', async () => {
      const data = [mockCalculoImc];
      const total = 5;

      const execMock = jest.fn();
      execMock.mockResolvedValueOnce(data).mockResolvedValueOnce(total);
      imcModel.exec = execMock;

      const result = await repository.findPag(1, 5, 'DESC', '1');

      expect(imcModel.skip).toHaveBeenCalledWith(0);
      expect(imcModel.limit).toHaveBeenCalledWith(5);
    });

    it('should handle large page numbers', async () => {
      const execMock = jest.fn();
      execMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
      imcModel.exec = execMock;

      const result = await repository.findPag(100, 5, 'DESC', '1');

      expect(result).toEqual({ data: [], total: 0 });
      expect(imcModel.skip).toHaveBeenCalledWith(495); // (100-1) * 5
      expect(imcModel.limit).toHaveBeenCalledWith(5);
    });

    it('should handle different page sizes', async () => {
      const data = [mockCalculoImc];
      const total = 1;

      const execMock = jest.fn();
      execMock.mockResolvedValueOnce(data).mockResolvedValueOnce(total);
      imcModel.exec = execMock;

      await repository.findPag(1, 1, 'ASC', '1');

      expect(imcModel.skip).toHaveBeenCalledWith(0);
      expect(imcModel.limit).toHaveBeenCalledWith(1);
    });

    it('should handle database errors', async () => {
      imcModel.exec.mockRejectedValue(new Error('Database timeout'));

      await expect(repository.findPag(1, 5, 'DESC', '1')).rejects.toThrow(InternalServerErrorException);
      await expect(repository.findPag(1, 5, 'DESC', '1')).rejects.toThrow('Error al paginar historial de IMC: Error: Database timeout');
    });
  });

  describe('save', () => {
    const historialDto: CreateHistorialImcDto = {
      altura: 1.75,
      peso: 70,
      imc: 22.86,
      categoria: 'Normal',
      user: '1',
      fecha_calculo: new Date(),
    };

    it('should save calculation successfully', async () => {
      mockInstance.save.mockResolvedValue(mockCalculoImc);

      const result = await repository.save(historialDto);

      expect(result).toEqual(mockCalculoImc);
      expect(mockImcModel).toHaveBeenCalledWith(historialDto);
      expect(mockInstance.save).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      mockInstance.save.mockRejectedValue(new Error('Constraint violation'));

      await expect(repository.save(historialDto)).rejects.toThrow(InternalServerErrorException);
      await expect(repository.save(historialDto)).rejects.toThrow('Error al guardar cálculo IMC: Error: Constraint violation');
    });

    it('should handle foreign key errors', async () => {
      mockInstance.save.mockRejectedValue(new Error('Foreign key constraint failed'));

      await expect(repository.save(historialDto)).rejects.toThrow(InternalServerErrorException);
    });
  });
});