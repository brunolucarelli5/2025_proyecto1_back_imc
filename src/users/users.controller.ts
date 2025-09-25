//ARCHIVO: users.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';


@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos los usuarios' })
  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    console.log("Obteniendo todos los ususarios")
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Registra un nuevo usuario' })
  @Post('register')
  register(@Body() body: RegisterDTO): Promise<UserResponseDto> {
    console.log('Registrando nuevo usuario')
    return this.service.register(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza un usuario' })
  @UseGuards(AuthGuard)
  @Patch('/:id')
  update(@Param('id') id: string, @Body() body: UpdateUserDTO): Promise<UserResponseDto> {
    console.log('Actualizando usuario')
    return this.service.update(id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimina un usuario' })
  @UseGuards(AuthGuard)
  @Delete('/:id')
  delete(@Param('id') id: string): Promise<MessageResponseDTO> {
    console.log('Eliminando usuario')
    return this.service.delete(id);
  }
}