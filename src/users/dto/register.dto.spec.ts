import { validate } from 'class-validator';
import { RegisterDTO } from './register.dto';

describe('RegisterDTO', () => {
  describe('email validation', () => {
    it('should pass with valid email and fail with invalid email', async () => {
      // Valid case
      const validDto = new RegisterDTO();
      validDto.email = 'test@example.com';
      validDto.password = 'validpassword';
      validDto.firstName = 'John';
      validDto.lastName = 'Doe';

      const validErrors = await validate(validDto);
      const validEmailErrors = validErrors.filter(error => error.property === 'email');
      expect(validEmailErrors).toHaveLength(0);

      // Invalid case
      const invalidDto = new RegisterDTO();
      invalidDto.email = 'invalid-email';
      invalidDto.password = 'validpassword';
      invalidDto.firstName = 'John';
      invalidDto.lastName = 'Doe';

      const invalidErrors = await validate(invalidDto);
      const invalidEmailErrors = invalidErrors.filter(error => error.property === 'email');
      expect(invalidEmailErrors).toHaveLength(1);
      expect(invalidEmailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail with empty email', async () => {
      const dto = new RegisterDTO();
      dto.email = '';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });
  });

  describe('password validation', () => {
    it('should pass with valid password and fail with empty password', async () => {
      // Valid case
      const validDto = new RegisterDTO();
      validDto.email = 'test@example.com';
      validDto.password = 'validpassword123';
      validDto.firstName = 'John';
      validDto.lastName = 'Doe';

      const validErrors = await validate(validDto);
      const validPasswordErrors = validErrors.filter(error => error.property === 'password');
      expect(validPasswordErrors).toHaveLength(0);

      // Empty case
      const emptyDto = new RegisterDTO();
      emptyDto.email = 'test@example.com';
      emptyDto.password = '';
      emptyDto.firstName = 'John';
      emptyDto.lastName = 'Doe';

      const emptyErrors = await validate(emptyDto);
      const emptyPasswordErrors = emptyErrors.filter(error => error.property === 'password');
      expect(emptyPasswordErrors).toHaveLength(1);
      expect(emptyPasswordErrors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('firstName validation', () => {
    it('should pass with valid firstName and fail with empty firstName', async () => {
      // Valid case
      const validDto = new RegisterDTO();
      validDto.email = 'test@example.com';
      validDto.password = 'validpassword';
      validDto.firstName = 'John';
      validDto.lastName = 'Doe';

      const validErrors = await validate(validDto);
      const validFirstNameErrors = validErrors.filter(error => error.property === 'firstName');
      expect(validFirstNameErrors).toHaveLength(0);

      // Empty case
      const emptyDto = new RegisterDTO();
      emptyDto.email = 'test@example.com';
      emptyDto.password = 'validpassword';
      emptyDto.firstName = '';
      emptyDto.lastName = 'Doe';

      const emptyErrors = await validate(emptyDto);
      const emptyFirstNameErrors = emptyErrors.filter(error => error.property === 'firstName');
      expect(emptyFirstNameErrors).toHaveLength(1);
      expect(emptyFirstNameErrors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('lastName validation', () => {
    it('should pass with valid lastName and fail with empty lastName', async () => {
      // Valid case
      const validDto = new RegisterDTO();
      validDto.email = 'test@example.com';
      validDto.password = 'validpassword';
      validDto.firstName = 'John';
      validDto.lastName = 'Doe';

      const validErrors = await validate(validDto);
      const validLastNameErrors = validErrors.filter(error => error.property === 'lastName');
      expect(validLastNameErrors).toHaveLength(0);

      // Empty case
      const emptyDto = new RegisterDTO();
      emptyDto.email = 'test@example.com';
      emptyDto.password = 'validpassword';
      emptyDto.firstName = 'John';
      emptyDto.lastName = '';

      const emptyErrors = await validate(emptyDto);
      const emptyLastNameErrors = emptyErrors.filter(error => error.property === 'lastName');
      expect(emptyLastNameErrors).toHaveLength(1);
      expect(emptyLastNameErrors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('complete validation scenarios', () => {
    it('should handle complete validation scenarios', async () => {
      // All valid fields
      const validDto = new RegisterDTO();
      validDto.email = 'user@example.com';
      validDto.password = 'securepassword123';
      validDto.firstName = 'María';
      validDto.lastName = 'González-López';

      let errors = await validate(validDto);
      expect(errors).toHaveLength(0);

      // All empty fields
      const emptyDto = new RegisterDTO();
      emptyDto.email = '';
      emptyDto.password = '';
      emptyDto.firstName = '';
      emptyDto.lastName = '';

      errors = await validate(emptyDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'email')).toBe(true);
      expect(errors.some(error => error.property === 'password')).toBe(true);
      expect(errors.some(error => error.property === 'firstName')).toBe(true);
      expect(errors.some(error => error.property === 'lastName')).toBe(true);

      // Special characters
      const specialDto = new RegisterDTO();
      specialDto.email = 'user+tag@subdomain.example.com';
      specialDto.password = 'P@ssw0rd!#$%';
      specialDto.firstName = 'José';
      specialDto.lastName = "O'Connor-Smith";

      errors = await validate(specialDto);
      expect(errors).toHaveLength(0);
    });
  });
});