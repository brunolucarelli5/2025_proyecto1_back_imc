import { Expose } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class CalculoImcDto {

  @IsNumber()
  @Expose()
  @Min(0.01, { message: 'La altura debe ser mayor que 0' })
  @Max(2.99, { message: 'La altura no puede ser mayor a 3 metros' })
  altura: number;

  @IsNumber()
  @Expose()
  @Min(0.01, { message: 'El peso debe ser mayor que 0' })
  @Max(499.99, { message: 'El peso no puede ser mayor a 500 kg' })
  peso: number;
}

