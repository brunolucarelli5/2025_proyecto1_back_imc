//ARCHIVO: auth.service.ts

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { JwtService } from './jwt/jwt.service';
import { compareSync } from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async refreshToken(authHeader: string | undefined) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException(
        'El header Authorization es obligatorio, y en este caso tener el formato Bearer [refresh-token].',
      );
    }

    const token = authHeader.split(' ')[1];
    return this.jwtService.refreshToken(token); // ahora sí le pasás el token
  }

  async login(body: LoginDTO): Promise<TokenPairDTO> {
    const user = await this.usersService.findByEmail(body.email);
    if (!user)
      throw new UnauthorizedException(
        'No se pudo loguear. Correo electrónico inválido.',
      );

    //compareSync nos permite comparar el pswd plano que pasó el usuario con el hasheado de la bd.
    const compareResult = compareSync(body.password, user.password);
    if (!compareResult)
      throw new UnauthorizedException(
        'No se pudo loguear. Contraseña incorrecta.',
      );

    //Si el usuario pasó el logueo, le damos los tokens
    return {
      //En generateToken() se especifica que si no pasás nada, type = 'access' → usa config.access
      accessToken: this.jwtService.generateToken({ email: user.email }),
      refreshToken: this.jwtService.generateToken(
        { email: user.email },
        'refresh',
      ),
    };
  }
}
