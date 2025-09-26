import { BadRequestException } from '@nestjs/common';

/**
 * Valida la fortaleza de una contraseña según criterios de seguridad
 * @param password - La contraseña a validar
 * @param email - Email del usuario (para evitar que la contraseña contenga el email)
 * @param firstName - Nombre del usuario (para evitar que la contraseña contenga el nombre)
 * @param lastName - Apellido del usuario (para evitar que la contraseña contenga el apellido)
 * @throws BadRequestException si la contraseña no cumple los criterios
 */
export function validatePasswordStrength(
  password: string,
  email: string,
  firstName: string,
  lastName: string
): void {
  // Verificar longitud minima
  if (password.length < 8) {
    throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
  }

  // Verificar que tenga al menos una letra mayuscula
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestException('La contraseña debe contener al menos una letra mayúscula');
  }

  // Verificar que tenga al menos una letra minuscula
  if (!/[a-z]/.test(password)) {
    throw new BadRequestException('La contraseña debe contener al menos una letra minúscula');
  }

  // Verificar que tenga al menos un numero
  if (!/\d/.test(password)) {
    throw new BadRequestException('La contraseña debe contener al menos un número');
  }

  // Verificar que tenga al menos un caracter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new BadRequestException('La contraseña debe contener al menos un carácter especial');
  }

  // Verificar que no contenga informacion personal
  const passwordLower = password.toLowerCase();
  const emailUser = email.split('@')[0].toLowerCase();

  if (passwordLower.includes(emailUser)) {
    throw new BadRequestException('La contraseña no debe contener parte del email');
  }

  if (firstName && passwordLower.includes(firstName.toLowerCase())) {
    throw new BadRequestException('La contraseña no debe contener el nombre');
  }

  if (lastName && passwordLower.includes(lastName.toLowerCase())) {
    throw new BadRequestException('La contraseña no debe contener el apellido');
  }

  // Verificar patrones comunes debiles
  const weakPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /111111/,
    /000000/,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      throw new BadRequestException('La contraseña contiene un patrón común inseguro');
    }
  }
}