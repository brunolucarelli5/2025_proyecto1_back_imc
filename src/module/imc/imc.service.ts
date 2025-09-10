//Imports del helper
import { calcularIMC } from "../helpers/imc.helper";
import { calcularIMCRedondeado } from "../helpers/imc.helper";

//Resto de imports
import { Injectable } from "@nestjs/common";
import { CalcularImcDto } from "./dto/calcular-imc-dto";


@Injectable()
export class ImcService {

  /*
    FUNCIONES PRIVADAS
  */
  private obtenerCategoria(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obeso';
  }

  /*
    FUNCIONES LLAMADAS POR EL CONTROLLER
  */
  calcularImc(data: CalcularImcDto): { imc: number; categoria: string } {
    const { altura, peso } = data;
    const categoria = this.obtenerCategoria( calcularIMC(peso,altura) )
    return {imc: calcularIMCRedondeado(peso, altura, 2), categoria}  //Shorthand property names en categoría
  }

  
}