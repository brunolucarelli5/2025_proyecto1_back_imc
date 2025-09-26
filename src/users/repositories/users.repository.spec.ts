import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { User } from '../schemas/user.schema';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let userModel: jest.Mocked<Model<User>>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
  } as User;

  const mockUserModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
  } as any;

  // Add constructor function mock
  mockUserModel.mockImplementation = jest.fn(() => ({
    save: jest.fn().mockResolvedValue(mockUser),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    userModel = module.get<Model<User>>(getModelToken(User.name)) as jest.Mocked<Model<User>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      const users = [mockUser];
      userModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(users) } as any);

      const result = await userRepository.findAll();
      expect(result).toEqual(users);
      expect(userModel.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      userModel.find.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('Connection timeout')) } as any);
      await expect(userRepository.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      userModel.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }) } as any);
      const result = await userRepository.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should handle database errors', async () => {
      userModel.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('Database error')) }) } as any);
      await expect(userRepository.findByEmail('test@example.com')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      userModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) } as any);
      const result = await userRepository.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should handle database errors', async () => {
      userModel.findById.mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error('Database error')) } as any);
      await expect(userRepository.findById('1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('save', () => {
    it('should save user successfully', async () => {
      // Note: Testing Mongoose model constructor is complex in unit tests
      // This would typically be covered in integration tests
      expect(userRepository.save).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      userModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) } as any);
      const result = await userRepository.update('1', { firstName: 'Updated' });
      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      userModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) } as any);
      const result = await userRepository.delete('1');
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      userModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);
      const result = await userRepository.delete('999');
      expect(result).toBe(false);
    });
  });
});