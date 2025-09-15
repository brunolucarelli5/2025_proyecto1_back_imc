import { validate } from 'class-validator';
import { UpdateUserDTO } from './update-user.dto';

describe('UpdateUserDTO Validation', () => {
  describe('Valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'updated@example.com';
      dto.password = 'newPassword123';
      dto.firstName = 'Updated';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with partial updates', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'NewName';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty DTO (all optional)', async () => {
      const dto = new UpdateUserDTO();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Invalid email', () => {
    it('should fail validation with invalid email format', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'email')).toBe(true);
    });

    it('should fail validation with empty string email', async () => {
      const dto = new UpdateUserDTO();
      dto.email = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'email')).toBe(true);
    });
  });

  describe('Invalid password', () => {
    it('should fail validation with non-string password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = 123 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'password')).toBe(true);
    });
  });

  describe('Invalid firstName', () => {
    it('should fail validation with non-string firstName', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 123 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'firstName')).toBe(true);
    });
  });

  describe('Invalid lastName', () => {
    it('should fail validation with non-string lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 123 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'lastName')).toBe(true);
    });
  });

  describe('Mixed scenarios', () => {
    it('should handle multiple field updates', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'new@example.com';
      dto.firstName = 'New';
      dto.lastName = 'Name';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with multiple invalid fields', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'invalid-email';
      dto.firstName = 123 as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'email')).toBe(true);
      expect(errors.some(e => e.property === 'firstName')).toBe(true);
    });
  });
});