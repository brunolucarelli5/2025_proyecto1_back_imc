//ARCHIVO: imc.module.ts

import { Module } from '@nestjs/common';
import { ImcService } from './imc.service';
import { ImcController } from './imc.controller';
import { CalculoImcRepository } from './repositories/CalculoImc.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculoImc } from './entities/CalculoImc.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalculoImc]),
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
