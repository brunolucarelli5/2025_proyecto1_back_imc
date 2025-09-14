import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RegisterDTO } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtService } from '../auth/jwt/jwt.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser: UserEntity = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    imcs: [],
    // BaseEntity methods
    hasId: jest.fn().mockReturnValue(true),
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  } as unknown as UserEntity;

  const mockUsersService = {
    findAll: jest.fn(),
    register: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    generateToken: jest.fn().mockReturnValue('token'),
    refreshToken: jest.fn().mockReturnValue('refreshToken'),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthGuard,
          useValue: mockAuthGuard,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(
      UsersService,
    ) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const expectedUsers = [
        mockUser,
        { ...mockUser, id: 2, email: 'test2@example.com' } as UserEntity,
      ];
      service.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.findAll();

      expect(result).toEqual(expectedUsers);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledWith();
    });

    it('should return empty array when no users exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Service error';
      service.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(controller.findAll()).rejects.toThrow(errorMessage);
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
      const expectedUser = { ...mockUser, ...registerDto, id: 2 } as UserEntity;
      service.register.mockResolvedValue(expectedUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedUser);
      expect(service.register).toHaveBeenCalledTimes(1);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration with all required fields', async () => {
      const completeRegisterDto: RegisterDTO = {
        email: 'complete@example.com',
        password: 'securePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedUser = {
        ...mockUser,
        ...completeRegisterDto,
        id: 3,
      } as UserEntity;
      service.register.mockResolvedValue(expectedUser);

      const result = await controller.register(completeRegisterDto);

      expect(result).toEqual(expectedUser);
      expect(service.register).toHaveBeenCalledWith(completeRegisterDto);
    });

    it('should propagate registration errors from service', async () => {
      const errorMessage = 'Email already exists';
      service.register.mockRejectedValue(new Error(errorMessage));

      await expect(controller.register(registerDto)).rejects.toThrow(
        errorMessage,
      );
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle edge cases in registration data', async () => {
      const edgeCaseDto: RegisterDTO = {
        email: 'edge.case+test@domain-name.co.uk',
        password: 'P@ssw0rd!',
        firstName: 'María José',
        lastName: "O'Connor-Smith",
      };

      const expectedUser = { ...mockUser, ...edgeCaseDto } as UserEntity;
      service.register.mockResolvedValue(expectedUser);

      const result = await controller.register(edgeCaseDto);

      expect(result).toEqual(expectedUser);
      expect(service.register).toHaveBeenCalledWith(edgeCaseDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateDto,
      } as unknown as UserEntity;
      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should handle ParseIntPipe for user ID', async () => {
      const updatedUser = {
        ...mockUser,
        ...updateDto,
      } as unknown as UserEntity;
      service.update.mockResolvedValue(updatedUser);

      // The ParseIntPipe is applied in the route decorator
      // This test ensures the controller method receives the correct parameters
      await controller.update(42, updateDto);

      expect(service.update).toHaveBeenCalledWith(42, updateDto);
    });

    it('should handle partial updates', async () => {
      const partialUpdates = [
        { firstName: 'OnlyFirst' },
        { lastName: 'OnlyLast' },
        { email: 'only@email.com' },
        { password: 'onlyPassword' },
        { firstName: 'First', lastName: 'Last' },
      ];

      for (const partialDto of partialUpdates) {
        const updatedUser = {
          ...mockUser,
          ...partialDto,
        } as unknown as UserEntity;
        service.update.mockResolvedValue(updatedUser);

        const result = await controller.update(1, partialDto);

        expect(result).toEqual(updatedUser);
        expect(service.update).toHaveBeenCalledWith(1, partialDto);
      }
    });

    it('should handle empty update object', async () => {
      const emptyUpdate = {};
      service.update.mockResolvedValue(mockUser);

      const result = await controller.update(1, emptyUpdate);

      expect(result).toEqual(mockUser);
      expect(service.update).toHaveBeenCalledWith(1, emptyUpdate);
    });

    it('should propagate update errors from service', async () => {
      const errorMessage = 'User not found';
      service.update.mockRejectedValue(new Error(errorMessage));

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        errorMessage,
      );
      expect(service.update).toHaveBeenCalledWith(999, updateDto);
    });

    it('should handle updates with password changes', async () => {
      const updateWithPassword = {
        ...updateDto,
        password: 'newSecurePassword123!',
      };

      const updatedUser = {
        ...mockUser,
        ...updateWithPassword,
      } as unknown as UserEntity;
      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateWithPassword);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(1, updateWithPassword);
    });
  });

  describe('delete', () => {
    const expectedResponse: MessageResponseDTO = {
      message: 'Usuario ID N°1 eliminado.',
    };

    it('should delete user successfully', async () => {
      service.delete.mockResolvedValue(expectedResponse);

      const result = await controller.delete(1);

      expect(result).toEqual(expectedResponse);
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should handle ParseIntPipe for user ID', async () => {
      const expectedResponseForId42: MessageResponseDTO = {
        message: 'Usuario ID N°42 eliminado.',
      };
      service.delete.mockResolvedValue(expectedResponseForId42);

      const result = await controller.delete(42);

      expect(result).toEqual(expectedResponseForId42);
      expect(service.delete).toHaveBeenCalledWith(42);
    });

    it('should propagate delete errors from service', async () => {
      const errorMessage = 'User not found for deletion';
      service.delete.mockRejectedValue(new Error(errorMessage));

      await expect(controller.delete(999)).rejects.toThrow(errorMessage);
      expect(service.delete).toHaveBeenCalledWith(999);
    });

    it('should handle different user IDs correctly', async () => {
      const testIds = [1, 5, 100, 999];

      for (const id of testIds) {
        const expectedResponse: MessageResponseDTO = {
          message: `Usuario ID N°${id} eliminado.`,
        };
        service.delete.mockResolvedValue(expectedResponse);

        const result = await controller.delete(id);

        expect(result).toEqual(expectedResponse);
        expect(service.delete).toHaveBeenCalledWith(id);
      }
    });
  });

  describe('Controller integration', () => {
    it('should handle service dependency injection correctly', () => {
      expect(controller).toBeDefined();
      expect(service).toBeDefined();

      // Verify that the controller has access to the service
      expect(typeof controller.findAll).toBe('function');
      expect(typeof controller.register).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.delete).toBe('function');
    });

    it('should maintain proper method signatures', () => {
      // Verify that controller methods have expected signatures
      expect(controller.findAll.length).toBe(0);
      expect(controller.register.length).toBe(1);
      expect(controller.update.length).toBe(2);
      expect(controller.delete.length).toBe(1);
    });

    it('should handle concurrent requests properly', async () => {
      // Simulate concurrent requests
      const registerPromises = [
        {
          email: 'user1@test.com',
          password: 'pass1',
          firstName: 'User1',
          lastName: 'Test1',
        },
        {
          email: 'user2@test.com',
          password: 'pass2',
          firstName: 'User2',
          lastName: 'Test2',
        },
        {
          email: 'user3@test.com',
          password: 'pass3',
          firstName: 'User3',
          lastName: 'Test3',
        },
      ].map((dto, index) => {
        const user = { ...mockUser, ...dto, id: index + 1 } as UserEntity;
        service.register.mockResolvedValueOnce(user);
        return controller.register(dto);
      });

      const results = await Promise.all(registerPromises);

      expect(results).toHaveLength(3);
      expect(service.register).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    it('should handle service exceptions gracefully', async () => {
      const serviceErrors = [
        'Database connection error',
        'Validation failed',
        'Authorization error',
        'Internal server error',
      ];

      for (const errorMessage of serviceErrors) {
        service.findAll.mockRejectedValue(new Error(errorMessage));

        await expect(controller.findAll()).rejects.toThrow(errorMessage);
      }
    });

    it('should handle malformed requests appropriately', async () => {
      // These tests verify that the controller properly forwards data to the service
      // Validation is typically handled by pipes and guards at the framework level

      const malformedDto = { invalid: 'data' } as any;
      service.register.mockRejectedValue(new Error('Validation error'));

      await expect(controller.register(malformedDto)).rejects.toThrow(
        'Validation error',
      );
    });
  });
});
