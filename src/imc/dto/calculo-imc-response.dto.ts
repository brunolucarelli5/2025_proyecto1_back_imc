import { UserResponseDto } from "src/users/dto/user-response.dto";

export class CalculoImcResponseDto {
  id: number;
  altura: number;
  peso: number;
  imc: number;
  categoria: string;
  fecha_calculo: Date;
  user: UserResponseDto;
}