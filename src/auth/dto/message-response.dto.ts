import { ApiProperty } from "@nestjs/swagger";

export class MessageResponseDTO {
  @ApiProperty({ example: 'Usuario ID N° 4 eliminado.' })
  message: string;
}