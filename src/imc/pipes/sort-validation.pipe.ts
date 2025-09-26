//ARCHIVO: sort-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SortValidationPipe implements PipeTransform {

    transform(sort: any): 'asc' | 'desc' {
        // Si consultan a /imc/historial, es decir sin query, devolvemos la query desc por defecto.
        if (sort === undefined || sort === null || sort === '') {
            return 'desc';
        }

        //Si hay una query, la pasamos a minúsculas y chequeamos su contenido.
        const sortMinusculas = String(sort).toLowerCase();

        //Si es distinto a los dos parámetros aceptables, devolvemos un error.
        if (sortMinusculas !== 'asc' && sortMinusculas !== 'desc') {
            throw new BadRequestException(`'${sort}' no es un valor válido para sort. Usá 'asc' o 'desc'.`);
        }

        return sortMinusculas;
  }
}