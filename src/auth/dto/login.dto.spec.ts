import { validate } from 'class-validator';
import { LoginDTO } from './login.dto';

describe('LoginDTO Validation', () => {
  describe('Valid data', () => {
    it('should pass validation with valid credentials', async () => {
      const dto = new LoginDTO();
      dto.email = 'test@example.com';
      dto.password = 'validPassword123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with complex valid email', async () => {
      const dto = new LoginDTO();
      dto.email = 'user.name+tag@domain-name.co.uk';
      dto.password = 'MySecurePassword!@#123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with simple credentials', async () => {
      const dto = new LoginDTO();
      dto.email = 'user@test.com';
      dto.password = 'pass';

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
        'user@exam ple.com',
        'plaintext',
        'user@',
        '@domain.com'
      ];

      for (const email of invalidEmails) {
        const dto = new LoginDTO();
        dto.email = email;
        dto.password = 'validPassword';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'email')).toBe(true);
        expect(errors.some(e => e.constraints?.isEmail)).toBe(true);
      }
    });

    it('should fail validation with non-string email types', async () => {
      const invalidTypes = [123, true, {}, [], null, undefined];

      for (const email of invalidTypes) {
        const dto = new LoginDTO();
        dto.email = email as any;
        dto.password = 'validPassword';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'email')).toBe(true);
      }
    });
  });

  describe('Invalid password', () => {
    it('should fail validation with empty password', async () => {
      const dto = new LoginDTO();
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'password' && e.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail validation with non-string password', async () => {
      const invalidTypes = [123, true, {}, [], null, undefined];

      for (const password of invalidTypes) {
        const dto = new LoginDTO();
        dto.email = 'test@example.com';
        dto.password = password as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'password')).toBe(true);
      }
    });

    it('should pass validation with whitespace-only password (IsNotEmpty allows it)', async () => {
      const whitespacePasswords = [' ', '   ', '\t', '\n', '\r\n'];

      for (const password of whitespacePasswords) {
        const dto = new LoginDTO();
        dto.email = 'test@example.com';
        dto.password = password;

        const errors = await validate(dto);
        // IsNotEmpty allows whitespace-only strings as they are not empty
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('Multiple validation errors', () => {
    it('should handle multiple simultaneous errors', async () => {
      const dto = new LoginDTO();
      dto.email = 'invalid-email';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(2);

      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('email');
      expect(errorProperties).toContain('password');
    });

    it('should handle missing fields', async () => {
      const dto = new LoginDTO();
      // Don't set any fields

      const errors = await validate(dto);
      expect(errors.length).toBe(2);

      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('email');
      expect(errorProperties).toContain('password');
    });

    it('should provide descriptive error messages', async () => {
      const dto = new LoginDTO();
      dto.email = 'invalid';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Check that errors have constraints
      errors.forEach(error => {
        expect(error.constraints).toBeDefined();
        expect(Object.keys(error.constraints || {}).length).toBeGreaterThan(0);
      });

      // Check specific constraint types
      const emailError = errors.find(e => e.property === 'email');
      expect(emailError?.constraints?.isEmail).toBeDefined();

      const passwordError = errors.find(e => e.property === 'password');
      expect(passwordError?.constraints?.isNotEmpty).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle extremely long valid credentials', async () => {
      const dto = new LoginDTO();
      dto.email = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      dto.password = 'P'.repeat(100) + '!123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle special characters in password', async () => {
      const specialPasswords = [
        'password!@#$%^&*()',
        'pássword123',
        'パスワード123',
        'пароль123'
      ];

      for (const password of specialPasswords) {
        const dto = new LoginDTO();
        dto.email = 'test@example.com';
        dto.password = password;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should handle case sensitivity correctly', async () => {
      const dto = new LoginDTO();
      dto.email = 'TEST@EXAMPLE.COM';
      dto.password = 'CaseSensitivePassword';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Security considerations', () => {
    it('should allow passwords with various security patterns', async () => {
      const securePasswords = [
        'MyP@ssw0rd!',
        'longerPasswordWithNumbers123',
        'sh0rt!',
        'mix3d-Ch@rs&Numbers123'
      ];

      for (const password of securePasswords) {
        const dto = new LoginDTO();
        dto.email = 'secure@example.com';
        dto.password = password;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should not impose password strength requirements in DTO validation', async () => {
      // This test ensures that weak passwords are allowed in the DTO
      // Password strength should be validated elsewhere in the application
      const weakPasswords = [
        '123',
        'password',
        'abc',
        'qwerty'
      ];

      for (const password of weakPasswords) {
        const dto = new LoginDTO();
        dto.email = 'test@example.com';
        dto.password = password;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });
});