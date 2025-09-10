//ARCHIVO: imc.helper.ts
export function calcularIMC(peso: number, altura: number): number {
    return peso / (altura * altura);
}

export function calcularIMCRedondeado(peso: number, altura: number, decimales: number): number {
    const imc = calcularIMC(peso, altura);
    const potencia10 = 10 ** decimales
    return Math.round(imc * potencia10) / potencia10;   //Si decimales = 2, (imc * 100) / 100
}

