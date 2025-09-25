//ARCHIVO: imc.module.ts

import { Module } from '@nestjs/common';
import { ImcService } from './imc.service';
import { ImcController } from './imc.controller';
import { CalculoImcRepository } from './repositories/CalculoImc.repository';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CalculoImc, CalculoImcSchema } from './schemas/calculo-imc.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalculoImc.name, schema: CalculoImcSchema },
      // Podés importar el esquema de User para poder hacer `populate` si lo necesitás
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ImcController],
  providers: [
    ImcService,
    CalculoImcRepository,
    {
      provide: 'ICalculoImcRepository',    // Archivo <repositories/CalculoImc.repository.interface.ts>
      useExisting: CalculoImcRepository,   // Archivo <repositories/CalculoImc.repository.ts>
    },
  ],
})
export class ImcModule {}
