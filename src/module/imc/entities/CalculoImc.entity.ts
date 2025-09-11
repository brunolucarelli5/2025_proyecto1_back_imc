//ARCHIVO: imc.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from 'typeorm';

@Entity('calculoimc')
export class CalculoImc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  altura: number;

  @Column('decimal')
  peso: number;

  @Column('decimal')
  imc: number;

  @Column()
  categoria: string

  @CreateDateColumn()
  fecha_calculo: Date;
}
