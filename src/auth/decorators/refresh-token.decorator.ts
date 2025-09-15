import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/*
  En el auth.controller, en el endpoint /tokens, tenemos que extraer un token del header Authorization
  Este endpoint debe ser público, por lo que no podemos utilizar AuthGuard para extraer el encabezado
  
  Como el token viene en el header, Nest no nos va a dejar utilizar un PIPE para trabajarlo, ya que
  no permite pasar una instancia de Pipe al decorador @Header.

  Para evitar colocar la lógica de la extracción del token en el service (lo cual no es escalable),
  definimos un decorador personalizado para hacer esto (virtualmente tiene la misma funcionalidad 
  que la pipe, pero no la utilizamos por la razón que listamos en el párrafo 2).
*/
export const RefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('El header Authorization debe tener el formato Bearer [token]');
    }

    //Después de hacer el split, nos queda [Bearer, token]. Devolvemos el elemento 1 de este array.
    return authHeader.split(' ')[1]; 
  }
);