import { validate } from 'class-validator';
import { UpdateUserDTO } from './update-user.dto';

describe('UpdateUserDTO', () => {
  describe('field validation', () => {
    it('should validate optional fields', async () => {
      // All optional fields valid
      const dto = new UpdateUserDTO();
      dto.email = 'updated@example.com';
      dto.firstName = 'UpdatedName';
      dto.lastName = 'UpdatedLastName';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid email format', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'invalid-email-format';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail with non-string types', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 123 as any;
      dto.lastName = 456 as any;

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'firstName')).toBe(true);
      expect(errors.some(error => error.property === 'lastName')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should pass with empty DTO (all fields optional)', async () => {
      const dto = new UpdateUserDTO();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});