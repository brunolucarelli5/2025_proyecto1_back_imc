// ARCHIVO: request-with-user.ts
import { Request } from 'express';
import { User } from 'src/users/schemas/user.schema';
/* 
    Una Request es un objeto generado por Express.js, que representa toda la petición HTTP realizada.
    
    Acá le estamos añadiendo el campo extra "user", porque después de validar el JWT en el
    auth-guard, tenemos que saber QUÉ usuario hizo la petición, para poder asociar los datos 
    que se guarden / consulten a ese usuario.     

    → Ejemplo: Cuando un usuario haga /imc/historial, vamos a poder obtener solo los historiales 
    de ese usuario, ya que sabemos el usuario que hizo la petición con request.user.
*/
export interface RequestWithUser extends Request {
  user: User;
}