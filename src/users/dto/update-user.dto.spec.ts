import { validate } from 'class-validator';
import { UpdateUserDTO } from './update-user.dto';

describe('UpdateUserDTO', () => {
  describe('email validation', () => {
    it('should pass with valid email and be optional', async () => {
      // Valid email case
      const dtoWithEmail = new UpdateUserDTO();
      dtoWithEmail.email = 'updated@example.com';

      const emailErrors = await validate(dtoWithEmail);
      const emailValidationErrors = emailErrors.filter(error => error.property === 'email');
      expect(emailValidationErrors).toHaveLength(0);

      // Optional field case
      const dtoWithoutEmail = new UpdateUserDTO();
      dtoWithoutEmail.firstName = 'John';

      const noEmailErrors = await validate(dtoWithoutEmail);
      const noEmailValidationErrors = noEmailErrors.filter(error => error.property === 'email');
      expect(noEmailValidationErrors).toHaveLength(0);
    });

    it('should fail with invalid email format', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'invalid-email-format';

      const errors = await validate(dto);
      const emailErrors = errors.filter(error => error.property === 'email');
      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });
  });

  describe('password validation', () => {
    it('should pass with valid password and be optional', async () => {
      // Valid password case
      const dtoWithPassword = new UpdateUserDTO();
      dtoWithPassword.password = 'newpassword123';

      const passwordErrors = await validate(dtoWithPassword);
      const passwordValidationErrors = passwordErrors.filter(error => error.property === 'password');
      expect(passwordValidationErrors).toHaveLength(0);

      // Optional field case
      const dtoWithoutPassword = new UpdateUserDTO();
      dtoWithoutPassword.firstName = 'John';

      const noPasswordErrors = await validate(dtoWithoutPassword);
      const noPasswordValidationErrors = noPasswordErrors.filter(error => error.property === 'password');
      expect(noPasswordValidationErrors).toHaveLength(0);
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
    it('should pass with valid firstName and be optional', async () => {
      // Valid firstName case
      const dtoWithFirstName = new UpdateUserDTO();
      dtoWithFirstName.firstName = 'UpdatedName';

      const firstNameErrors = await validate(dtoWithFirstName);
      const firstNameValidationErrors = firstNameErrors.filter(error => error.property === 'firstName');
      expect(firstNameValidationErrors).toHaveLength(0);

      // Optional field case
      const dtoWithoutFirstName = new UpdateUserDTO();
      dtoWithoutFirstName.lastName = 'Doe';

      const noFirstNameErrors = await validate(dtoWithoutFirstName);
      const noFirstNameValidationErrors = noFirstNameErrors.filter(error => error.property === 'firstName');
      expect(noFirstNameValidationErrors).toHaveLength(0);
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
    it('should pass with valid lastName and be optional', async () => {
      // Valid lastName case
      const dtoWithLastName = new UpdateUserDTO();
      dtoWithLastName.lastName = 'UpdatedLastName';

      const lastNameErrors = await validate(dtoWithLastName);
      const lastNameValidationErrors = lastNameErrors.filter(error => error.property === 'lastName');
      expect(lastNameValidationErrors).toHaveLength(0);

      // Optional field case
      const dtoWithoutLastName = new UpdateUserDTO();
      dtoWithoutLastName.firstName = 'John';

      const noLastNameErrors = await validate(dtoWithoutLastName);
      const noLastNameValidationErrors = noLastNameErrors.filter(error => error.property === 'lastName');
      expect(noLastNameValidationErrors).toHaveLength(0);
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

    it('should handle special characters and complex scenarios', async () => {
      const dto = new UpdateUserDTO();
      dto.email = 'user.name+tag@subdomain.example.org';
      dto.password = 'N3w!P@ssw0rd#$%';
      dto.firstName = 'José María';
      dto.lastName = "O'Connor-Smith Van Der Berg";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});