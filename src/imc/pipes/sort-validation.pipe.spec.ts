import { BadRequestException } from '@nestjs/common';
import { SortValidationPipe } from './sort-validation.pipe';

describe('SortValidationPipe', () => {
  let pipe: SortValidationPipe;

  beforeEach(() => {
    pipe = new SortValidationPipe();
  });

  describe('valid inputs', () => {
    it('should return "asc" when input is "asc"', () => {
      expect(pipe.transform('asc')).toBe('asc');
    });

    it('should return "desc" when input is "desc"', () => {
      expect(pipe.transform('desc')).toBe('desc');
    });

    it('should handle uppercase inputs', () => {
      expect(pipe.transform('ASC')).toBe('asc');
      expect(pipe.transform('DESC')).toBe('desc');
    });

    it('should handle mixed case inputs', () => {
      expect(pipe.transform('AsC')).toBe('asc');
      expect(pipe.transform('DeSc')).toBe('desc');
    });
  });

  describe('default values', () => {
    it('should return "desc" when input is undefined', () => {
      expect(pipe.transform(undefined)).toBe('desc');
    });

    it('should return "desc" when input is null', () => {
      expect(pipe.transform(null)).toBe('desc');
    });

    it('should return "desc" when input is empty string', () => {
      expect(pipe.transform('')).toBe('desc');
    });
  });

  describe('invalid inputs', () => {
    it('should throw BadRequestException for invalid string', () => {
      expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
      expect(() => pipe.transform('invalid')).toThrow(`'invalid' no es un valor válido para sort. Usá 'asc' o 'desc'.`);
    });

    it('should throw BadRequestException for number input', () => {
      expect(() => pipe.transform(123)).toThrow(BadRequestException);
      expect(() => pipe.transform(123)).toThrow(`'123' no es un valor válido para sort. Usá 'asc' o 'desc'.`);
    });

    it('should throw BadRequestException for boolean input', () => {
      expect(() => pipe.transform(true)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for object input', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for array input', () => {
      expect(() => pipe.transform([])).toThrow(BadRequestException);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only strings', () => {
      expect(() => pipe.transform('   ')).toThrow(BadRequestException);
    });

    it('should handle strings with extra whitespace', () => {
      expect(() => pipe.transform(' asc ')).toThrow(BadRequestException);
    });

    it('should handle partial matches', () => {
      expect(() => pipe.transform('as')).toThrow(BadRequestException);
      expect(() => pipe.transform('ascending')).toThrow(BadRequestException);
      expect(() => pipe.transform('descending')).toThrow(BadRequestException);
    });
  });
});