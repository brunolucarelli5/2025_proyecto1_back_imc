import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { UserEntity } from '../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeormRepository: Repository<UserEntity>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: []
  } as unknown as UserEntity;

  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeormRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      const expectedUsers = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }];
      mockRepository.find.mockResolvedValue(expectedUsers);

      const result = await repository.findAll();

      expect(result).toEqual(expectedUsers);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      expect(mockRepository.find).toHaveBeenCalledWith();
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const errorMessage = 'Database connection error';
      mockRepository.find.mockRejectedValue(new InternalServerErrorException('Error al obtener todos los usuarios. ' + errorMessage));

      await expect(repository.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    it('should handle email case sensitivity', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'TEST@EXAMPLE.COM' });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const errorMessage = 'Database query error';
      mockRepository.findOneBy.mockRejectedValue(new Error(errorMessage));

      await expect(repository.findByEmail('test@example.com')).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(repository.findByEmail('test@example.com')).rejects.toThrow(
        'Error al buscar usuario por email'
      );
    });
  });

  describe('save', () => {
    it('should save user successfully', async () => {
      const newUser = new UserEntity();
      newUser.email = 'new@example.com';
      newUser.firstName = 'New';
      newUser.lastName = 'User';

      mockRepository.save.mockResolvedValue({ ...newUser, id: 2 });

      const result = await repository.save(newUser);

      expect(result).toEqual({ ...newUser, id: 2 });
      expect(mockRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should handle saving existing user (update)', async () => {
      const existingUser = { ...mockUser };
      existingUser.firstName = 'Updated';

      mockRepository.save.mockResolvedValue(existingUser);

      const result = await repository.save(existingUser as unknown as UserEntity);

      expect(result).toEqual(existingUser);
      expect(mockRepository.save).toHaveBeenCalledWith(existingUser);
    });

    it('should throw InternalServerErrorException on save error', async () => {
      const newUser = new UserEntity();
      const errorMessage = 'Unique constraint violation';
      mockRepository.save.mockRejectedValue(new Error(errorMessage));

      await expect(repository.save(newUser)).rejects.toThrow(InternalServerErrorException);
      await expect(repository.save(newUser)).rejects.toThrow('Error al guardar el usuario');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateData };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOneBy.mockResolvedValue(updatedUser);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when user to update is not found', async () => {
      const updateData = { firstName: 'Updated' };

      mockRepository.update.mockResolvedValue({ affected: 0 });
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.update(999, updateData);

      expect(result).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(999, updateData);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });

    it('should handle partial updates', async () => {
      const partialUpdates = [
        { email: 'newemail@example.com' },
        { password: 'newpassword' },
        { firstName: 'NewFirst' },
        { lastName: 'NewLast' },
        { firstName: 'New', lastName: 'User' }
      ];

      for (const updateData of partialUpdates) {
        const updatedUser = { ...mockUser, ...updateData };
        mockRepository.update.mockResolvedValue({ affected: 1 });
        mockRepository.findOneBy.mockResolvedValue(updatedUser);

        const result = await repository.update(1, updateData);

        expect(result).toEqual(updatedUser);
        expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      }
    });

    it('should throw InternalServerErrorException on update error', async () => {
      const updateData = { firstName: 'Updated' };
      const errorMessage = 'Update constraint violation';
      mockRepository.update.mockRejectedValue(new Error(errorMessage));

      await expect(repository.update(1, updateData)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(repository.update(1, updateData)).rejects.toThrow(
        'Error al actualizar el usuario'
      );
    });
  });

  describe('delete', () => {
    it('should delete user successfully when user exists', async () => {
      const deleteResult: DeleteResult = { affected: 1, raw: {} };
      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await repository.delete(1);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return false when user does not exist', async () => {
      const deleteResult: DeleteResult = { affected: 0, raw: {} };
      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await repository.delete(999);

      expect(result).toBe(false);
      expect(mockRepository.delete).toHaveBeenCalledWith(999);
    });

    it('should handle multiple affected rows (edge case)', async () => {
      const deleteResult: DeleteResult = { affected: 2, raw: {} };
      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await repository.delete(1);

      expect(result).toBe(true);
    });

    it('should handle undefined affected property', async () => {
      const deleteResult: DeleteResult = { affected: undefined, raw: {} };
      mockRepository.delete.mockResolvedValue(deleteResult);

      const result = await repository.delete(1);

      expect(result).toBe(true);
    });

    it('should throw InternalServerErrorException on delete error', async () => {
      const errorMessage = 'Foreign key constraint violation';
      mockRepository.delete.mockRejectedValue(new Error(errorMessage));

      await expect(repository.delete(1)).rejects.toThrow(InternalServerErrorException);
      await expect(repository.delete(1)).rejects.toThrow('Error al eliminar el usuario');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null/undefined parameters gracefully', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.findByEmail('');
      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: '' });
    });

    it('should maintain data integrity on concurrent operations', async () => {
      // Simulate concurrent save operations
      const user1 = { ...mockUser, email: 'user1@example.com' } as unknown as UserEntity;
      const user2 = { ...mockUser, email: 'user2@example.com' } as unknown as UserEntity;

      mockRepository.save
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const [result1, result2] = await Promise.all([
        repository.save(user1),
        repository.save(user2)
      ]);

      expect(result1).toEqual(user1);
      expect(result2).toEqual(user2);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});