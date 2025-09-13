//ARCHIVO: create-historial-imc.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class CreateHistorialImcDto {
  @ApiProperty({ example: '1.78' })
  altura: number;
  
  @ApiProperty({ example: '56' })
  peso: number;

  @ApiProperty({ example: '17.67' })
  imc: number;

  @ApiProperty({ example: 'Bajo peso' })
  categoria: string; 
}