//ARCHIVO: imc.helper.ts
function redondear(num: number, decimales: number): number {
    const potencia10 = 10 ** decimales
    return Math.round(num * potencia10) / potencia10    //Si decimales = 2, (imc * 100) / 100
}

export function calcularIMC(peso: number, altura: number): number {
    return peso / (altura * altura);
}

export function calcularIMCRedondeado(peso: number, altura: number, decimales: number): number {
    return redondear(calcularIMC(peso, altura), decimales)   
}

export function redondearIMC(imc: number, decimales: number): number {
    return redondear(imc, decimales)
}
