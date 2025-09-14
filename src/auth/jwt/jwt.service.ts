//ARCHIVO: jwt.service.ts
import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { Payload } from '../interfaces/payload.interface';
import { ConfigService } from '@nestjs/config';
import { JwtConfigTokens } from '../interfaces/jwt-config.interface';

@Injectable()
export class JwtService {

  //Creamos una config vacía con 2 tokens, los cuales tendrán c/u un secret y un expiresIn.
  private readonly config: JwtConfigTokens;

  //Cargamos la config con los datos del .env. Si falta alguno, damos error.
  constructor(private readonly configService: ConfigService) {
    const accessSecret = this.configService.get<string>('jwt.access.secret');
    const accessExpiresIn = this.configService.get<string>('jwt.access.expiresIn');
    const refreshSecret = this.configService.get<string>('jwt.refresh.secret');
    const refreshExpiresIn = this.configService.get<string>('jwt.refresh.expiresIn');

    if (!accessSecret || !accessExpiresIn || !refreshSecret || !refreshExpiresIn) {
      throw new InternalServerErrorException('Faltan variables de entorno JWT en el archivo .env');
    }

    this.config = {
      access: {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      },
      refresh: {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      },
    };
  }

  
  generateToken(payload: Payload, type: 'refresh' | 'access' = 'access'): string {
    //El método sign() toma un payload y lo firma con un secreto. Le añade además exp, iat, etc. 
    //Devuelve el token jwt formado en formato string.
    return sign( payload, this.config[type].secret, {expiresIn: this.config[type].expiresIn} );
  }


  //Verificamos si el refresh es correcto, y generamos refresh || access, según el caso.
  refreshToken(refreshToken: string) {
    try {
      //Verificamos si el refresh token es correcto, usando el secret correspondiente.
      const payload = verify( refreshToken, this.config.refresh.secret ) as Payload
      
      //Validamos si ese payload trae la fecha de expiración
      if (!payload.exp) throw new UnauthorizedException('Token sin fecha de expiración')

      //Obtenemos el tiempo actual, en segundos.
      const currentTime = Math.floor(Date.now() / 1000);  

      //payload.exp es un atributo (que "payload.ts" implementa de JwtPayload) que indica cuándo va a
      //expirar, expresada en unix time. Dividiendo por 60, obtenemos los mins p/ que expire el refresh.
      const timeToExpire = (payload.exp - currentTime) / 60;  
      
      //Si está cerca de expirar el refresh, generamos un nuevo refresh y access.
      if (timeToExpire < 20) {
        return {
          accessToken: this.generateToken({ email: payload.email }),
          refreshToken: this.generateToken({ email: payload.email }, 'refresh'),
        }
      }
      
      //Caso contrario, generamos solamente el access.
      return {
        accessToken: this.generateToken({ email: payload.email })
      };
      
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
 
  //Verifica el token y devuelve su contenido (es decir, su payload).
  getPayload(token: string, type: 'refresh' | 'access' = 'access'): Payload {
    const payload = verify(token, this.config[type].secret);

    //verify() nos puede devolver un token en formato string o como un objeto JwtPayload. Como 
    // nuestro "payload.ts" extends JwtPayload, queremos que los tokens sean JwtPayload. Verificamos:
    if (typeof payload === 'string' || !('email' in payload)) {
      throw new UnauthorizedException('Token inválido: no tiene el formato esperado (objeto JwtPayload con email). ');
    }

    //Ahora que estamos seguros que payload es un objeto JwtPayload, devolvemos su contenido.
    return payload as Payload;
  }
}
