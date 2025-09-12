//ARCHIVO: users.repository.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "src/auth/entities/user.entity";
import { IUserRepository } from "./users.repository.interface";

@Injectable()
export class UserRepository implements IUserRepository {

    constructor(
        @InjectRepository(UserEntity)
        private readonly repo: Repository<UserEntity>,
    ) {}

    async findByEmail(email: string): Promise<UserEntity | null> {
        try {
            return await this.repo.findOneBy({ email });
        } catch (error) {
            throw new InternalServerErrorException('Error al buscar usuario por email. ' + error);
        }
    }

  async findAll(): Promise<UserEntity[]> {
    try {
      return this.repo.find();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener todos los usuarios. ' + error);
    }
  }

  async save(user: UserEntity): Promise<UserEntity> {
    try {
      return await this.repo.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Error al guardar el usuario. ' + error);
    }
  }

  async update(id: string, user: Partial<UserEntity>): Promise<boolean> {
    try {
        /*
            El método update() de TypeORM devuelve un objeto UpdateResult. Su atributo .affected 
            puede valer:
                result.affected = 1: Se actualizó / eliminó el registro.
                result.affected = 0: El id no existía, entonces no se hizo nada.
            Por eso hacemos la comparación lógica (result.affected !== 0), que puede ser:
                true: significa que el resultado fue 1, entonces se actualizó exitosamente.
                false: Significa que el resultado fue 0, entonces no se actualizó exitosamente.
        */
        const result = await this.repo.update(id, user);
        return (result.affected !== 0);
    } catch (error) {
        throw new InternalServerErrorException('Error al actualizar el usuario. ' + error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
        /* 
            Con la misma lógica de update, el método delete() también devuelve un objeto
            DeleteResult, con el atributo affected, el cual será 1 si el usuario se eliminó, o 0
            si no se encontró un usuario con esa ID (es decir, si no se eliminó).
        */
        const result = await this.repo.delete(id);
        return (result.affected !== 0);
    } catch (error) {
        throw new InternalServerErrorException('Error al eliminar el usuario. ' + error);
    }
  }
}