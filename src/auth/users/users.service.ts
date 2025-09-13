//ARCHIVO: users.service.ts
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDTO } from '../dto/login.dto';
import { RegisterDTO } from '../dto/register.dto';
import { UserEntity } from '../entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { IUserRepository } from './repositories/users.repository.interface';
import { UpdateUserDTO } from '../dto/update-user.dto';
import { MessageResponseDTO } from '../dto/response.dto';
import { TokenPairDTO } from '../dto/token-pair.dto';

/*
  Si agregamos roles, será necesario agregar/modificar los métodos:
    • addPermission()
    • addrole()
    • findAll() → Encontrar según las relaciones -relations: ['permissionCodes', 'roles']-
*/


@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,

    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  /* 
    Métodos que NO NECESITAN PERMANENCIA a través del repository
  */
  async refreshToken(authHeader: string | undefined) {

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('El header Authorization es obligatorio, y en este caso tener el formato Bearer [refresh-token].');
    }

    const token = authHeader.split(' ')[1];
    return this.jwtService.refreshToken(token); // ahora sí le pasás el token
  }

  /*
    Métodos que UTILIZAN PERMANENCIA a través del repository
  */

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.findAll()
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }


  async register(body: RegisterDTO) {
    const user = new UserEntity();
    Object.assign(user, body);
    user.password = hashSync(user.password, 10); //Jamás guardamos contraseñas planas.
    return await this.userRepository.save(user);
  }

  async login(body: LoginDTO): Promise<TokenPairDTO> {

    const user = await this.findByEmail(body.email);
    if (!user) throw new UnauthorizedException();

    //compareSync nos permite comparar el pswd plano que pasó el usuario con el hasheado de la bd.
    const compareResult = compareSync(body.password, user.password); 
    if (!compareResult) throw new UnauthorizedException();

    //Si el usuario pasó el logueo, le damos los tokens
    return {
      //En generateToken() se especifica que si no pasás nada, type = 'access' → usa config.access
      accessToken: this.jwtService.generateToken(
        { email: user.email }
      ), 
      refreshToken: this.jwtService.generateToken(
        {email: user.email},
        'refresh',
      ),
    };
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
