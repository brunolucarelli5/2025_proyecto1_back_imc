//ARCHIVO: imc.service.ts

//Imports del helper
import { calcularIMC, redondearIMC } from "./helpers/imc.helper";

//Resto de imports
import { Inject, Injectable } from "@nestjs/common";
import { CalculoImcDto } from "./dto/calculo-imc.dto";
import { ICalculoImcRepository } from "./repositories/CalculoImc.repository.interface";
import { CreateHistorialImcDto } from "./dto/create-historial-imc.dto";
import { CalculoImc } from "./entities/CalculoImc.entity";
import { PaginacionHistorialImcDto } from "./dto/paginacion-historial-imc.dto";


@Injectable()
export class ImcService {

  constructor(
    @Inject('ICalculoImcRepository')
    private readonly imcRepository: ICalculoImcRepository,
  ) {}


  /*
    FUNCIONES PRIVADAS
  */
  private obtenerCategoria(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obeso';
  }

  private formatoHistorial(altura: number, peso: number, imc: number, categoria: string): CreateHistorialImcDto {
    return {altura, peso, imc, categoria}
  }

  /*
    FUNCIONES LLAMADAS POR EL CONTROLLER
  */
  async findAllSorted(sort: 'asc' | 'desc' = 'desc'): Promise<CalculoImc[]> {

    const sortUpper = sort.toUpperCase();

    if (sortUpper === 'ASC') {
      return this.imcRepository.findAllSorted('ASC');
    } else {
      return this.imcRepository.findAllSorted('DESC');
    }
  }

  async findPag(
    paginacion: PaginacionHistorialImcDto,
    sort: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: CalculoImc[]; total: number }> {
    // Type assertion: convertimos el string a tipo 'ASC' | 'DESC' para cumplir con lo que espera TypeORM
    const sortMayus = sort.toUpperCase() as 'ASC' | 'DESC';   
    
    //Desestructuramos
    const { pag, mostrar } = paginacion;
    const [data, total] = await this.imcRepository.findPag(pag, mostrar, sortMayus);
    return { data, total };
  }

  async calcularImc(data: CalculoImcDto): Promise<CalculoImc> {
    const { altura, peso } = data;
    const imc = calcularIMC(peso,altura)
    return await this.imcRepository.save( this.formatoHistorial(altura, peso, redondearIMC(imc, 2), this.obtenerCategoria(imc)))
  }


}