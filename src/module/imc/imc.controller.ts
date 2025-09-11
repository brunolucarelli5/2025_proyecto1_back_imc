//ARCHIVO: imc.controller.ts

import { Controller, Post, Body, ValidationPipe, Get, Query } from '@nestjs/common';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { PaginacionHistorialImcDto } from './dto/paginacion-historial-imc.dto';
import { CalculoImc } from './entities/CalculoImc.entity';


@Controller('imc')
export class ImcController {
  constructor(private readonly imcService: ImcService) {}

  @Get()    //Más viejos primero
  findAll(): Promise<CalculoImc[]> {
    return this.imcService.findAll();
  }
  
  @Get('historial')   ////Más nuevos primero
  findAllDesc(): Promise<CalculoImc[]> {
    return this.imcService.findAllDesc();
  }

  //Esta query tiene el formato: /imc/pag?pag=2&mostrar=5
  @Get('pag')
  async findPag(@Query() paginacion: PaginacionHistorialImcDto) {
    return this.imcService.findPag(paginacion);
  }


  @Post('calcular')
  calcular(@Body(ValidationPipe) data: CalculoImcDto) {
    return this.imcService.calcularImc(data);
  }

}
