//ARCHIVO: users.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDTO } from '../dto/login.dto';
import { RegisterDTO } from '../dto/register.dto';
import { Request } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { UpdateUserDTO } from '../dto/update-user.dto';
import { MessageResponseDTO } from '../dto/response.dto';
import { TokenPairDTO } from '../dto/token-pair.dto';
import { UserEntity } from '../entities/user.entity';


@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}


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

  /*
    GET
  */
  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<UserEntity[]> {
    return this.service.findAll();
  }

  //Este endpoint trabaja sobre el header, no sobre @Body, @Query, @Param, entonces NO necesita DTO.
  //Este endpoint NO va protegido, porque es público.
  
  //El usuario hace login y obtiene un access y Refresh. El access se envía
  //en cada request protegido con AuthGuard. Cuando el access expira, el frontend usa este endpoint
  //para obtener un nuevo access, y si el refresh está por expirar, obtiene uno nuevo también. 
  @Get('tokens') refreshToken(@Req() request: Request){ 
    return this.service.refreshToken( request.headers['authorization'] );
  }

  /*
    POST
  */
  @Post('login')
  login(@Body() body: LoginDTO): Promise<TokenPairDTO> {
    return this.service.login(body);
  }

  @Post('register')
  register(@Body() body: RegisterDTO): Promise<UserEntity> {
    return this.service.register(body);
  }


  /*
    PATCH
  */
  @UseGuards(AuthGuard)
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDTO): Promise<UserEntity> {
    return this.service.update(id, body);
  }

  /*
    DELETE
  */
  @UseGuards(AuthGuard)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<MessageResponseDTO> {
    return this.service.delete(id);
  }
}