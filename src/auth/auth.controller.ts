//ARCHIVO: auth.controller.ts

import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}


  @Post('login')
  login(@Body() body: LoginDTO): Promise<TokenPairDTO> {
    return this.service.login(body);
  }

  /*
    → Este endpoint trabaja sobre el header, no sobre @Body, @Query, @Param, entonces NO necesita DTO.
    → Este endpoint NO va protegido, porque es público.
  
    →FUNCIONAMIENTO: El usuario hace login y obtiene un access y Refresh. El access se envía
    en cada request protegido con AuthGuard. Cuando el access expira, el frontend usa este endpoint
    para obtener un nuevo access, y si el refresh está por expirar, obtiene uno nuevo también. 
  */
  @Get('tokens') refreshToken(@Req() request: Request){ 
    return this.service.refreshToken( request.headers['authorization'] );
  }

  /*
    EJEMPLO
    /users/me es un endpoint de ejemplo creado para entender el concepto de Requests.
    Las Requests en sí están explicadas en auth.guard, línea 55+
  */
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return {
      nombre: req.user.firstName,
      apellido: req.user.lastName,
      email: req.user.email
    }
  }

}