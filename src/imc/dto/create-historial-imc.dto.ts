import { ApiProperty } from "@nestjs/swagger";

//ARCHIVO: create-historial-imc.dto.ts
export class CreateHistorialImcDto {
  @ApiProperty()
  altura: number;

  @ApiProperty()
  peso: number;

  @ApiProperty()
  imc: number;

  @ApiProperty()
  categoria: string;

  @ApiProperty()
  user: string;  // CAMBIO: antes era 'user: UserEntity'

  @ApiProperty()
  fecha_calculo: Date; //Envíamos la fecha de creación
}

