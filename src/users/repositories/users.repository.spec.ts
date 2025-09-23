import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { UserEntity } from '../entities/user.entity';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let typeormRepo: jest.Mocked<Repository<UserEntity>>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: [],
  } as unknown as UserEntity;

  const mockTypeormRepo = {
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
          useValue: mockTypeormRepo,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    typeormRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity)) as jest.Mocked<Repository<UserEntity>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'user2@example.com' }] as UserEntity[];
      typeormRepo.find.mockResolvedValue(users);

      const result = await userRepository.findAll();

      expect(result).toEqual(users);
      expect(typeormRepo.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users exist', async () => {
      typeormRepo.find.mockResolvedValue([]);

      const result = await userRepository.findAll();

      expect(result).toEqual([]);
      expect(typeormRepo.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection errors', async () => {
      typeormRepo.find.mockRejectedValue(new Error('Connection timeout'));

      await expect(userRepository.findAll()).rejects.toThrow(InternalServerErrorException);
      await expect(userRepository.findAll()).rejects.toThrow('Error al obtener todos los usuarios. Error: Connection timeout');
    });

    it('should handle database query errors', async () => {
      typeormRepo.find.mockRejectedValue(new Error('Table does not exist'));

      await expect(userRepository.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      typeormRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user not found', async () => {
      typeormRepo.findOneBy.mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    it('should handle empty email string', async () => {
      typeormRepo.findOneBy.mockResolvedValue(null);

      const result = await userRepository.findByEmail('');

      expect(result).toBeNull();
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ email: '' });
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+label@example.com';
      typeormRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail(specialEmail);

      expect(result).toEqual(mockUser);
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ email: specialEmail });
    });

    it('should handle database errors', async () => {
      typeormRepo.findOneBy.mockRejectedValue(new Error('Database connection lost'));

      await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow(InternalServerErrorException);
      await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow('Error al buscar usuario por email. Error: Database connection lost');
    });
  });

  describe('save', () => {
    it('should save user successfully', async () => {
      const newUser = { ...mockUser, id: undefined } as any;
      typeormRepo.save.mockResolvedValue(mockUser);

      const result = await userRepository.save(newUser);

      expect(result).toEqual(mockUser);
      expect(typeormRepo.save).toHaveBeenCalledWith(newUser);
    });

    it('should handle unique constraint violations', async () => {
      const newUser = { ...mockUser, id: undefined } as any;
      typeormRepo.save.mockRejectedValue(new Error('UNIQUE constraint failed: users.email'));

      await expect(userRepository.save(newUser)).rejects.toThrow(InternalServerErrorException);
      await expect(userRepository.save(newUser)).rejects.toThrow('Error al guardar el usuario. Error: UNIQUE constraint failed: users.email');
    });

    it('should handle validation errors', async () => {
      const invalidUser = { ...mockUser, email: 'invalid-email', id: undefined } as any;
      typeormRepo.save.mockRejectedValue(new Error('CHECK constraint failed'));

      await expect(userRepository.save(invalidUser)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle null/undefined user', async () => {
      typeormRepo.save.mockRejectedValue(new Error('Cannot save null entity'));

      await expect(userRepository.save(null as any)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateData } as UserEntity;

      typeormRepo.update.mockResolvedValue({ affected: 1 } as any);
      typeormRepo.findOneBy.mockResolvedValue(updatedUser);

      const result = await userRepository.update(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(typeormRepo.update).toHaveBeenCalledWith(1, updateData);
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when user not found for update', async () => {
      const updateData = { firstName: 'Updated' };

      typeormRepo.update.mockResolvedValue({ affected: 0 } as any);
      typeormRepo.findOneBy.mockResolvedValue(null);

      const result = await userRepository.update(999, updateData);

      expect(result).toBeNull();
      expect(typeormRepo.update).toHaveBeenCalledWith(999, updateData);
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });

    it('should handle negative user IDs', async () => {
      const updateData = { firstName: 'Updated' };

      typeormRepo.update.mockResolvedValue({ affected: 0 } as any);
      typeormRepo.findOneBy.mockResolvedValue(null);

      const result = await userRepository.update(-1, updateData);

      expect(result).toBeNull();
    });

    it('should handle empty update data', async () => {
      typeormRepo.update.mockResolvedValue({ affected: 1 } as any);
      typeormRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await userRepository.update(1, {});

      expect(result).toEqual(mockUser);
      expect(typeormRepo.update).toHaveBeenCalledWith(1, {});
    });

    it('should handle database update errors', async () => {
      const updateData = { firstName: 'Updated' };
      typeormRepo.update.mockRejectedValue(new Error('Foreign key constraint failed'));

      await expect(userRepository.update(1, updateData)).rejects.toThrow(InternalServerErrorException);
      await expect(userRepository.update(1, updateData)).rejects.toThrow('Error al actualizar el usuario. Error: Foreign key constraint failed');
    });

    it('should handle find errors after update', async () => {
      const updateData = { firstName: 'Updated' };

      typeormRepo.update.mockResolvedValue({ affected: 1 } as any);
      typeormRepo.findOneBy.mockRejectedValue(new Error('Connection lost during find'));

      await expect(userRepository.update(1, updateData)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await userRepository.delete(1);

      expect(result).toBe(true);
      expect(typeormRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should return false when user not found for deletion', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await userRepository.delete(999);

      expect(result).toBe(false);
      expect(typeormRepo.delete).toHaveBeenCalledWith(999);
    });

    it('should handle negative user IDs', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await userRepository.delete(-1);

      expect(result).toBe(false);
      expect(typeormRepo.delete).toHaveBeenCalledWith(-1);
    });

    it('should handle zero user ID', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await userRepository.delete(0);

      expect(result).toBe(false);
    });

    it('should handle very large user IDs', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await userRepository.delete(Number.MAX_SAFE_INTEGER);

      expect(result).toBe(false);
    });

    it('should handle foreign key constraint errors', async () => {
      typeormRepo.delete.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      await expect(userRepository.delete(1)).rejects.toThrow(InternalServerErrorException);
      await expect(userRepository.delete(1)).rejects.toThrow('Error al eliminar el usuario. Error: FOREIGN KEY constraint failed');
    });

    it('should handle database connection errors during delete', async () => {
      typeormRepo.delete.mockRejectedValue(new Error('Connection timeout'));

      await expect(userRepository.delete(1)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle multiple affected rows (edge case)', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: 2 } as any);

      const result = await userRepository.delete(1);

      expect(result).toBe(true);
    });

    it('should handle undefined affected property', async () => {
      typeormRepo.delete.mockResolvedValue({ affected: undefined } as any);

      const result = await userRepository.delete(1);

      expect(result).toBe(true); // undefined !== 0 evaluates to true
    });
  });
});