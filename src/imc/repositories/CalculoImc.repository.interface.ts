//ARCHIVO: CalculoImc.repository.interface.ts
import { CreateHistorialImcDto } from "../dto/create-historial-imc.dto";
import { PaginacionDto } from "../dto/paginacion.dto";
import { CalculoImc } from "../schemas/calculo-imc.schema";  // import schema clase

export interface ICalculoImcRepository {
  findAllSorted(sort: 'ASC' | 'DESC', userId: string): Promise<CalculoImc[]>;
  findByIdConUsuario(id: string): Promise<CalculoImc>;
  findPag(pag: number, mostrar: number, sort: 'ASC' | 'DESC', userId: string): Promise<PaginacionDto>;
  save(historial: CreateHistorialImcDto): Promise<CalculoImc>;
}