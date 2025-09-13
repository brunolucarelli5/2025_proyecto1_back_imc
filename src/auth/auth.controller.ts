//ARCHIVO: auth.controller.ts

import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { Request } from 'express';
import { AuthGuard } from './guards/auth.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth') // Agrupa en Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}


  @ApiOperation({ summary: 'Inicia sesión y obtiene tokens' })
  @ApiResponse({ status: 201, description: 'Access y Refresh tokens generados correctamente' })
  @Post('login')
  login(@Body() body: LoginDTO): Promise<TokenPairDTO> {
    return this.service.login(body);
  }

  /*
    → Este endpoint trabaja sobre el header, no sobre @Body, @Query, @Param, entonces NO necesita DTO.
    → Este endpoint NO va protegido, porque es público.
  */
  @ApiOperation({ summary: 'Cuando el access expira, el frontend usa este endpoint para, a través de un refresh token, obtener un nuevo access. Si el refresh también está por expirar, obtiene un nuevo access y un nuevo refresh.' })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @Get('tokens') refreshToken(@Req() request: Request){ 
    return this.service.refreshToken( request.headers['authorization'] );
  }

  /*
    EJEMPLO
    /users/me es un endpoint de ejemplo creado para entender el concepto de Requests.
    Las Requests en sí están explicadas en auth.guard, línea 55+
  */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve los datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
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