import { validate } from 'class-validator';
import { UpdateUserDTO } from './update-user.dto';

describe('UpdateUserDTO Validation', () => {
  describe('Valid data', () => {
    it('should pass validation with empty DTO (all fields optional)', async () => {
      const dto = new UpdateUserDTO();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with only email', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'newemail@example.com';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with only password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = 'newPassword123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with only firstName', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'NewFirstName';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with only lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 'NewLastName';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with all fields provided', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'updated@example.com';
      dto.password = 'newSecurePassword';
      dto.firstName = 'UpdatedFirst';
      dto.lastName = 'UpdatedLast';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with complex valid data', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'user.name+tag@domain-name.co.uk';
      dto.password = 'MyNewSecurePassword!@#123';
      dto.firstName = 'María José';
      dto.lastName = 'González-Pérez';

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
        'spaces @example.com',
        'user@exam ple.com'
      ];

      for (const email of invalidEmails) {
        const dto = new UpdateUserDTO();
        dto.email = email;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'email')).toBe(true);
        expect(errors.some(e => e.constraints?.isEmail)).toBe(true);
      }
    });

    it('should fail validation with non-string email types', async () => {
      const invalidTypes = [123, true, {}, []];

      for (const email of invalidTypes) {
        const dto = new UpdateUserDTO();
        dto.email = email as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'email')).toBe(true);
      }
    });

    it('should pass validation with null email (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.email = null as any;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty string email (optional field)', async () => {
      const dto = new UpdateUserDTO();
      dto.email = '';

      const errors = await validate(dto);
      // Should fail because IsEmail doesn't accept empty strings
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'email')).toBe(true);
    });
  });

  describe('Invalid password', () => {
    it('should fail validation with non-string password', async () => {
      const invalidTypes = [123, true, {}, []];

      for (const password of invalidTypes) {
        const dto = new UpdateUserDTO();
        dto.password = password as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'password')).toBe(true);
        expect(errors.some(e => e.constraints?.isString)).toBe(true);
      }
    });

    it('should pass validation with null password (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.password = null as any;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty string password (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.password = '';

      const errors = await validate(dto);
      // Empty string should pass since IsOptional allows it for updates
      expect(errors.length).toBe(0);
    });
  });

  describe('Invalid firstName', () => {
    it('should fail validation with non-string firstName', async () => {
      const invalidTypes = [123, true, {}, []];

      for (const firstName of invalidTypes) {
        const dto = new UpdateUserDTO();
        dto.firstName = firstName as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'firstName')).toBe(true);
        expect(errors.some(e => e.constraints?.isString)).toBe(true);
      }
    });

    it('should pass validation with null firstName (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = null as any;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty string firstName (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Invalid lastName', () => {
    it('should fail validation with non-string lastName', async () => {
      const invalidTypes = [123, true, {}, []];

      for (const lastName of invalidTypes) {
        const dto = new UpdateUserDTO();
        dto.lastName = lastName as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'lastName')).toBe(true);
        expect(errors.some(e => e.constraints?.isString)).toBe(true);
      }
    });

    it('should pass validation with null lastName (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = null as any;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty string lastName (IsOptional allows it)', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Partial updates', () => {
    it('should validate individual field updates', async () => {
      const partialUpdates = [
        { email: 'new@example.com' },
        { password: 'newPassword' },
        { firstName: 'NewName' },
        { lastName: 'NewSurname' },
        { email: 'test@test.com', firstName: 'Test' },
        { password: 'pass', lastName: 'User' }
      ];

      for (const update of partialUpdates) {
        const dto = Object.assign(new UpdateUserDTO(), update);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should handle mixed valid and invalid fields', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'valid@example.com';
      dto.password = 123 as any; // Invalid
      dto.firstName = 'ValidName';
      dto.lastName = [] as any; // Invalid

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
      expect(errors.some(e => e.property === 'password')).toBe(true);
      expect(errors.some(e => e.property === 'lastName')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long valid strings', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'A'.repeat(100);
      dto.lastName = 'B'.repeat(100);
      dto.password = 'Password123!' + 'X'.repeat(100);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle special characters in names', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'José María';
      dto.lastName = "O'Connor-Smith";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});