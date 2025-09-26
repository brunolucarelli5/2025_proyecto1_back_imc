//Este DTO es utilizado por el repository. Después el service utiliza 
// paginacion-response.dto.ts para sacarle el password.

//ARCHIVO: paginacion.dto.ts
import { CalculoImc } from '../schemas/calculo-imc.schema';

export class PaginacionDto {
  data: CalculoImc[];
  total: number;
}
