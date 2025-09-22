import { BadRequestException } from "@nestjs/common";
import { defaultWeakPatterns } from "./patterns";

//DEVOLVEMOS VOID ya que la función simplemente valida la contraseña. Si es correcta, permite 
//que el código que usa este helper siga con su flujo normal. Si es incorrecta, devuelve una exception.
export function validatePasswordStrength(
    password: string, email: string, firstName: string, lastName: string
): void {

    //Reglas básicas de formato
    const minLength = 8;
    if (password.length < minLength) throw new BadRequestException(`La contraseña debe tener al menos ${minLength} caracteres.`)
    if (!/[A-Z]/.test(password)) throw new BadRequestException('La contraseña debe contener al menos una letra mayúscula.')
    if (!/[a-z]/.test(password)) throw new BadRequestException('La contraseña debe contener al menos una letra minúscula.')
    if (!/\d/.test(password)) throw new BadRequestException('La contraseña debe contener al menos un número.')
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(password)) throw new BadRequestException('La contraseña debe contener al menos un carácter especial.')

    //patrónes débiles = defaultWeakPatterns (ver archivo) + datos del usuario
    const weakPatterns = defaultWeakPatterns.concat([
        email.toLowerCase(), 
        firstName.toLowerCase(), 
        lastName.toLowerCase(),
    ]);

    // Verificamos si la contraseña contiene un patrón débil en cualquier punto.
    const lowerPassword = password.toLowerCase();
    for (const pattern of weakPatterns) {
        if (lowerPassword.includes(pattern)) {
            throw new BadRequestException(`La contraseña no debe contener patrones comunes o datos personales (como "${pattern}").`);
        }
    }
}