// ARCHIVO: paginacion-response.dto.ts
import { CalculoImc } from '../entities/CalculoImc.entity';

export class PaginacionResponseDto {
  data: CalculoImc[];

  total: number;
}