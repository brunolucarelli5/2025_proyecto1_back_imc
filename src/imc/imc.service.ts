//ARCHIVO: imc.service.ts

//Imports del helper
import { calcularIMC, redondearIMC } from "./helpers/imc.helper";
import { promedio, desviacion, contarCategorias } from "./helpers/dashboard.helper";

//Resto de imports
import { Inject, Injectable } from "@nestjs/common";
import { CalculoImcDto } from "./dto/calculo-imc.dto";
import { ICalculoImcRepository } from "./repositories/CalculoImc.repository.interface";
import { CreateHistorialImcDto } from "./dto/create-historial-imc.dto";
import { CalculoImc } from "./schemas/calculo-imc.schema";
import { PaginacionHistorialImcDto } from "./dto/paginacion-historial-imc.dto";
import { PaginacionResponseDto } from "./dto/paginacion-response.dto";
import { CalculoImcResponseDto } from "./dto/calculo-imc-response.dto";
import { DashboardResponseDto } from "./dto/dashboard/dashboard-response.dto";
import { HistorialDashboardDto } from "./dto/dashboard/historial-dashboard.dto";
import { User } from "src/users/schemas/user.schema";


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

  private formatoHistorial(altura: number, peso: number, imc: number, categoria: string, userId: string): CreateHistorialImcDto {
    return {altura, peso, imc, categoria, user: userId, fecha_calculo: new Date()}
  }

  //Ocultamos el password
  private formatoResponseHistorial(calculoImc: CalculoImc): CalculoImcResponseDto { 
    //Si el repository necesita buscar un usuario, hace un populate para traer todos los atributos.
    //Estamos seguros entonces que user no será una id, sino un objeto con email, firstName, etc
    const user = calculoImc.user as User;

    return {
      id: calculoImc.id,
      altura: calculoImc.altura,
      peso: calculoImc.peso,
      imc: calculoImc.imc,
      categoria: calculoImc.categoria,
      fecha_calculo: calculoImc.fecha_calculo,
      user: {   //Usamos populate en el repository, asique podemos extraer id, email, etc.
        id: user.id,   
        email: user.email,             
        firstName:user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /*
    FUNCIONES LLAMADAS POR EL CONTROLLER
  */
  async findAllSorted(sort: 'asc' | 'desc' = 'desc', userId: string): Promise<CalculoImcResponseDto[]> {

    const sortUpper = sort.toUpperCase();
    const documentos = await this.imcRepository.findAllSorted(sortUpper as 'ASC' | 'DESC', userId);
    return documentos.map(doc => this.formatoResponseHistorial(doc));
  }


  async findPag(
    paginacion: PaginacionHistorialImcDto,
    sort: 'asc' | 'desc' = 'desc',
    userId: string
  ): Promise<PaginacionResponseDto> {
    // Type assertion: convertimos el string a tipo 'ASC' | 'DESC' para cumplir con lo que espera TypeORM
    const sortMayus = sort.toUpperCase() as 'ASC' | 'DESC';   
    
    //Desestructuramos. 
    const { pag, mostrar } = paginacion;
    const { data, total } = await this.imcRepository.findPag(pag, mostrar, sortMayus, userId);

    return {
      data: data.map(doc => this.formatoResponseHistorial(doc)), // transformamos los docs a DTOs
      total
    };
  }

  async calcularImc(data: CalculoImcDto, user: User): Promise<CalculoImcResponseDto> {
    const { altura, peso } = data;
    const imc = calcularIMC(peso,altura)
    const rtaBD = await this.imcRepository.save( 
      this.formatoHistorial(
        altura, 
        peso, 
        redondearIMC(imc, 2), 
        this.obtenerCategoria(imc), 
        user._id.toString()
      ) 
    )

    //Hacemos populate para traer el usuario completo
    const rtaConUsuario = await this.imcRepository.findByIdConUsuario(rtaBD.id);

    return this.formatoResponseHistorial(rtaConUsuario)
  }

  async obtenerDashboard(userId: string): Promise<DashboardResponseDto> {
    //Obtenemos el historial completo del usuario que hace la solicitud
    const historiales = await this.imcRepository.findAllSorted('ASC', userId);

    //Creamos arrays vacíos. Con for-each los llenamos con los datos que necesitamos en el dashbrd.
    const historialDashboard: HistorialDashboardDto[] = []
    const imcs: number[] = []
    const pesos: number[] = []
    const categoriasUsuario: string[] = []

    //Hacemos un for para recorrer los historiales y completar los arrays anteriores.
    for (const historial of historiales) {
      historialDashboard.push({
        fecha_calculo: historial.fecha_calculo,
        imc: Number(historial.imc),
        peso: Number(historial.peso),
      })

      imcs.push( Number(historial.imc) )    //Está guardado como str, lo pasamos a num.
      pesos.push( Number(historial.peso) )  //Está guardado como str, lo pasamos a num.
      categoriasUsuario.push(historial.categoria)
    }

    //Pasamos los arrays a un helper para obtener los datos que necesitamos.
    return {
      historiales: historialDashboard,

      estadisticasPeso: {
        promedio: promedio(pesos),
        desviacion: desviacion(pesos)
      },

      estadisticasImc: {
        promedio: promedio(imcs),
        desviacion: desviacion(imcs)
      },

      categorias: contarCategorias(categoriasUsuario)
    };
  }
}