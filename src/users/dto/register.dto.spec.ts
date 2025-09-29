import { validate } from 'class-validator';
import { RegisterDTO } from './register.dto';

describe('RegisterDTO', () => {
  describe('email validation', () => {
    it('should validate email format', async () => {
      // Valid case
      const validDto = new RegisterDTO();
      validDto.email = 'test@example.com';
      validDto.password = 'validpassword';
      validDto.firstName = 'John';
      validDto.lastName = 'Doe';

      const validErrors = await validate(validDto);
      expect(validErrors.filter(error => error.property === 'email')).toHaveLength(0);

      // Invalid case
      const invalidDto = new RegisterDTO();
      invalidDto.email = 'invalid-email';
      invalidDto.password = 'validpassword';
      invalidDto.firstName = 'John';
      invalidDto.lastName = 'Doe';

      const invalidErrors = await validate(invalidDto);
      const emailErrors = invalidErrors.filter(error => error.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });
  });

  describe('required fields validation', () => {
    it('should validate required fields', async () => {
      const emptyDto = new RegisterDTO();
      emptyDto.email = '';
      emptyDto.password = '';
      emptyDto.firstName = '';
      emptyDto.lastName = '';

      const errors = await validate(emptyDto);
      expect(errors.some(error => error.property === 'email')).toBe(true);
      expect(errors.some(error => error.property === 'password')).toBe(true);
      expect(errors.some(error => error.property === 'firstName')).toBe(true);
      expect(errors.some(error => error.property === 'lastName')).toBe(true);
    });
  });

  describe('complete validation', () => {
    it('should pass with valid data', async () => {
      const validDto = new RegisterDTO();
      validDto.email = 'user@example.com';
      validDto.password = 'securepassword123';
      validDto.firstName = 'María';
      validDto.lastName = 'González-López';

      const errors = await validate(validDto);
      expect(errors).toHaveLength(0);
    });
  });
});