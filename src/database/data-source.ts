//ARCHIVO: data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from '../users/entities/user.entity';
import { CalculoImc } from '../imc/entities/CalculoImc.entity';

// Cargar variables desde .env
config();

export const AppDataSource = new DataSource({
  type: 'postgres',                                   //CAMBIO: Nueva base de datos
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),  //CAMBIO: Puerto por defecto 
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [UserEntity, CalculoImc],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});