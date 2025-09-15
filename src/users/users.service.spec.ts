import { Test, TestingModule } from '@nestjs/testing';import { Test, TestingModule } from '@nestjs/testing';

import { BadRequestException, NotFoundException } from '@nestjs/common';import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';import { UsersService } from './users.service';

import { IUserRepository } from './repositories/users.repository.interface';import { IUserRepository } from './repositories/users.repository.interface';

import { UserEntity } from './entities/user.entity';import { UserEntity } from './entities/user.entity';

import { RegisterDTO } from './dto/register.dto';import { RegisterDTO } from './dto/register.dto';

import { UpdateUserDTO } from './dto/update-user.dto';import { UpdateUserDTO } from './dto/update-user.dto';

import { UserResponseDto } from './dto/user-response.dto';import { UserResponseDto } from './dto/user-response.dto';

import * as bcrypt from 'bcrypt';import * as bcrypt from 'bcrypt';



jest.mock('bcrypt', () => ({jest.mock('bcrypt', () => ({

  hashSync: jest.fn(),  hashSync: jest.fn(),

}));}));



describe('UsersService', () => {describe('UsersService', () => {

  let service: UsersService;  let service: UsersService;

  let userRepository: jest.Mocked<IUserRepository>;  let userRepository: jest.Mocked<IUserRepository>;



  const mockUser = {  const mockUser = {

    id: 1,    id: 1,

    email: 'test@example.com',    email: 'test@example.com',

    password: 'hashedpassword',    password: 'hashedpassword',

    firstName: 'Test',    firstName: 'Test',

    lastName: 'User',    lastName: 'User',

    imcs: [],    imcs: [],

  } as unknown as UserEntity;  } as unknown as UserEntity;



  const mockUserResponse: UserResponseDto = {  const mockUserResponse: UserResponseDto = {

    id: 1,    id: 1,

    email: 'test@example.com',    email: 'test@example.com',

    firstName: 'Test',    firstName: 'Test',

    lastName: 'User',    lastName: 'User',

  };  };



  const mockUserRepository = {  const mockUserRepository = {

    findAll: jest.fn(),    findAll: jest.fn(),

    findByEmail: jest.fn(),    findByEmail: jest.fn(),

    save: jest.fn(),    save: jest.fn(),

    update: jest.fn(),    update: jest.fn(),

    delete: jest.fn(),    delete: jest.fn(),

  };  };



  beforeEach(async () => {  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({    const module: TestingModule = await Test.createTestingModule({

      providers: [      providers: [

        UsersService,        UsersService,

        {        {

          provide: 'IUserRepository',          provide: 'IUserRepository',

          useValue: mockUserRepository,          useValue: mockUserRepository,

        },        },

      ],      ],

    }).compile();    }).compile();



    service = module.get<UsersService>(UsersService);    service = module.get<UsersService>(UsersService);

    userRepository = module.get<IUserRepository>('IUserRepository') as jest.Mocked<IUserRepository>;    userRepository = module.get<IUserRepository>('IUserRepository') as jest.Mocked<IUserRepository>;

  });  });



  afterEach(() => {  afterEach(() => {

    jest.clearAllMocks();    jest.clearAllMocks();

  });  });



  it('should be defined', () => {  it('should be defined', () => {

    expect(service).toBeDefined();    expect(service).toBeDefined();

  });  });



  describe('toUserResponse', () => {  describe('findAll', () => {

    it('should convert UserEntity to UserResponseDto', () => {    it('should return array of user responses', async () => {

      const result = service['toUserResponse'](mockUser);      const users = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }];

      expect(result).toEqual(mockUserResponse);      userRepository.findAll.mockResolvedValue(users);

    });

  });      const result = await service.findAll();



  describe('findAll', () => {      expect(result).toHaveLength(2);

    it('should return array of user responses', async () => {      expect(result[0]).toEqual(mockUserResponse);

      const users = [mockUser] as UserEntity[];      expect(userRepository.findAll).toHaveBeenCalledTimes(1);

      userRepository.findAll.mockResolvedValue(users);    });



      const result = await service.findAll();    it('should return empty array when no users found', async () => {

      userRepository.findAll.mockResolvedValue([]);

      expect(result).toHaveLength(1);

      expect(result[0]).toEqual(mockUserResponse);      const result = await service.findAll();

      expect(userRepository.findAll).toHaveBeenCalledTimes(1);

    });      expect(result).toEqual([]);

      expect(userRepository.findAll).toHaveBeenCalledTimes(1);

    it('should return empty array when no users found', async () => {    });

      userRepository.findAll.mockResolvedValue([]);  });



      const result = await service.findAll();  describe('register', () => {

    const registerDto: RegisterDTO = {

      expect(result).toEqual([]);      email: 'newuser@example.com',

      expect(userRepository.findAll).toHaveBeenCalledTimes(1);      password: 'password123',

    });      firstName: 'New',

  });      lastName: 'User',

    };

  describe('findByEmail', () => {

    it('should return user when found', async () => {    it('should register a new user successfully', async () => {

      userRepository.findByEmail.mockResolvedValue(mockUser);      const expectedUser: UserResponseDto = {

        id: 3,

      const result = await service.findByEmail('test@example.com');        email: registerDto.email,

        firstName: registerDto.firstName,

      expect(result).toEqual(mockUser);        lastName: registerDto.lastName,

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');      };

    });

      service.register.mockResolvedValue(expectedUser);

    it('should return null when user not found', async () => {

      userRepository.findByEmail.mockResolvedValue(null);      const result = await controller.register(registerDto);



      const result = await service.findByEmail('nonexistent@example.com');      expect(result).toEqual(expectedUser);

      expect(service.register).toHaveBeenCalledWith(registerDto);

      expect(result).toBeNull();      expect(service.register).toHaveBeenCalledTimes(1);

      expect(userRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');    });

    });

  });    it('should handle registration errors', async () => {

      service.register.mockRejectedValue(new Error('Email already exists'));

  describe('register', () => {

    const registerDto: RegisterDTO = {      await expect(controller.register(registerDto)).rejects.toThrow('Email already exists');

      email: 'newuser@example.com',      expect(service.register).toHaveBeenCalledWith(registerDto);

      password: 'plainpassword',    });

      firstName: 'New',  });

      lastName: 'User',

    };  describe('update', () => {

    const updateDto: UpdateUserDTO = {

    beforeEach(() => {      firstName: 'Updated',

      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedpassword');      lastName: 'Name',

    });    };



    it('should register a new user successfully', async () => {    it('should update user successfully', async () => {

      userRepository.findByEmail.mockResolvedValue(null);      const updatedUser: UserResponseDto = {

      userRepository.save.mockResolvedValue({ ...mockUser, email: registerDto.email });        ...mockUserResponse,

        firstName: updateDto.firstName,

      const result = await service.register(registerDto);        lastName: updateDto.lastName,

      };

      expect(bcrypt.hashSync).toHaveBeenCalledWith('plainpassword', 10);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);      service.update.mockResolvedValue(updatedUser);

      expect(userRepository.save).toHaveBeenCalled();

      expect(result.email).toBe(registerDto.email);      const result = await controller.update(1, updateDto);

    });

      expect(result).toEqual(updatedUser);

    it('should throw BadRequestException when email already exists', async () => {      expect(service.update).toHaveBeenCalledWith(1, updateDto);

      userRepository.findByEmail.mockResolvedValue(mockUser);      expect(service.update).toHaveBeenCalledTimes(1);

    });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);

      await expect(service.register(registerDto)).rejects.toThrow('Ya existe un usuario con ese email');    it('should handle update errors', async () => {

    });      service.update.mockRejectedValue(new Error('User not found'));

  });

      await expect(controller.update(999, updateDto)).rejects.toThrow('User not found');

  describe('update', () => {      expect(service.update).toHaveBeenCalledWith(999, updateDto);

    const updateDto: UpdateUserDTO = {    });

      firstName: 'Updated',  });

      lastName: 'Name',

    };  describe('delete', () => {

    it('should delete user successfully', async () => {

    const updateDtoWithPassword: UpdateUserDTO = {      const expectedMessage: MessageResponseDTO = {

      firstName: 'Updated',        message: 'Usuario eliminado correctamente',

      lastName: 'Name',      };

      password: 'newpassword',

    };      service.delete.mockResolvedValue(expectedMessage);



    beforeEach(() => {      const result = await controller.delete(1);

      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedpassword');

    });      expect(result).toEqual(expectedMessage);

      expect(service.delete).toHaveBeenCalledWith(1);

    it('should update user successfully without password', async () => {      expect(service.delete).toHaveBeenCalledTimes(1);

      const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' };    });

      userRepository.update.mockResolvedValue(updatedUser);

    it('should handle delete errors', async () => {

      const result = await service.update(1, updateDto);      service.delete.mockRejectedValue(new Error('User not found'));



      expect(userRepository.update).toHaveBeenCalledWith(1, updateDto);      await expect(controller.delete(999)).rejects.toThrow('User not found');

      expect(result.firstName).toBe('Updated');      expect(service.delete).toHaveBeenCalledWith(999);

      expect(result.lastName).toBe('Name');    });

    });  });



    it('should update user successfully with password', async () => {  describe('integration', () => {

      const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' };    it('should have all required methods', () => {

      userRepository.update.mockResolvedValue(updatedUser);      expect(typeof controller.findAll).toBe('function');

      expect(typeof controller.register).toBe('function');

      const result = await service.update(1, updateDtoWithPassword);      expect(typeof controller.update).toBe('function');

      expect(typeof controller.delete).toBe('function');

      expect(bcrypt.hashSync).toHaveBeenCalledWith('newpassword', 10);    });

      expect(userRepository.update).toHaveBeenCalledWith(1, { ...updateDtoWithPassword, password: 'hashedpassword' });  });

      expect(result.firstName).toBe('Updated');});
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.update.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto)).rejects.toThrow('No se pudo actualizar el usuario. Verifica que la ID exista.');
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
  });
});