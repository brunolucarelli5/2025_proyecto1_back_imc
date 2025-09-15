//ARCHIVO: jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';

/* 
  Este archivo declara un módulo que exporta JwtService, lo que nos permite
  inyectarlo en cualquier otro módulo (como UsersService o AuthGuard).
*/
@Module({
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
