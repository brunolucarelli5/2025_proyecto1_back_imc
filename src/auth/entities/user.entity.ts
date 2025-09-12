import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/*
  Cuando agreguemos roles, vamos a cambiar esto por un 
    "export class UserEntity extends BaseEntity implementes UserI", donde UserI define que cada
  usuario tiene mail, pass y roles, siendo roles un array de RolesEntity[]
*/

@Entity('users')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
}
