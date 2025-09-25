// ARCHIVO: paginacion-response.dto.ts
import { CalculoImcResponseDto } from "./calculo-imc-response.dto";

export class PaginacionResponseDto {
  data: CalculoImcResponseDto[];

  total: number;
}