//ARCHIVO: imc.controller.ts

import { Controller, Post, Body, ValidationPipe, Get, Query } from '@nestjs/common';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { PaginacionHistorialImcDto } from './dto/paginacion-historial-imc.dto';
import { CalculoImc } from './entities/CalculoImc.entity';
import { SortValidationPipe } from './pipes/sort-validation.pipe';


@Controller('imc')
export class ImcController {

  constructor(private readonly imcService: ImcService) {}


  @Get('historial')
  getHistorial(@Query('sort', new SortValidationPipe()) sort: 'asc' | 'desc' = 'desc'): Promise<CalculoImc[]> {
    return this.imcService.findAllSorted(sort);
  }

  //Esta query tiene el formato: /imc/pag?pag=2&mostrar=5
  @Get('pag')
  async findPag(
    @Query() paginacion: PaginacionHistorialImcDto,
    @Query('sort', new SortValidationPipe()) sort: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: CalculoImc[]; total: number }> {
    return this.imcService.findPag(paginacion, sort);
  }


  @Post('calcular')
  calcular(@Body(ValidationPipe) data: CalculoImcDto) {
    return this.imcService.calcularImc(data);
  }

}
