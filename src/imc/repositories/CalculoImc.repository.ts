//ARCHIVO: CalculoImc.repository.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ICalculoImcRepository } from './CalculoImc.repository.interface';
import { CalculoImc, CalculoImcDocument } from '../schemas/calculo-imc.schema';
import { CreateHistorialImcDto } from '../dto/create-historial-imc.dto';
import { PaginacionDto } from '../dto/paginacion.dto';

@Injectable()
export class CalculoImcRepository implements ICalculoImcRepository {
  constructor(
    @InjectModel(CalculoImc.name)
    private readonly imcModel: Model<CalculoImcDocument>,
  ) {}

  async findByIdConUsuario(id: string): Promise<CalculoImc> {
    try {
      const result = await this.imcModel.findById(id).populate('user').exec();
      if (!result) {
        throw new NotFoundException(`Calculo IMC con id ${id} no encontrado`);
      }
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Error al buscar IMC por ID: ${error}`);
    }
  }



  async findAllSorted(sort: 'ASC' | 'DESC', userId: string): Promise<CalculoImc[]> {
    try {
      const order = sort === 'ASC' ? 1 : -1;
      return this.imcModel
        .find({ user: userId })
        .populate('user')       //Consultamos también por todos  los datos de usuario.
        .sort({ fecha_calculo: order })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al obtener historial ordenado (${sort}) de IMC: ${error}`,
      );
    }
  }

  async findPag(
    pag: number,
    mostrar: number,
    sort: 'ASC' | 'DESC',
    userId: string,
  ): Promise<PaginacionDto> {
    try {
      const skip = (pag - 1) * mostrar;
      const order = sort === 'ASC' ? 1 : -1;

      const [data, total] = await Promise.all([
        this.imcModel
          .find({ user: userId })
          .populate('user')       //Consultamos también por todos  los datos de usuario.
          .sort({ fecha_calculo: order })
          .skip(skip)
          .limit(mostrar)
          .exec(),
        this.imcModel.countDocuments({ userId }).exec(),
      ]);

      return { data, total };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al paginar historial de IMC: ${error}`,
      );
    }
  }

  async save(historial: CreateHistorialImcDto): Promise<CalculoImc> {
    try {
      const created = new this.imcModel(historial);
      return await created.save();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al guardar cálculo IMC: ${error}`,
      );
    }
  }
}
