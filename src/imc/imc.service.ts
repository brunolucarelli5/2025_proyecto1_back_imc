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
import { UserEntity } from "src/users/entities/user.entity";
import { PaginacionResponseDto } from "./dto/paginacion-response.dto";
import { CalculoImcResponseDto } from "./dto/calculo-imc-response.dto";


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

  private formatoHistorial(altura: number, peso: number, imc: number, categoria: string, user: UserEntity): CreateHistorialImcDto {
    return {altura, peso, imc, categoria, user}
  }

  //Ocultamos el password
  private formatoResponseHistorial(calculoImc: CalculoImc): CalculoImcResponseDto { 
    return {
      id: calculoImc.id,
      altura: calculoImc.altura,
      peso: calculoImc.peso,
      imc: calculoImc.imc,
      categoria: calculoImc.categoria,
      fecha_calculo: calculoImc.fecha_calculo,
      user: {
        id: calculoImc.user.id,   
        email: calculoImc.user.email,             
        firstName: calculoImc.user.firstName,
        lastName: calculoImc.user.lastName,
      },
    };
  }

  /*
    FUNCIONES LLAMADAS POR EL CONTROLLER
  */
  async findAllSorted(sort: 'asc' | 'desc' = 'desc', userId: number): Promise<CalculoImc[]> {

    const sortUpper = sort.toUpperCase();

    if (sortUpper === 'ASC') {
      return this.imcRepository.findAllSorted('ASC', userId);
    } else {
      return this.imcRepository.findAllSorted('DESC', userId);
    }
  }

  async findPag(
    paginacion: PaginacionHistorialImcDto,
    sort: 'asc' | 'desc' = 'desc',
    userId: number
  ): Promise<PaginacionResponseDto> {
    // Type assertion: convertimos el string a tipo 'ASC' | 'DESC' para cumplir con lo que espera TypeORM
    const sortMayus = sort.toUpperCase() as 'ASC' | 'DESC';   
    
    //Desestructuramos
    const { pag, mostrar } = paginacion;
    return await this.imcRepository.findPag(pag, mostrar, sortMayus, userId);
  }

  async calcularImc(data: CalculoImcDto, user: UserEntity): Promise<CalculoImcResponseDto> {
    const { altura, peso } = data;
    const imc = calcularIMC(peso,altura)
    const rtaBD = await this.imcRepository.save( this.formatoHistorial(altura, peso, redondearIMC(imc, 2), this.obtenerCategoria(imc), user) )
    return this.formatoResponseHistorial(rtaBD)
  }


}