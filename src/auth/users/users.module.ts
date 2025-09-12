//ARCHIVO: users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from 'src/auth/jwt/jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from './repositories/users.repository';

@Module({
  providers: [
    UsersService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  imports: [JwtModule, TypeOrmModule.forFeature([UserEntity])],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
