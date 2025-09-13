import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDTO {
  @ApiPropertyOptional({ example: 'nuevoemail@example.com', description: 'Nuevo correo electrónico del usuario', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NuevaPassword123!', description: 'Nueva contraseña del usuario', required: false})
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'Carlos', description: 'Nuevo nombre del usuario', required: false})
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Gómez', description: 'Nuevo apellido del usuario', required: false})
  @IsOptional()
  @IsString()
  lastName?: string;
}