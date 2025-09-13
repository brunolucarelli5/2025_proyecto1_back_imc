//ARCHIVO: create-historial-imc.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { UserEntity } from "src/users/entities/user.entity";

export class CreateHistorialImcDto {
  altura: number;
  
  peso: number;

  imc: number;

  categoria: string; 

  user: UserEntity
}

