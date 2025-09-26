import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUserRepository } from './repositories/users.repository.interface';
import { UserEntity } from './entities/user.entity';
import { RegisterDTO } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import * as passwordHelper from './helpers/validatePasswordStrength';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
}));

jest.mock('./helpers/validatePasswordStrength', () => ({
  validatePasswordStrength: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: [],
  } as unknown as UserEntity;

  const mockUserResponse: UserResponseDto = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockUserRepository = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<IUserRepository>('IUserRepository') as jest.Mocked<IUserRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toUserResponse', () => {
    it('should convert UserEntity to UserResponseDto and handle null gracefully', () => {
      const result = service['toUserResponse'](mockUser);
      expect(result).toEqual(mockUserResponse);

      const nullUser = null as any;
      expect(() => service['toUserResponse'](nullUser)).toThrow();
    });
  });

  describe('findAll', () => {
    it('should return array of user responses and handle empty results', async () => {
      // Test with users
      const users = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }] as UserEntity[];
      userRepository.findAll.mockResolvedValue(users);

      let result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUserResponse);

      // Test empty array
      userRepository.findAll.mockResolvedValue([]);
      result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      userRepository.findAll.mockRejectedValue(new Error('Database error'));
      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found and null when not found', async () => {
      // Found case
      userRepository.findByEmail.mockResolvedValue(mockUser);
      let result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);

      // Not found case
      userRepository.findByEmail.mockResolvedValue(null);
      result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });

    it('should handle edge cases and repository errors', async () => {
      // Empty email
      userRepository.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('');
      expect(result).toBeNull();

      // Repository error
      userRepository.findByEmail.mockRejectedValue(new Error('Database error'));
      await expect(service.findByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('register', () => {
    const registerDto: RegisterDTO = {
      email: 'new@example.com',
      password: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      (passwordHelper.validatePasswordStrength as jest.Mock).mockImplementation(() => {});
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedNewPassword');
      userRepository.save.mockResolvedValue({ ...mockUser, email: 'new@example.com' } as UserEntity);

      const result = await service.register(registerDto);

      expect(result.email).toBe('new@example.com');
      expect(passwordHelper.validatePasswordStrength).toHaveBeenCalledWith(
        'NewPassword123!',
        'new@example.com',
        'New',
        'User'
      );
      expect(bcrypt.hashSync).toHaveBeenCalledWith('NewPassword123!', 10);
    });

    it('should throw BadRequestException when email exists or validation fails', async () => {
      // Email exists
      userRepository.findByEmail.mockResolvedValue(mockUser);
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);

      // Password validation fails
      userRepository.findByEmail.mockResolvedValue(null);
      (passwordHelper.validatePasswordStrength as jest.Mock).mockImplementation(() => {
        throw new BadRequestException('Weak password');
      });
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user without password', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ ...mockUser, ...updateDto } as UserEntity);

      const result = await service.update(1, updateDto);
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('should update user with password', async () => {
      const updateWithPassword = { ...updateDto, password: 'NewPass123!' };
      userRepository.findById.mockResolvedValue(mockUser);
      (passwordHelper.validatePasswordStrength as jest.Mock).mockImplementation(() => {});
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedNewPassword');
      userRepository.update.mockResolvedValue({ ...mockUser, ...updateWithPassword } as UserEntity);

      const result = await service.update(1, updateWithPassword);
      expect(passwordHelper.validatePasswordStrength).toHaveBeenCalled();
      expect(bcrypt.hashSync).toHaveBeenCalledWith('NewPass123!', 10);
    });

    it('should handle edge cases and errors', async () => {
      // User not found
      userRepository.findById.mockResolvedValue(null);
      userRepository.update.mockResolvedValue(null);
      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);

      // Repository update returns null
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(null);
      await expect(service.update(1, updateDto)).rejects.toThrow(NotFoundException);

      // Repository error
      userRepository.update.mockRejectedValue(new Error('Update failed'));
      await expect(service.update(1, updateDto)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      userRepository.delete.mockResolvedValue(true);

      const result = await service.delete(1);
      expect(result).toEqual({ message: 'Usuario ID N°1 eliminado.' });
      expect(userRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should handle user not found and edge cases', async () => {
      // User not found
      userRepository.delete.mockResolvedValue(false);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);

      // Repository error
      userRepository.delete.mockRejectedValue(new Error('Delete failed'));
      await expect(service.delete(1)).rejects.toThrow('Delete failed');
    });
  });
});