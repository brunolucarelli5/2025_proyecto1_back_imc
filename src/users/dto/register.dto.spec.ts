import { validate } from 'class-validator';
import { RegisterDTO } from './register.dto';

describe('RegisterDTO Validation', () => {
  describe('Valid data', () => {
    it('should pass validation with valid basic data', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validPassword123';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with complex valid data', async () => {
      const dto = new RegisterDTO();
      dto.email = 'user.name+tag@domain-name.co.uk';
      dto.password = 'MySecurePassword!@#123';
      dto.firstName = 'María José';
      dto.lastName = 'González-Pérez';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with edge case names', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@test.com';
      dto.password = 'password';
      dto.firstName = 'X';
      dto.lastName = 'Y';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Invalid email', () => {
    it('should fail validation with invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        '',
        'spaces @example.com',
        'user@exam ple.com'
      ];

      for (const email of invalidEmails) {
        const dto = new RegisterDTO();
        dto.email = email;
        dto.password = 'validPassword';
        dto.firstName = 'John';
        dto.lastName = 'Doe';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'email')).toBe(true);
      }
    });

    it('should fail validation with non-string email types', async () => {
      const dto = new RegisterDTO();
      dto.email = 123 as any;
      dto.password = 'validPassword';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'email')).toBe(true);
    });
  });

  describe('Invalid password', () => {
    it('should fail validation with empty password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = '';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'password' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail validation with non-string password', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 123 as any;
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'password' && e.constraints?.isString)).toBe(true);
    });

    it('should fail validation with null or undefined password', async () => {
      const testValues = [null, undefined];

      for (const password of testValues) {
        const dto = new RegisterDTO();
        dto.email = 'test@example.com';
        dto.password = password as any;
        dto.firstName = 'John';
        dto.lastName = 'Doe';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'password')).toBe(true);
      }
    });
  });

  describe('Invalid firstName', () => {
    it('should fail validation with empty firstName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validPassword';
      dto.firstName = '';
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'firstName' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail validation with non-string firstName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validPassword';
      dto.firstName = 123 as any;
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'firstName' && e.constraints?.isString)).toBe(true);
    });
  });

  describe('Invalid lastName', () => {
    it('should fail validation with empty lastName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validPassword';
      dto.firstName = 'John';
      dto.lastName = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'lastName' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail validation with non-string lastName', async () => {
      const dto = new RegisterDTO();
      dto.email = 'test@example.com';
      dto.password = 'validPassword';
      dto.firstName = 'John';
      dto.lastName = 123 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'lastName' && e.constraints?.isString)).toBe(true);
    });
  });

  describe('Multiple validation errors', () => {
    it('should handle multiple simultaneous errors', async () => {
      const dto = new RegisterDTO();
      dto.email = 'invalid-email';
      dto.password = '';
      dto.firstName = '';
      dto.lastName = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(4);

      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('email');
      expect(errorProperties).toContain('password');
      expect(errorProperties).toContain('firstName');
      expect(errorProperties).toContain('lastName');
    });

    it('should handle missing fields', async () => {
      const dto = new RegisterDTO();
      // Don't set any fields

      const errors = await validate(dto);
      expect(errors.length).toBe(4);
    });

    it('should provide descriptive error messages', async () => {
      const dto = new RegisterDTO();
      dto.email = 'invalid';
      dto.password = '';
      dto.firstName = 123 as any;
      dto.lastName = null as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Check that errors have constraints
      errors.forEach(error => {
        expect(error.constraints).toBeDefined();
        expect(Object.keys(error.constraints || {}).length).toBeGreaterThan(0);
      });
    });
  });
});