import { validate } from 'class-validator';
import { UpdateUserDTO } from './update-user.dto';

describe('UpdateUserDTO', () => {
  describe('email validation', () => {
    it('should pass with valid email', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'updated@example.com';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });

    it('should pass with undefined email (optional field)', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'John';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });

    it('should fail with invalid email format', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'invalid-email-format';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail with empty string email', async () => {
      const dto = new UpdateUserDTO();
      dto.email = '';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should pass with complex email format', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'user.name+tag@subdomain.example.org';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });
  });

  describe('password validation', () => {
    it('should pass with valid password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = 'newpassword123';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should pass with undefined password (optional field)', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'John';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should pass with special characters password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = 'N3w!P@ssw0rd#$%';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should pass with very long password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = 'p'.repeat(500);

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should pass with single character password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = '1';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should fail with non-string password', async () => {
      const dto = new UpdateUserDTO();
      dto.password = 123 as any;

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('firstName validation', () => {
    it('should pass with valid firstName', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'UpdatedName';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should pass with undefined firstName (optional field)', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 'Doe';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should pass with accented characters', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'José María';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should pass with single character', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'J';

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors).toHaveLength(0);
    });

    it('should fail with non-string firstName', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 123 as any;

      const errors = await validate(dto);
      const firstNameErrors = errors.filter(error => error.property === 'firstName');

      expect(firstNameErrors.length).toBeGreaterThan(0);
      expect(firstNameErrors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('lastName validation', () => {
    it('should pass with valid lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 'UpdatedLastName';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should pass with undefined lastName (optional field)', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'John';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should pass with hyphenated lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 'Smith-Johnson';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should pass with apostrophe lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = "O'Connor";

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should pass with spaces in lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 'Van Der Berg';

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors).toHaveLength(0);
    });

    it('should fail with non-string lastName', async () => {
      const dto = new UpdateUserDTO();
      dto.lastName = 456 as any;

      const errors = await validate(dto);
      const lastNameErrors = errors.filter(error => error.property === 'lastName');

      expect(lastNameErrors.length).toBeGreaterThan(0);
      expect(lastNameErrors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('complete validation scenarios', () => {
    it('should pass with all fields valid', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'newemail@example.com';
      dto.password = 'newpassword123';
      dto.firstName = 'María José';
      dto.lastName = 'García-López';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with empty DTO (all fields optional)', async () => {
      const dto = new UpdateUserDTO();

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with only one field', async () => {
      const dto = new UpdateUserDTO();
      dto.firstName = 'OnlyFirstName';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle mixed valid and invalid fields', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'invalid-email'; // invalid
      dto.password = 'validPassword123'; // valid
      dto.firstName = 'ValidName'; // valid
      dto.lastName = 123 as any; // invalid

      const errors = await validate(dto);

      expect(errors.length).toBe(2); // email and lastName errors
      expect(errors.some(error => error.property === 'email')).toBe(true);
      expect(errors.some(error => error.property === 'lastName')).toBe(true);
      expect(errors.some(error => error.property === 'password')).toBe(false);
      expect(errors.some(error => error.property === 'firstName')).toBe(false);
    });

    it('should handle boundary cases', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'a@b.co'; // minimal valid email
      dto.password = '1'; // minimal password
      dto.firstName = 'X'; // single character
      dto.lastName = 'Y'; // single character

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle maximum length scenarios', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      dto.password = 'p'.repeat(1000);
      dto.firstName = 'F'.repeat(200);
      dto.lastName = 'L'.repeat(200);

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});