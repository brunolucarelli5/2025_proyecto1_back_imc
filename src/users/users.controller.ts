//ARCHIVO: users.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { UserEntity } from './entities/user.entity';


@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}


  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<UserEntity[]> {
    return this.service.findAll();
  }

  @Post('register')
  register(@Body() body: RegisterDTO): Promise<UserEntity> {
    return this.service.register(body);
  }

  @UseGuards(AuthGuard)
  @Patch('/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDTO): Promise<UserEntity> {
    return this.service.update(id, body);
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<MessageResponseDTO> {
    return this.service.delete(id);
  }
}