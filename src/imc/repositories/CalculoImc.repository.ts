//ARCHIVO: imc.repository.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ICalculoImcRepository } from "./CalculoImc.repository.interface";
import { CalculoImc } from "../entities/CalculoImc.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateHistorialImcDto } from "../dto/create-historial-imc.dto";
import { PaginacionResponseDto } from "../dto/paginacion-response.dto";

@Injectable()
export class CalculoImcRepository implements ICalculoImcRepository {

    constructor(
        @InjectRepository(CalculoImc)
        private readonly repo: Repository<CalculoImc>,
    ) {}

    async findAllSorted(sort: 'ASC' | 'DESC', userId: number): Promise<CalculoImc[]> {
        try {
            return await this.repo.find({
                where: {user: {id: userId} },
                order: {fecha_calculo: sort},
            });

        } catch (error) {
            throw new InternalServerErrorException( `Error al obtener el historial ordenado (${sort}) de IMC. Error: ${error}`);
        }
    }

    async findPag(pag: number, mostrar: number, sort: 'ASC' | 'DESC', userId: number ): Promise<PaginacionResponseDto> {
        const skip = (pag - 1) * mostrar;   // No nos interesa atrapar errores de esta cte, sino del ORM.

        try {
            //Desestructuramos
            const [data, total] = await this.repo.findAndCount({    //TypeORM devuelve [elementos[], total]
                where: { user: {id: userId} },                     //   • elementos[]: Elementos de la página que solicitamos
                skip,                                             //    • total: cantidad total de registros]
                take: mostrar,                                   //El ResponseDTO espera {CalculoImc[], number}, entonces
                order: { fecha_calculo: sort },                 //tenemos que desestructurar los datos primero 
            });                                                // y después devolvemos el objeto.
            
            //Devolvemos el objeto que pide el DTO
            return {data, total}

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