//ARCHIVO: auth.module.ts

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from './jwt/jwt.module';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    UsersModule, // Necesario para usar UsersService en AuthService
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    AuthGuard,
    JwtService,
  ],
  exports: [
    AuthGuard,    //Exportamos AuthGuard porque lo usamos en imc
    JwtModule,
  ]
})
export class AuthModule {}