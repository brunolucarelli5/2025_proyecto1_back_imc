import { validate } from 'class-validator';
import { CalculoImcDto } from './calculo-imc.dto';

describe('CalculoImcDto Validation', () => {
  describe('Valid data', () => {
    it('should pass validation with valid basic data', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 1.75;
      dto.peso = 70;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with minimum and maximum allowed values', async () => {
      const minDto = new CalculoImcDto();
      minDto.altura = 0.01;
      minDto.peso = 0.01;

      const maxDto = new CalculoImcDto();
      maxDto.altura = 2.99;
      maxDto.peso = 499.99;

      const minErrors = await validate(minDto);
      const maxErrors = await validate(maxDto);

      expect(minErrors.length).toBe(0);
      expect(maxErrors.length).toBe(0);
    });

    it('should pass validation with decimal numbers', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 1.755;
      dto.peso = 68.23;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Invalid altura', () => {
    it('should fail validation when altura is zero or negative', async () => {
      const testCases = [0, -1, -0.01];

      for (const altura of testCases) {
        const dto = new CalculoImcDto();
        dto.altura = altura;
        dto.peso = 70;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.min).toBe('La altura debe ser mayor que 0');
      }
    });

    it('should fail validation when altura exceeds maximum', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 3.0;
      dto.peso = 70;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.max).toBe('La altura no puede ser mayor a 3 metros');
    });

    it('should fail validation with invalid altura types', async () => {
      const invalidValues = ['1.75', null, undefined, NaN];

      for (const altura of invalidValues) {
        const dto = new CalculoImcDto();
        dto.altura = altura as any;
        dto.peso = 70;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.isNumber).toBeDefined();
      }
    });
  });

  describe('Invalid peso', () => {
    it('should fail validation when peso is zero or negative', async () => {
      const testCases = [0, -1, -0.01];

      for (const peso of testCases) {
        const dto = new CalculoImcDto();
        dto.altura = 1.75;
        dto.peso = peso;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.min).toBe('El peso debe ser mayor que 0');
      }
    });

    it('should fail validation when peso exceeds maximum', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 1.75;
      dto.peso = 500;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.max).toBe('El peso no puede ser mayor a 500 kg');
    });

    it('should fail validation with invalid peso types', async () => {
      const invalidValues = ['70', null, undefined, NaN];

      for (const peso of invalidValues) {
        const dto = new CalculoImcDto();
        dto.altura = 1.75;
        dto.peso = peso as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.isNumber).toBeDefined();
      }
    });
  });

  describe('Multiple validation errors', () => {
    it('should handle multiple simultaneous errors', async () => {
      const dto = new CalculoImcDto();
      dto.altura = -1;
      dto.peso = -1;

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });

    it('should handle missing fields', async () => {
      const dto = new CalculoImcDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });

    it('should handle values exceeding limits', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 5.0;
      dto.peso = 600;

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
      expect(errors.some(e => e.constraints?.max?.includes('3 metros'))).toBe(true);
      expect(errors.some(e => e.constraints?.max?.includes('500 kg'))).toBe(true);
    });
  });
});