//ARCHIVO: calculo-imc-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class CalculoImcResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  altura: number;

  @ApiProperty()
  peso: number;

  @ApiProperty()
  imc: number;

  @ApiProperty()
  categoria: string;

  @ApiProperty()
  fecha_calculo: Date;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}