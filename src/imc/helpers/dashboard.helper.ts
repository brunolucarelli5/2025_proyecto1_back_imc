import { CategoriasCantidadDto } from "../dto/dashboard/categorias-cantidad.dto";

//ARCHIVO: dashboard.helper.ts
export function promedio(array: number[]): number {
    if (array.length === 0) return 0;

    let suma = 0
    for (const numero of array) {
        suma += numero
    }

    const prom = suma /array.length
    return parseFloat( (prom).toFixed(2) )    //2 decimales
}

export function desviacion(array: number[]): number { 
    if (array.length === 0) return 0;
    
    const prom = promedio(array)
    let sumaDiferenciasCuadrado = 0;

    for (const numero of array) {
        sumaDiferenciasCuadrado += Math.pow(numero - prom, 2)
    }
    
    const varianza = sumaDiferenciasCuadrado / array.length
    return parseFloat( Math.sqrt(varianza).toFixed(2) )        //2 decimales
}

export function contarCategorias(categorias: string[]): CategoriasCantidadDto {
    let cantBajoPeso = 0, cantNormal = 0, cantSobrepeso = 0, cantObeso = 0;

    for (const categoria of categorias) {
        if (categoria === "Bajo peso") {cantBajoPeso++}
        else if (categoria === "Normal") {cantNormal++}
        else if (categoria === "Sobrepeso") {cantSobrepeso++}
        else if (categoria === "Obeso") {cantObeso++}
    }
    return {cantBajoPeso, cantNormal, cantSobrepeso, cantObeso}
}