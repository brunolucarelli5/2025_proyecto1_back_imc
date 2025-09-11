//ARCHIVO: imc.repository.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ICalculoImcRepository } from "./CalculoImc.repository.interface";
import { CalculoImc } from "../entities/CalculoImc.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateHistorialImcDto } from "../dto/create-historial-imc.dto";

@Injectable()
export class CalculoImcRepository implements ICalculoImcRepository {

    constructor(
        @InjectRepository(CalculoImc)
        private readonly repo: Repository<CalculoImc>,
    ) {}


    async findAll(): Promise<CalculoImc[]> {
        try {
            return await this.repo.find();
        } catch (error) {
            throw new InternalServerErrorException('Error al buscar todo el historial de cálculos IMC. Error:' + error);
        }
    }

    async findAllDesc(): Promise<CalculoImc[]> {
        try {
            return await this.repo.find({
                order: {
                    fecha_calculo: 'DESC',
                },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener el historial ordenado de IMC. Error: ' + error);
        }
    }


    async findPag(pag: number, mostrar: number): Promise<[CalculoImc[], number]> {
        const skip = (pag - 1) * mostrar;   // No nos interesa atrapar errores de esta cte, sino del ORM.

        try {
            return this.repo.findAndCount({
                skip,                                     //TypeORM devuelve [elementos[], total]
                take: mostrar,                           //elementos[]: Elementos de la página que solicitamos
                order: { id: 'ASC' },                   //total: cantidad total de registros]
            });                                        //Por eso la promesa es [CalculoImc[], number].
        } catch (error) {
            throw new InternalServerErrorException(`Error al paginar el historial de IMC. Error:` + error);
        }
    }

    async save(historial: CreateHistorialImcDto): Promise<CalculoImc> {
        try {
            return await this.repo.save(historial);
        } catch (error) {
            throw new InternalServerErrorException('Error al crear el historial de IMC. Error:' + error)
        } 
    }
}