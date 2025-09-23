import { validate } from 'class-validator';
import { RegisterDTO } from './register.dto';

describe('RegisterDTO', () => {
  describe('email validation', () => {
    it('should pass with valid email', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });

    it('should fail with invalid email format', async () => {
      const dto = new RegisterDTO();
      dto.email = 'invalid-email';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
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

    it('should pass with complex email format', async () => {
      const dto = new RegisterDTO();
      dto.email = 'user+tag@subdomain.example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });

    it('should fail with missing @ symbol', async () => {
      const dto = new RegisterDTO();
      dto.email = 'userexample.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(1);
    });
  });

  describe('password validation', () => {
    it('should pass with valid password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword123';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should fail with empty password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = '';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(1);
      expect(passwordErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail with null password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = null as any;
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
    });

    it('should pass with special characters in password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'P@ssw0rd!#$%';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should pass with very long password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'a'.repeat(1000);
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });
  });

  describe('firstName validation', () => {
    it('should pass with valid firstName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should fail with empty firstName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = '';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(1);
      expect(firstNameErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass with single character firstName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'J';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should pass with accented characters', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'José';
      dto.lastName = 'García';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should pass with very long firstName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'A'.repeat(100);
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });
  });

  describe('lastName validation', () => {
    it('should pass with valid lastName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should fail with empty lastName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = '';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(1);
      expect(lastNameErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass with hyphenated lastName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = 'Smith-Jones';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should pass with apostrophe in lastName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validpassword';
      dto.firstName = 'John';
      dto.lastName = "O'Connor";

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });
  });

  describe('complete validation scenarios', () => {
    it('should pass with all valid fields', async () => {
      const dto = new RegisterDTO();
      dto.email = 'user@example.com';
      dto.password = 'securepassword123';
      dto.firstName = 'María';
      dto.lastName = 'González-López';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail with all empty fields', async () => {
      const dto = new RegisterDTO();
      dto.email = '';
      dto.password = '';
      dto.firstName = '';
      dto.lastName = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'email')).toBe(true);
      expect(errors.some(error => error.property === 'password')).toBe(true);
      expect(errors.some(error => error.property === 'firstName')).toBe(true);
      expect(errors.some(error => error.property === 'lastName')).toBe(true);
    });

    it('should handle boundary cases for all fields', async () => {
      const dto = new RegisterDTO();
      dto.email = 'a@b.co'; // minimal valid email
      dto.password = '1'; // minimal password
      dto.firstName = 'X'; // single character
      dto.lastName = 'Y'; // single character

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});