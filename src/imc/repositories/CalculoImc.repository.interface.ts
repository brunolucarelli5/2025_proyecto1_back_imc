//ARCHIVO: CalculoImc.repository.interface.ts
import { CreateHistorialImcDto } from "../dto/create-historial-imc.dto";
import { PaginacionResponseDto } from "../dto/paginacion-response.dto";
import { CalculoImc } from "../entities/CalculoImc.entity";

export interface ICalculoImcRepository {
    findAllSorted(order: 'ASC' | 'DESC', userId: number): Promise<CalculoImc[]>
    findPag(pag: number, mostrar: number, sort: 'ASC' | 'DESC', userId): Promise<PaginacionResponseDto>

    save(historial: CreateHistorialImcDto): Promise<CalculoImc>;
}