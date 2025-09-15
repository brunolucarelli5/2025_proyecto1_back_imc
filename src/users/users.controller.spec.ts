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
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
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

  describe('integration', () => {
    it('should have all required methods', () => {
      expect(typeof controller.findAll).toBe('function');
      expect(typeof controller.register).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.delete).toBe('function');
    });
  });
});