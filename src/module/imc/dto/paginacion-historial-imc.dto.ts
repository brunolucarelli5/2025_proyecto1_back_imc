// ARCHIVO: paginacion-marca.dto.ts
import { Type } from 'class-transformer'; // Importa 'Type'
import { IsOptional, IsInt, Min } from 'class-validator';

//Si acceden a /imc/pag, les mostramos por defecto la primera página, con 5 elementos.
//Sino, pueden hacer por ej http://localhost:3000/marca/pag?pag=1&mostrar=3.
export class PaginacionHistorialImcDto {
  @IsOptional()
  @Type(() => Number) // Usa @Type para una conversión segura
  @IsInt({ message: 'pag debe ser un número entero' })
  @Min(1, { message: 'pag debe ser mayor o igual a 1' })
  pag: number = 1;

  @IsOptional()
  @Type(() => Number) // Usa @Type para una conversión segura
  @IsInt({ message: 'mostrar debe ser un número entero' })
  @Min(1, { message: 'mostrar debe ser mayor o igual a 1' })
  mostrar: number = 5;

  // El tipo 'asc' | 'desc' lo validamos con el pipe, no es necesario chequear
  @IsOptional()
  sort?: any;
}