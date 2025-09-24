// ARCHIVO: promedio-desviacion.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class PromedioDesviacionDto {
  @ApiProperty()
  promedio: number;

  @ApiProperty()
  desviacion: number;
}