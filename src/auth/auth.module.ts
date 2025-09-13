//ARCHIVO: auth.module.ts

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from './jwt/jwt.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    JwtModule,
    UsersModule, // Necesario para usar UsersService en AuthService
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}