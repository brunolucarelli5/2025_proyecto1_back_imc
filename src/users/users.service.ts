//ARCHIVO: users.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { hashSync} from 'bcrypt';
import { IUserRepository } from './repositories/users.repository.interface';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { validatePasswordStrength } from './helpers/validatePasswordStrength';
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
    //Validamos que la contraseña sea segura antes de crear el usuario
    validatePasswordStrength(body.password, body.email, body.firstName, body.lastName)

    //Verificamos que el correo no esté registrado (no permitimos duplicados) antes de crear el usuario.
    if (await this.userRepository.findByEmail(body.email)) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    //Si pasamos las validaciones, creamos un nuevo objeto UserEntity con los datos de (body: RegisterDTO)
    const user = Object.assign(new UserEntity(), body);
    user.password = hashSync(user.password, 10); //Jamás guardamos contraseñas planas.
    
    const savedUser = await this.userRepository.save(user);
    return this.toUserResponse(savedUser);
  }

  async update(id: number, body: UpdateUserDTO): Promise<UserResponseDto> {
    //Todos los atributos son opcionales al actualizar. 
    // Si uno de estos atributos es una contraseña nueva, vamos a:
    if (body.password) {
      
      // Traer el usuario para tener sus datos personales
      const user = await this.userRepository.findById(id);
      if (!user) throw new NotFoundException('Usuario no encontrado');
      
      // Validar la nueva contraseña con datos actuales
      validatePasswordStrength(body.password, user.email, user.firstName, user.lastName)

      //Si la contraseña es segura, la hasheamos.
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
