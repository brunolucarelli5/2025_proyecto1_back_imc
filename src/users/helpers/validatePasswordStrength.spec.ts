import { BadRequestException } from '@nestjs/common';
import { validatePasswordStrength } from './validatePasswordStrength';

describe('validatePasswordStrength', () => {
  const validEmail = 'user@example.com';
  const validFirstName = 'John';
  const validLastName = 'Doe';

  describe('valid passwords', () => {
    it('should pass with strong passwords that meet all requirements', () => {
      const validPasswords = [
        'StrongP@ss123',
        'Valid1!x',
        'MySecure789!',
        'Complex#45Pass'
      ];

      validPasswords.forEach(password => {
        expect(() => {
          validatePasswordStrength(password, validEmail, validFirstName, validLastName);
        }).not.toThrow();
      });
    });
  });

  describe('length and character requirements', () => {
    it('should fail with insufficient length or missing character types', () => {
      const invalidPasswords = [
        { password: 'Short1!', reason: 'too short' },
        { password: 'invalid123!', reason: 'no uppercase' },
        { password: 'INVALID123!', reason: 'no lowercase' },
        { password: 'InvalidPass!', reason: 'no number' },
        { password: 'InvalidPass123', reason: 'no special char' }
      ];

      invalidPasswords.forEach(({ password }) => {
        expect(() => {
          validatePasswordStrength(password, validEmail, validFirstName, validLastName);
        }).toThrow(BadRequestException);
      });
    });

    it('should pass with exactly 8 characters meeting all requirements', () => {
      expect(() => {
        validatePasswordStrength('Valid1!x', validEmail, validFirstName, validLastName);
      }).not.toThrow();
    });
  });

  describe('personal information checks', () => {
    it('should fail when password contains personal information', () => {
      const personalInfoTests = [
        { password: 'ValidUser123!', email: 'user@example.com', reason: 'contains username' },
        { password: 'ValidJohn123!', firstName: 'John', reason: 'contains first name' },
        { password: 'ValidDoe123!', lastName: 'Doe', reason: 'contains last name' }
      ];

      personalInfoTests.forEach(({ password, email, firstName, lastName }) => {
        expect(() => {
          validatePasswordStrength(
            password,
            email || validEmail,
            firstName || validFirstName,
            lastName || validLastName
          );
        }).toThrow(BadRequestException);
      });
    });

    it('should be case insensitive for personal info and handle edge cases', () => {
      // Case insensitive check
      expect(() => {
        validatePasswordStrength('ValidJOHN123!', validEmail, 'john', validLastName);
      }).toThrow(BadRequestException);

      // Handle null/empty names
      expect(() => {
        validatePasswordStrength('ValidPass123!', validEmail, '', '');
      }).not.toThrow();

      expect(() => {
        validatePasswordStrength('ValidPass123!', validEmail, null as any, null as any);
      }).not.toThrow();
    });
  });

  describe('weak patterns detection', () => {
    it('should fail with common weak patterns', () => {
      const weakPatterns = [
        'TestPassword123!',
        'Valid123456!',
        'ValidQwerty1!'
      ];

      weakPatterns.forEach(password => {
        expect(() => {
          validatePasswordStrength(password, validEmail, validFirstName, validLastName);
        }).toThrow(BadRequestException);
      });
    });
  });

  describe('special characters support', () => {
    it('should accept various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];

      specialChars.forEach(char => {
        expect(() => {
          validatePasswordStrength(`Valid123${char}x`, validEmail, validFirstName, validLastName);
        }).not.toThrow();
      });
    });
  });
});