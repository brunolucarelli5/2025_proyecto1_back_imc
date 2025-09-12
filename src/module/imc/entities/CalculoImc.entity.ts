//ARCHIVO: imc.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from 'typeorm';

@Entity('calculoimc')
export class CalculoImc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', {precision: 4, scale: 2})
  altura: number;

  @Column('decimal', {precision: 6, scale: 2})
  peso: number;

  @Column('decimal', {precision: 6, scale: 2})
  imc: number;

  @Column()
  categoria: string

  @CreateDateColumn()
  fecha_calculo: Date;

  

}
