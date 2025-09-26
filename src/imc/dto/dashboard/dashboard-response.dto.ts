// ARCHIVO: dashboard-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { HistorialDashboardDto } from './historial-dashboard.dto';
import { PromedioDesviacionDto } from './promedio-desviacion.dto';
import { CategoriasCantidadDto } from './categorias-cantidad.dto';

export class DashboardResponseDto {
  @ApiProperty({ type: [HistorialDashboardDto] })
  historiales: HistorialDashboardDto[];

  @ApiProperty()
  estadisticasPeso: PromedioDesviacionDto;

  @ApiProperty()
  estadisticasImc: PromedioDesviacionDto;

  @ApiProperty()
  categorias: CategoriasCantidadDto;
}