//ARCHIVO: CalculoImc.repository.interface.ts
import { CreateHistorialImcDto } from "../dto/create-historial-imc.dto";
import { CalculoImc } from "../entities/CalculoImc.entity";

export interface ICalculoImcRepository {
    findAll(): Promise<CalculoImc[]>;
    findAllDesc(): Promise<CalculoImc[]>;
    findPag(pag: number, mostrar: number): Promise<[CalculoImc[], number]>

    save(historial: CreateHistorialImcDto): Promise<CalculoImc>;
}