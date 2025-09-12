//ARCHIVO: users.service.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDTO } from '../interfaces/login.dto';
import { RegisterDTO } from '../interfaces/register.dto';
import { UserEntity } from '../entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { IUserRepository } from './repositories/users.repository.interface';

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
  async refreshToken(refreshToken: string) {
    return this.jwtService.refreshToken(refreshToken);
  }

  /*
    Métodos que UTILIZAN PERMANENCIA a través del repository
  */
  async register(body: RegisterDTO) {
    const user = new UserEntity();
    Object.assign(user, body);
    user.password = hashSync(user.password, 10); //Jamás guardamos contraseñas planas.
    return await this.userRepository.save(user);
  }

  async login(body: LoginDTO) {

    const user = await this.findByEmail(body.email);
    if (!user) throw new UnauthorizedException();

    //compareSync nos permite comparar el pswd plano que pasó el usuario con el hasheado de la bd.
    const compareResult = compareSync(body.password, user.password); 
    if (!compareResult) throw new UnauthorizedException();

    //Si el usuario pasó el logueo, le damos los tokens
    return {
      //En generateToken() se especifica que si no pasás nada, type = 'access' → usa config.access
      accessToken: this.jwtService.generateToken({ email: user.email }), 
      refreshToken: this.jwtService.generateToken(
        {email: user.email},
        'refresh',
      ),
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findByEmail(email);
  }

  async findAll() {
    return await this.userRepository.findAll()
  }


  async update(id: string, body: any) {
    //El body puede tener muchos campos, como firstName, lastName, etc. Si uno de ellos es una
    //contraseña, nos aseguramos de hashearla antes de guardarla en la bd. 
    body['password'] = hashSync(body['password'], 10)
    const actualizado = await this.userRepository.update(id, body)

    if (!actualizado) throw new UnauthorizedException()
    return { message: 'Usuario actualizado exitosamente.' }    
  }

  async delete(id: string) {
    const result = await this.userRepository.delete(id)

    if (!result) throw new UnauthorizedException();
    
    return { message: 'Eliminado' }
  }
}
