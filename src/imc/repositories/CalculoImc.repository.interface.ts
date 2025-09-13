//ARCHIVO: CalculoImc.repository.interface.ts
import { CreateHistorialImcDto } from "../dto/create-historial-imc.dto";
import { CalculoImc } from "../entities/CalculoImc.entity";

export interface ICalculoImcRepository {
    findAllSorted(order: 'ASC' | 'DESC'): Promise<CalculoImc[]>
    findPag(pag: number, mostrar: number, sort: 'ASC' | 'DESC'): Promise<[CalculoImc[], number]>

    save(historial: CreateHistorialImcDto): Promise<CalculoImc>;
}