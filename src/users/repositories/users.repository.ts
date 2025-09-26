import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';
import { IUserRepository } from './users.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<User[]> {
    try {
      return await this.userModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener todos los usuarios. ' + error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userModel.findOne( {email} ).select('+password').exec();
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar usuario por email. ' + error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.userModel.findById(id).exec();
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar usuario por ID. ' + error);
    }
  }

  async save(user: Partial<User>): Promise<User> {
    try {
      const newUser = new this.userModel(user);
      return await newUser.save();
    } catch (error) {
      throw new InternalServerErrorException('Error al guardar el usuario. ' + error);
    }
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    try {
      return await this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el usuario. ' + error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el usuario. ' + error);
    }
  }
}