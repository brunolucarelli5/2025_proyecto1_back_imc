//ARCHIVO: users.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { hashSync} from 'bcrypt';
import { IUserRepository } from './repositories/users.repository.interface';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
/*
  Si agregamos roles, será necesario agregar/modificar los métodos:
    • addPermission()
    • addrole()
    • findAll() → Encontrar según las relaciones -relations: ['permissionCodes', 'roles']-
*/


@Injectable()
export class UsersService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  private toUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }


  async findAll(): Promise<UserResponseDto[]> {
    const users =  await this.userRepository.findAll()
    return users.map(this.toUserResponse)
  }

  //Usado por auth.service en login()
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }


  async register(body: RegisterDTO): Promise<UserResponseDto> {
    //Creamos un objeto usuario con los datos del (body: RegisterDTO)
    const user = Object.assign(new UserEntity(), body);
    user.password = hashSync(user.password, 10); //Jamás guardamos contraseñas planas.
    
    //Verificamos que el correo no esté registrado (no permitimos duplicados)
    if (await this.userRepository.findByEmail(body.email)) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }
    const savedUser = await this.userRepository.save(user);
    return this.toUserResponse(savedUser);
  }

  async update(id: number, body: UpdateUserDTO): Promise<UserResponseDto> {
    //Todos los atributos son opcionales al actualizar. Si llegan a pasar una contraseña nueva,
    //nos aseguramos de hashearla antes de guardarla en la bd. 
    if (body.password) {
      body.password = hashSync(body.password, 10);
    }
    const actualizado = await this.userRepository.update(id, body)

    if (!actualizado) throw new NotFoundException('No se pudo actualizar el usuario. Verifica que la ID exista.')
    return this.toUserResponse(actualizado)  
  }

  async delete(id: number): Promise<MessageResponseDTO> {
    const result = await this.userRepository.delete(id)
    if (!result) throw new NotFoundException('No se pudo eliminar el usuario. Verifica que la ID exista.');
    
    return { message: 'Usuario ID N°' + id + ' eliminado.'  }
  }
}
