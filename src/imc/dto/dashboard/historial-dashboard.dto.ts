// ARCHIVO: historial-dashboard.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class HistorialDashboardDto {
  @ApiProperty()
  fecha_calculo: Date;

  @ApiProperty()
  imc: number;

  @ApiProperty()
  peso: number;
}