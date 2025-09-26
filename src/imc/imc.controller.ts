//ARCHIVO: imc.controller.ts

import { Controller, Post, Body, ValidationPipe, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { PaginacionHistorialImcDto } from './dto/paginacion-historial-imc.dto';
import { SortValidationPipe } from './pipes/sort-validation.pipe';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaginacionResponseDto } from './dto/paginacion-response.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CalculoImcResponseDto } from './dto/calculo-imc-response.dto';
import { DashboardResponseDto } from './dto/dashboard/dashboard-response.dto';


@Controller('imc')
export class ImcController {

  constructor(private readonly imcService: ImcService) {}


  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calcula el IMC y lo guarda' })
  @UseGuards(AuthGuard)
  @Post('calcular')
  calcular(
    @Body(ValidationPipe) data: CalculoImcDto,
    @Req() req: RequestWithUser
  ): Promise<CalculoImcResponseDto> {
    console.log('Calculando IMC')
    return this.imcService.calcularImc(data, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el historial de cálculos del usuario' })
  @UseGuards(AuthGuard)
  @Get('historial')
  getHistorial(
    @Query('sort', new SortValidationPipe()) sort: 'asc' | 'desc' = 'desc',
    @Req() req: RequestWithUser
  ): Promise<CalculoImcResponseDto[]> {
    console.log('Obteniendo historial de IMC para '+ req.user.email)
    return this.imcService.findAllSorted(sort, req.user.id);
  }


  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve cálculos del usuario paginados' })
  @UseGuards(AuthGuard)
  @Get('pag')           //Esta query tiene el formato: /imc/pag?pag=2&mostrar=5
  async findPag(
    @Query() paginacion: PaginacionHistorialImcDto,
    @Query('sort', new SortValidationPipe()) sort: 'asc' | 'desc' = 'desc',
    @Req() req: RequestWithUser
  ): Promise<PaginacionResponseDto> {
    console.log('Obteniendo paginación de historial IMC para usuario ' + req.user.email)
    return this.imcService.findPag(paginacion, sort, req.user.id);
  }

  /*
    DASHBOARD
  */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el resumen del dashboard del usuario' })
  @UseGuards(AuthGuard)
  @Get('dashboard')
  async obtenerDashboard(
    @Req() req: RequestWithUser
  ): Promise<DashboardResponseDto> {
    console.log('Dashboard para', req.user.email);
    return this.imcService.obtenerDashboard(req.user.id);
  }
}
