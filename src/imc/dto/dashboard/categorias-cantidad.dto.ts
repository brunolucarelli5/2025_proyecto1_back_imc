// ARCHIVO: categorias-cantidad.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CategoriasCantidadDto {
  @ApiProperty()
  cantBajoPeso: number;

  @ApiProperty()
  cantNormal: number;

  @ApiProperty()
  cantSobrepeso: number;

  @ApiProperty()
  cantObeso: number;
}