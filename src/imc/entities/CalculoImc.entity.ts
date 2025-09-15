//ARCHIVO: imc.entity.ts
import { UserEntity } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne} from 'typeorm';

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

  /*
    FUNCIONAMIENTO / LÓGICA:
    El front usa el enpoint GET /imc/historial, con Bearer [token].
    Authguard extrae el usuario del token y lo inyecta en la request (ver endpoint /me para explicación)
    Esta request llega al imc.service.ts, que es capaz de filtrar los cálculos por usuario.

    ¿POR QUÉ HAY UN RESPONSE DTO para el /imc/calcular, pero no para /imc/historial o /imc/pag?
    En la BD no va a guardarse una UserEntity completa, va a guardarse una FK, pero cuando
    hagamos consultas a un CalculoImc, la BD va a devolver los datos completos de la UserEntity.
    Si no queremos que se muestren todos los datos del usuario, armamos un ResponseDTO.

    { eager: false }
    Esto hace que si la consulta por defecto no necesitó de un usuario (es decir, no pasamos un ID
    de usuario, como sí lo hacemos en /calcular), entonces no se muestra el usuario.
  */
  @ManyToOne(() => UserEntity, (user) => user.imcs, { eager: false })   //Un user tiene muchos cálculos.
  user: UserEntity;                                                     //Un cálculo tiene un user.
}
