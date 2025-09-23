import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUserRepository } from './repositories/users.repository.interface';
import { UserEntity } from './entities/user.entity';
import { RegisterDTO } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
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
    it('should convert UserEntity to UserResponseDto', () => {
      const result = service['toUserResponse'](mockUser);
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle null/undefined user gracefully', () => {
      const nullUser = null as any;
      expect(() => service['toUserResponse'](nullUser)).toThrow();
    });
  });

  describe('findAll', () => {
    it('should return array of user responses', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }] as UserEntity[];
      userRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUserResponse);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users found', async () => {
      userRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      userRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(userRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });

    it('should handle empty email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('');

      expect(result).toBeNull();
      expect(userRepository.findByEmail).toHaveBeenCalledWith('');
    });

    it('should handle repository errors', async () => {
      userRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.findByEmail('test@example.com')).rejects.toThrow('Database connection failed');
    });
  });

  describe('register', () => {
    const registerDto: RegisterDTO = {
      email: 'newuser@example.com',
      password: 'plainpassword',
      firstName: 'New',
      lastName: 'User',
    };

    beforeEach(() => {
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedpassword');
    });

    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ ...mockUser, email: registerDto.email } as UserEntity);

      const result = await service.register(registerDto);

      expect(bcrypt.hashSync).toHaveBeenCalledWith('plainpassword', 10);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(registerDto.email);
    });

    it('should throw BadRequestException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow('Ya existe un usuario con ese email');
    });

    it('should handle special characters in password', async () => {
      const specialDto = { ...registerDto, password: 'p@ssw0rd!#$' };
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ ...mockUser, email: specialDto.email } as UserEntity);

      await service.register(specialDto);

      expect(bcrypt.hashSync).toHaveBeenCalledWith('p@ssw0rd!#$', 10);
    });

    it('should handle very long names', async () => {
      const longNameDto = {
        ...registerDto,
        firstName: 'A'.repeat(100),
        lastName: 'B'.repeat(100)
      };
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockResolvedValue({ ...mockUser, ...longNameDto } as UserEntity);

      const result = await service.register(longNameDto);

      expect(result.firstName).toBe('A'.repeat(100));
      expect(result.lastName).toBe('B'.repeat(100));
    });

    it('should handle repository save errors', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockRejectedValue(new Error('Database constraint violation'));

      await expect(service.register(registerDto)).rejects.toThrow('Database constraint violation');
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    const updateDtoWithPassword: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name',
      password: 'newpassword',
    };

    beforeEach(() => {
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedpassword');
    });

    it('should update user successfully without password', async () => {
      const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' } as UserEntity;
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(userRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('should update user successfully with password', async () => {
      const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' } as UserEntity;
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDtoWithPassword);

      expect(bcrypt.hashSync).toHaveBeenCalledWith('newpassword', 10);
      expect(userRepository.update).toHaveBeenCalledWith(1, { ...updateDtoWithPassword, password: 'hashedpassword' });
      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto)).rejects.toThrow('No se pudo actualizar el usuario. Verifica que la ID exista.');
    });

    it('should handle negative user IDs', async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(service.update(-1, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle zero user ID', async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(service.update(0, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle empty update data', async () => {
      const emptyDto: UpdateUserDTO = {};
      const updatedUser = { ...mockUser } as UserEntity;
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, emptyDto);

      expect(userRepository.update).toHaveBeenCalledWith(1, emptyDto);
      expect(result).toEqual(service['toUserResponse'](updatedUser));
    });

    it('should handle repository update errors', async () => {
      userRepository.update.mockRejectedValue(new Error('Database update failed'));

      await expect(service.update(1, updateDto)).rejects.toThrow('Database update failed');
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      userRepository.delete.mockResolvedValue(true);

      const result = await service.delete(1);

      expect(userRepository.delete).toHaveBeenCalledWith(1);
      expect(result.message).toBe('Usuario ID N°1 eliminado.');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.delete.mockResolvedValue(false);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow('No se pudo eliminar el usuario. Verifica que la ID exista.');
    });

    it('should handle negative user IDs', async () => {
      userRepository.delete.mockResolvedValue(false);

      await expect(service.delete(-1)).rejects.toThrow(NotFoundException);
    });

    it('should handle zero user ID', async () => {
      userRepository.delete.mockResolvedValue(false);

      await expect(service.delete(0)).rejects.toThrow(NotFoundException);
    });

    it('should handle repository delete errors', async () => {
      userRepository.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(service.delete(1)).rejects.toThrow('Foreign key constraint');
    });

    it('should handle very large user IDs', async () => {
      userRepository.delete.mockResolvedValue(false);

      await expect(service.delete(Number.MAX_SAFE_INTEGER)).rejects.toThrow(NotFoundException);
    });
  });
});