//ARCHIVO: imc.controller.ts

import { Controller, Post, Body, ValidationPipe, Get, Query } from '@nestjs/common';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { PaginacionHistorialImcDto } from './dto/paginacion-historial-imc.dto';
import { CalculoImc } from './entities/CalculoImc.entity';
import { SortValidationPipe } from './pipes/sort-validation.pipe';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';


@Controller('imc')
export class ImcController {

  constructor(private readonly imcService: ImcService) {}


  //@ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el historial de cálculos del usuario' })
  @Get('historial')
  getHistorial(@Query('sort', new SortValidationPipe()) sort: 'asc' | 'desc' = 'desc'): Promise<CalculoImc[]> {
    return this.imcService.findAllSorted(sort);
  }



  //@ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve cálculos del usuario paginados' })
  @Get('historial')
  @Get('pag')           //Esta query tiene el formato: /imc/pag?pag=2&mostrar=5
  async findPag(
    @Query() paginacion: PaginacionHistorialImcDto,
    @Query('sort', new SortValidationPipe()) sort: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: CalculoImc[]; total: number }> {
    return this.imcService.findPag(paginacion, sort);
  }

  //@ApiBearerAuth()
  @ApiOperation({ summary: 'Calcula el IMC y lo guarda' })
  @Post('calcular')
  calcular(@Body(ValidationPipe) data: CalculoImcDto) {
    return this.imcService.calcularImc(data);
  }

}
