import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RegisterDTO } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';

describe('UsersController - Isolated', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUserResponse: UserResponseDto = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    const mockUsersService = {
      findAll: jest.fn(),
      register: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockAuthGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('console.log coverage', () => {
    it('should log message when finding all users', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.findAll.mockResolvedValue([mockUserResponse]);

      await controller.findAll();

      expect(consoleSpy).toHaveBeenCalledWith('Obteniendo todos los ususarios');
      consoleSpy.mockRestore();
    });

    it('should log message when registering user', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const registerDto: RegisterDTO = {
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      };
      service.register.mockResolvedValue(mockUserResponse);

      await controller.register(registerDto);

      expect(consoleSpy).toHaveBeenCalledWith('Registrando nuevo usuario');
      consoleSpy.mockRestore();
    });

    it('should log message when updating user', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const updateDto: UpdateUserDTO = { firstName: 'Updated' };
      service.update.mockResolvedValue(mockUserResponse);

      await controller.update(1, updateDto);

      expect(consoleSpy).toHaveBeenCalledWith('Actualizando usuario');
      consoleSpy.mockRestore();
    });

    it('should log message when deleting user', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const deleteResponse: MessageResponseDTO = { message: 'Usuario eliminado' };
      service.delete.mockResolvedValue(deleteResponse);

      await controller.delete(1);

      expect(consoleSpy).toHaveBeenCalledWith('Eliminando usuario');
      consoleSpy.mockRestore();
    });
  });

  describe('method verification', () => {
    it('should call service methods correctly', async () => {
      service.findAll.mockResolvedValue([]);
      service.register.mockResolvedValue(mockUserResponse);
      service.update.mockResolvedValue(mockUserResponse);
      service.delete.mockResolvedValue({ message: 'Deleted' });

      const registerDto: RegisterDTO = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };

      const updateDto: UpdateUserDTO = { firstName: 'Updated' };

      await controller.findAll();
      await controller.register(registerDto);
      await controller.update(1, updateDto);
      await controller.delete(1);

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(service.delete).toHaveBeenCalledWith(1);
    });
  });
});