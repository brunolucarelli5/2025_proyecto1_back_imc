import { BadRequestException } from '@nestjs/common';
import { SortValidationPipe } from './sort-validation.pipe';

describe('SortValidationPipe', () => {
  let pipe: SortValidationPipe;

  beforeEach(() => {
    pipe = new SortValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('Valid inputs', () => {
    it('should return "desc" for undefined input', () => {
      expect(pipe.transform(undefined)).toBe('desc');
    });

    it('should return "desc" for null input', () => {
      expect(pipe.transform(null)).toBe('desc');
    });

    it('should return "desc" for empty string', () => {
      expect(pipe.transform('')).toBe('desc');
    });

    it('should return "asc" for valid asc input', () => {
      expect(pipe.transform('asc')).toBe('asc');
    });

    it('should return "desc" for valid desc input', () => {
      expect(pipe.transform('desc')).toBe('desc');
    });

    it('should handle case-insensitive valid inputs', () => {
      expect(pipe.transform('ASC')).toBe('asc');
      expect(pipe.transform('DESC')).toBe('desc');
      expect(pipe.transform('Asc')).toBe('asc');
      expect(pipe.transform('Desc')).toBe('desc');
      expect(pipe.transform('aSc')).toBe('asc');
      expect(pipe.transform('dEsC')).toBe('desc');
    });

    it('should convert numbers to strings and validate', () => {
      // This tests the String() conversion
      const mockNumber = {
        toString: () => 'asc'
      };
      expect(pipe.transform(mockNumber)).toBe('asc');
    });
  });

  describe('Invalid inputs', () => {
    it('should throw BadRequestException for invalid string values', () => {
      const invalidValues = [
        'invalid',
        'ascending',
        'descending',
        '123',
        'true',
        'false',
        'up',
        'down',
        ' asc ',
        ' desc '
      ];

      invalidValues.forEach(value => {
        expect(() => pipe.transform(value)).toThrow(BadRequestException);
        expect(() => pipe.transform(value)).toThrow(
          `'${value}' no es un valor válido para sort. Usá 'asc' o 'desc'.`
        );
      });
    });

    it('should throw BadRequestException for numeric values', () => {
      const numericValues = [0, 1, -1, 123, 456.789];

      numericValues.forEach(value => {
        expect(() => pipe.transform(value)).toThrow(BadRequestException);
        expect(() => pipe.transform(value)).toThrow(
          `'${value}' no es un valor válido para sort. Usá 'asc' o 'desc'.`
        );
      });
    });

    it('should throw BadRequestException for boolean values', () => {
      expect(() => pipe.transform(true)).toThrow(BadRequestException);
      expect(() => pipe.transform(false)).toThrow(BadRequestException);
      expect(() => pipe.transform(true)).toThrow(
        `'true' no es un valor válido para sort. Usá 'asc' o 'desc'.`
      );
    });

    it('should throw BadRequestException for object values', () => {
      const objectValuesThatThrow = [
        {},           // String({}) = "[object Object]"
        { sort: 'asc' }, // String({sort: 'asc'}) = "[object Object]"
        new Date(),   // String(new Date()) = date string, invalid
        /regex/       // String(/regex/) = "/regex/", invalid
      ];

      objectValuesThatThrow.forEach(value => {
        expect(() => pipe.transform(value)).toThrow(BadRequestException);
      });
    });

    it('should handle special array cases', () => {
      // String([]) returns "", but [] is not strictly equal to "", so it should throw
      expect(() => pipe.transform([])).toThrow(BadRequestException);

      // String(['asc']) returns "asc", which is valid
      expect(pipe.transform(['asc'])).toBe('asc');

      // String(['desc']) returns "desc", which is valid
      expect(pipe.transform(['desc'])).toBe('desc');

      // String(['invalid']) should throw error
      expect(() => pipe.transform(['invalid'])).toThrow(BadRequestException);
    });

    it('should handle edge cases with whitespace', () => {
      const whitespaceValues = [' ', '\t', '\n', '\r\n', '  asc  ', '  desc  '];

      whitespaceValues.forEach(value => {
        expect(() => pipe.transform(value)).toThrow(BadRequestException);
      });
    });
  });

  describe('Type coercion behavior', () => {
    it('should convert values to strings before validation', () => {
      // Test that String() conversion works as expected
      const testObject = {
        toString: () => 'desc'
      };
      expect(pipe.transform(testObject)).toBe('desc');
    });

    it('should handle Symbol values by throwing error', () => {
      const symbolValue = Symbol('test');
      // Symbol cannot be converted to string with String() and will throw TypeError
      expect(() => pipe.transform(symbolValue)).toThrow();
    });
  });

  describe('Return type validation', () => {
    it('should always return type "asc" | "desc"', () => {
      const result1 = pipe.transform('asc');
      const result2 = pipe.transform('desc');
      const result3 = pipe.transform(undefined);

      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
      expect(typeof result3).toBe('string');

      expect(['asc', 'desc']).toContain(result1);
      expect(['asc', 'desc']).toContain(result2);
      expect(['asc', 'desc']).toContain(result3);
    });
  });
});