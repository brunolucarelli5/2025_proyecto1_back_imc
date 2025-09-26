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
    it('should return all users successfully and handle empty results', async () => {
      // Test with users
      const users = [mockUser, { ...mockUser, id: 2, email: 'user2@example.com' }] as UserEntity[];
      typeormRepo.find.mockResolvedValue(users);

      let result = await userRepository.findAll();
      expect(result).toEqual(users);
      expect(typeormRepo.find).toHaveBeenCalledTimes(1);

      // Test empty array
      typeormRepo.find.mockResolvedValue([]);
      result = await userRepository.findAll();
      expect(result).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      typeormRepo.find.mockRejectedValue(new Error('Connection timeout'));
      await expect(userRepository.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found and null when not found', async () => {
      // Found case
      typeormRepo.findOneBy.mockResolvedValue(mockUser);
      let result = await userRepository.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });

      // Not found case
      typeormRepo.findOneBy.mockResolvedValue(null);
      result = await userRepository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      typeormRepo.findOneBy.mockRejectedValue(new Error('Database connection failed'));
      await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findById', () => {
    it('should return user when found and null when not found', async () => {
      // Found case
      typeormRepo.findOneBy.mockResolvedValue(mockUser);
      let result = await userRepository.findById(1);
      expect(result).toEqual(mockUser);
      expect(typeormRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });

      // Not found case
      typeormRepo.findOneBy.mockResolvedValue(null);
      result = await userRepository.findById(999);
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      typeormRepo.findOneBy.mockRejectedValue(new Error('Database connection failed'));
      await expect(userRepository.findById(1)).rejects.toThrow(InternalServerErrorException);
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

    it('should handle database errors', async () => {
      const newUser = { ...mockUser, id: undefined } as any;
      typeormRepo.save.mockRejectedValue(new Error('Database constraint violation'));
      await expect(userRepository.save(newUser)).rejects.toThrow(InternalServerErrorException);
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
    });

    it('should return null when user not found for update and handle errors', async () => {
      const updateData = { firstName: 'Updated' };

      // User not found - update succeeds but findOneBy returns null
      typeormRepo.update.mockResolvedValue({ affected: 1 } as any);
      typeormRepo.findOneBy.mockResolvedValue(null);
      let result = await userRepository.update(999, updateData);
      expect(result).toBeNull();

      // Database error
      typeormRepo.update.mockRejectedValue(new Error('Update failed'));
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

    it('should return false when user not found for deletion and handle errors', async () => {
      // User not found
      typeormRepo.delete.mockResolvedValue({ affected: 0 } as any);
      let result = await userRepository.delete(999);
      expect(result).toBe(false);

      // Database error
      typeormRepo.delete.mockRejectedValue(new Error('Delete failed'));
      await expect(userRepository.delete(1)).rejects.toThrow(InternalServerErrorException);
    });
  });
});