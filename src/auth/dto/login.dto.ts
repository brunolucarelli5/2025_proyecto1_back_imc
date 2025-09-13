import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDTO {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'contra1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}