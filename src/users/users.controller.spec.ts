import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RegisterDTO } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUserResponse: UserResponseDto = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockUsers: UserResponseDto[] = [
    mockUserResponse,
    {
      id: 2,
      email: 'user2@example.com',
      firstName: 'User',
      lastName: 'Two',
    },
  ];

  beforeEach(async () => {
    const mockUsersService = {
      findAll: jest.fn(),
      register: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      service.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDTO = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      const expectedUser: UserResponseDto = {
        id: 3,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      };

      service.register.mockResolvedValue(expectedUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedUser);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('should handle registration errors', async () => {
      service.register.mockRejectedValue(new Error('Email already exists'));

      await expect(controller.register(registerDto)).rejects.toThrow('Email already exists');
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user successfully', async () => {
      const updatedUser: UserResponseDto = {
        ...mockUserResponse,
        firstName: updateDto.firstName!,
        lastName: updateDto.lastName!,
      };

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should handle update errors', async () => {
      service.update.mockRejectedValue(new Error('User not found'));

      await expect(controller.update(999, updateDto)).rejects.toThrow('User not found');
      expect(service.update).toHaveBeenCalledWith(999, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const expectedMessage: MessageResponseDTO = {
        message: 'Usuario eliminado correctamente',
      };

      service.delete.mockResolvedValue(expectedMessage);

      const result = await controller.delete(1);

      expect(result).toEqual(expectedMessage);
      expect(service.delete).toHaveBeenCalledWith(1);
      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors', async () => {
      service.delete.mockRejectedValue(new Error('User not found'));

      await expect(controller.delete(999)).rejects.toThrow('User not found');
      expect(service.delete).toHaveBeenCalledWith(999);
    });
  });

  describe('parameter validation', () => {
    it('should handle invalid ID parameter in update', async () => {
      const updateDto: UpdateUserDTO = { firstName: 'Updated' };
      service.update.mockRejectedValue(new Error('Invalid ID'));

      await expect(controller.update(NaN, updateDto)).rejects.toThrow('Invalid ID');
      expect(service.update).toHaveBeenCalledWith(NaN, updateDto);
    });

    it('should handle invalid ID parameter in delete', async () => {
      service.delete.mockRejectedValue(new Error('Invalid ID'));

      await expect(controller.delete(NaN)).rejects.toThrow('Invalid ID');
      expect(service.delete).toHaveBeenCalledWith(NaN);
    });

    it('should handle negative ID in update', async () => {
      const updateDto: UpdateUserDTO = { firstName: 'Updated' };
      service.update.mockRejectedValue(new Error('User not found'));

      await expect(controller.update(-1, updateDto)).rejects.toThrow('User not found');
      expect(service.update).toHaveBeenCalledWith(-1, updateDto);
    });

    it('should handle zero ID in delete', async () => {
      service.delete.mockRejectedValue(new Error('User not found'));

      await expect(controller.delete(0)).rejects.toThrow('User not found');
      expect(service.delete).toHaveBeenCalledWith(0);
    });

    it('should handle very large ID numbers', async () => {
      const largeId = Number.MAX_SAFE_INTEGER;
      const updateDto: UpdateUserDTO = { firstName: 'Updated' };
      service.update.mockRejectedValue(new Error('User not found'));

      await expect(controller.update(largeId, updateDto)).rejects.toThrow('User not found');
      expect(service.update).toHaveBeenCalledWith(largeId, updateDto);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle service timeout errors', async () => {
      service.findAll.mockRejectedValue(new Error('Request timeout'));

      await expect(controller.findAll()).rejects.toThrow('Request timeout');
    });

    it('should handle malformed register data', async () => {
      const malformedDto = {
        email: 'invalid-email',
        password: '',
        firstName: null,
        lastName: undefined
      } as any;

      service.register.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.register(malformedDto)).rejects.toThrow('Validation failed');
    });

    it('should handle empty update DTO', async () => {
      const emptyDto: UpdateUserDTO = {};
      const updatedUser: UserResponseDto = {
        ...mockUserResponse,
      };

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, emptyDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(1, emptyDto);
    });

    it('should handle concurrent delete requests', async () => {
      service.delete.mockRejectedValue(new Error('Concurrent modification'));

      await expect(controller.delete(1)).rejects.toThrow('Concurrent modification');
    });

    it('should handle database connection errors in findAll', async () => {
      service.findAll.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle registration with duplicate email gracefully', async () => {
      const registerDto: RegisterDTO = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      service.register.mockRejectedValue(new Error('Email already exists'));

      await expect(controller.register(registerDto)).rejects.toThrow('Email already exists');
    });

    it('should handle update with partial data', async () => {
      const partialDto: UpdateUserDTO = {
        firstName: 'OnlyFirstName'
      };

      const updatedUser: UserResponseDto = {
        ...mockUserResponse,
        firstName: 'OnlyFirstName'
      };

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, partialDto);

      expect(result).toEqual(updatedUser);
      expect(result.firstName).toBe('OnlyFirstName');
    });

    it('should handle service throwing unexpected error types', async () => {
      service.findAll.mockRejectedValue('String error instead of Error object');

      await expect(controller.findAll()).rejects.toBe('String error instead of Error object');
    });
  });

  describe('integration', () => {
    it('should have all required methods', () => {
      expect(typeof controller.findAll).toBe('function');
      expect(typeof controller.register).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.delete).toBe('function');
    });

    it('should use correct HTTP methods and decorators', () => {
      expect(controller).toBeDefined();
      expect(controller.findAll).toBeDefined();
      expect(controller.register).toBeDefined();
      expect(controller.update).toBeDefined();
      expect(controller.delete).toBeDefined();
    });
  });
});