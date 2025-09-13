import { Exclude } from 'class-transformer';
import { CalculoImc } from 'src/imc/entities/CalculoImc.entity';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

/*
  Cuando agreguemos roles, vamos a cambiar esto por un 
    "export class UserEntity extends BaseEntity implementes UserI", donde UserI define que cada
  usuario tiene mail, pass y roles, siendo roles un array de RolesEntity[]
*/

@Entity('users')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column( {unique: true})
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  //Añadimos la relación, pero para acceder al historial hacemos imc.users, no users.imc
  @OneToMany(() => CalculoImc, (calculo) => calculo.user, { eager: false })
  imcs: CalculoImc[];
}
