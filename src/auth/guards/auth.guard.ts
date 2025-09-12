//ARCHIVO: auth.middleware.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "../jwt/jwt.service";
import { UsersService } from "../users/users.service";
import { RequestWithUser } from "../interfaces/request-with-user";

/*
  Cuando usemos @UseGuards(AuthGuard), Nest va a ejecutar el método canActivate() antes de entrar
  al endpoint del controller. Si canActivate() devuelve true, la Request ingresa el endpoint, 
  sino se frenará.

  Podmeos usar AuthGuard en cualquier módulo que necesite autenticación (imc, users, etc)
*/

@Injectable()
export class AuthGuard implements CanActivate {
  
  constructor(
    private jwtService: JwtService, 
    private usersService: UsersService
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
   
    try {
      //Obtenemos la request de la solicitud (con usuario, ver interfaz)
      const request: RequestWithUser = context.switchToHttp().getRequest();

      const authHeader = request.headers.authorization;
      if (!authHeader) throw new UnauthorizedException('No se envió el Header junto a la solicitud');
    
      //authHeader tiene la forma "Bearer [token]", asique extraemos el token 
      const [encabezado, token] = authHeader.split(' ')

      if (encabezado !== 'Bearer' || !token) {
        throw new UnauthorizedException('Formato de Header inválido. Debe ser "Bearer [token]". ');
      }

      /* 
        Un JWT tiene tres partes codificadas en Base64 (https://www.jwt.io/):
          • Header
          • Payload   → Nos interesa este.
          • Signature. 
        El payload del token está formado por múltiples partes, las cuales varían según lo que 
        necesitemos. En este caso, definimos las partes del payload en la interfaz "payload.ts",
        la cual es devuelta por el método getPayload().        
      */
      const payload = this.jwtService.getPayload(token) //El método getPayload le dice a TS 
      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado.');
      }

      /* 
        Arriba revisamos que el que el payload tnega el campo email, en base al email identificamos 
        el usuario, si el usuario existe anexamos el usuario al Request.
      
        El objeto Request de Express viaja por toda la peticicón. Esta línea parece innecesaria,
        pero está actualizando la request para que incluya a un usuario, lo que nos permite después,
        por ejemplo, hacer un request.user en el controller para enviar el usuario al service (a
        pesar de que la petición original sólo tiene un mail).

        Un ejemplo de esto puede verse en el endpoint /me.
      */
      request.user = user;

      //Si todo lo anterior pudo hacerse, permitimos el acceso a la ruta cubierta por el Guard.
      return true;

    } catch (error) {
      throw new UnauthorizedException(error?.message);
    }
  }
}