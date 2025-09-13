//ARCHIVO: users.service.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { hashSync} from 'bcrypt';
import { IUserRepository } from './repositories/users.repository.interface';
import { UpdateUserDTO } from './dto/update-user.dto';
import { MessageResponseDTO } from '../auth/dto/message-response.dto';
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


  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.findAll()
  }

  //Usado por auth.service en login()
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }


  async register(body: RegisterDTO) {
    const user = new UserEntity();
    Object.assign(user, body);
    user.password = hashSync(user.password, 10); //Jamás guardamos contraseñas planas.
    return await this.userRepository.save(user);
  }

  async update(id: number, body: UpdateUserDTO): Promise<UserEntity> {
    //Todos los atributos son opcionales al actualizar. Si llegan a pasar una contraseña nueva,
    //nos aseguramos de hashearla antes de guardarla en la bd. 
    if (body.password) {
      body.password = hashSync(body.password, 10);
    }
    const actualizado = await this.userRepository.update(id, body)

    if (!actualizado) throw new UnauthorizedException()
    return actualizado  
  }

  async delete(id: number): Promise<MessageResponseDTO> {
    const result = await this.userRepository.delete(id)
    if (!result) throw new UnauthorizedException();
    
    return { message: 'Usuario ID N°' + id + ' eliminado.'  }
  }
}
