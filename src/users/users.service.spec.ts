import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './repositories/users.repository';
import { UserEntity } from './entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeormRepository: Repository<UserEntity>;

  const mockUserEntity = (id: number, email: string) => {
    const user = new UserEntity();
    user.id = id;
    user.email = email;
    user.password = 'hashedpassword';
    user.firstName = 'Test';
    user.lastName = 'User';
    return user;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeormRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        mockUserEntity(1, 'test1@example.com'),
        mockUserEntity(2, 'test2@example.com'),
      ];
      jest.spyOn(typeormRepository, 'find').mockResolvedValue(users);

      const result = await repository.findAll();

      expect(result).toEqual(users);
      expect(typeormRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no users found', async () => {
      jest.spyOn(typeormRepository, 'find').mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(typeormRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if something goes wrong', async () => {
      jest
        .spyOn(typeormRepository, 'find')
        .mockRejectedValue(new Error('Database error'));

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = mockUserEntity(1, 'test@example.com');
      jest.spyOn(typeormRepository, 'findOne').mockResolvedValue(user);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if no user found', async () => {
      jest.spyOn(typeormRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should throw an error if something goes wrong', async () => {
      jest
        .spyOn(typeormRepository, 'findOne')
        .mockRejectedValue(new Error('Database error'));

      await expect(repository.findByEmail('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('save', () => {
    it('should save a user and return it', async () => {
      const user = mockUserEntity(1, 'test@example.com');
      jest.spyOn(typeormRepository, 'save').mockResolvedValue(user);

      const result = await repository.save(user);

      expect(result).toEqual(user);
      expect(typeormRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw an error if something goes wrong', async () => {
      const user = mockUserEntity(1, 'test@example.com');
      jest
        .spyOn(typeormRepository, 'save')
        .mockRejectedValue(new Error('Database error'));

      await expect(repository.save(user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a user by id and return result', async () => {
      const deleteResult: DeleteResult = { raw: [], affected: 1 };
      jest.spyOn(typeormRepository, 'delete').mockResolvedValue(deleteResult);

      const result = await repository.delete(1);

      expect(result).toEqual(deleteResult);
      expect(typeormRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return an object with "affected" property equal to 0 if no user found', async () => {
      const deleteResult: DeleteResult = { raw: [], affected: 0 };
      jest.spyOn(typeormRepository, 'delete').mockResolvedValue(deleteResult);

      const result = await repository.delete(999);

      expect(result).toEqual(deleteResult);
      expect(typeormRepository.delete).toHaveBeenCalledWith(999);
    });

    it('should throw an error if something goes wrong', async () => {
      jest
        .spyOn(typeormRepository, 'delete')
        .mockRejectedValue(new Error('Database error'));

      await expect(repository.delete(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
