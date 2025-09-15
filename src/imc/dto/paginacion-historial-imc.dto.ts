// ARCHIVO: paginacion-historial-imc.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer'; // Importa 'Type'
import { IsOptional, IsInt, Min } from 'class-validator';

//Si acceden a /imc/pag, les mostramos por defecto la primera página, con 5 elementos.
//Sino, pueden hacer por ej http://localhost:3000/marca/pag?pag=1&mostrar=3.
export class PaginacionHistorialImcDto {
  @ApiProperty({ example: '3', description: 'Número de página (mínimo 1)', required: false})
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pag debe ser un número entero' })
  @Min(1, { message: 'pag debe ser mayor o igual a 1' })
  pag: number = 1;

  @ApiProperty({ example: '2', description: 'Cantidad de elementos por página (mínimo 1)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'mostrar debe ser un número entero' })
  @Min(1, { message: 'mostrar debe ser mayor o igual a 1' })
  mostrar: number = 5;

  // El pipe "sort-validation.pipe.ts" valida si esta string es 'asc' | 'desc'
  @ApiProperty({ example: 'asc', enum: ['asc', 'desc'], description: 'Orden de los resultados', required: false })
  @IsOptional()
  sort?: string;
}