import { validate } from 'class-validator';
import { CalculoImcDto } from './calculo-imc.dto';

describe('CalculoImcDto', () => {
  describe('altura validation', () => {
    it('should pass with valid altura values', async () => {
      const validAlturas = [0.01, 1.50, 1.75, 2.00, 2.99];

      for (const altura of validAlturas) {
        const dto = new CalculoImcDto();
        dto.altura = altura;
        dto.peso = 70;

        const errors = await validate(dto);
        const alturaErrors = errors.filter(error => error.property === 'altura');

        expect(alturaErrors).toHaveLength(0);
      }
    });

    it('should fail with altura below minimum', async () => {
      const invalidAlturas = [0, -1, -0.01];

      for (const altura of invalidAlturas) {
        const dto = new CalculoImcDto();
        dto.altura = altura;
        dto.peso = 70;

        const errors = await validate(dto);
        const alturaErrors = errors.filter(error => error.property === 'altura');

        expect(alturaErrors).toHaveLength(1);
        expect(alturaErrors[0].constraints).toHaveProperty('min');
      }
    });

    it('should fail with altura above maximum', async () => {
      const invalidAlturas = [3.00, 3.01, 5.00];

      for (const altura of invalidAlturas) {
        const dto = new CalculoImcDto();
        dto.altura = altura;
        dto.peso = 70;

        const errors = await validate(dto);
        const alturaErrors = errors.filter(error => error.property === 'altura');

        expect(alturaErrors).toHaveLength(1);
        expect(alturaErrors[0].constraints).toHaveProperty('max');
      }
    });

    it('should fail with non-numeric altura', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 'invalid' as any;
      dto.peso = 70;

      const errors = await validate(dto);
      const alturaErrors = errors.filter(error => error.property === 'altura');

      expect(alturaErrors.length).toBeGreaterThan(0);
      expect(alturaErrors[0].constraints).toHaveProperty('isNumber');
    });
  });

  describe('peso validation', () => {
    it('should pass with valid peso values', async () => {
      const validPesos = [0.01, 50, 70, 100, 200, 499.99];

      for (const peso of validPesos) {
        const dto = new CalculoImcDto();
        dto.altura = 1.75;
        dto.peso = peso;

        const errors = await validate(dto);
        const pesoErrors = errors.filter(error => error.property === 'peso');

        expect(pesoErrors).toHaveLength(0);
      }
    });

    it('should fail with peso below minimum', async () => {
      const invalidPesos = [0, -1, -0.01];

      for (const peso of invalidPesos) {
        const dto = new CalculoImcDto();
        dto.altura = 1.75;
        dto.peso = peso;

        const errors = await validate(dto);
        const pesoErrors = errors.filter(error => error.property === 'peso');

        expect(pesoErrors).toHaveLength(1);
        expect(pesoErrors[0].constraints).toHaveProperty('min');
      }
    });

    it('should fail with peso above maximum', async () => {
      const invalidPesos = [500, 500.01, 1000];

      for (const peso of invalidPesos) {
        const dto = new CalculoImcDto();
        dto.altura = 1.75;
        dto.peso = peso;

        const errors = await validate(dto);
        const pesoErrors = errors.filter(error => error.property === 'peso');

        expect(pesoErrors).toHaveLength(1);
        expect(pesoErrors[0].constraints).toHaveProperty('max');
      }
    });

    it('should fail with non-numeric peso', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 1.75;
      dto.peso = 'invalid' as any;

      const errors = await validate(dto);
      const pesoErrors = errors.filter(error => error.property === 'peso');

      expect(pesoErrors.length).toBeGreaterThan(0);
      expect(pesoErrors[0].constraints).toHaveProperty('isNumber');
    });
  });

  describe('boundary value analysis', () => {
    it('should handle exact boundary values', async () => {
      const boundaryTests = [
        { altura: 0.01, peso: 0.01 }, // minimum values
        { altura: 2.99, peso: 499.99 }, // maximum values
        { altura: 1.00, peso: 1.00 }, // round numbers
        { altura: 1.50, peso: 50.00 }, // typical values
      ];

      for (const test of boundaryTests) {
        const dto = new CalculoImcDto();
        dto.altura = test.altura;
        dto.peso = test.peso;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });

    it('should reject values just outside boundaries', async () => {
      const boundaryTests = [
        { altura: 0.009, peso: 70, expectedError: 'altura' },
        { altura: 3.001, peso: 70, expectedError: 'altura' },
        { altura: 1.75, peso: 0.009, expectedError: 'peso' },
        { altura: 1.75, peso: 500.001, expectedError: 'peso' },
      ];

      for (const test of boundaryTests) {
        const dto = new CalculoImcDto();
        dto.altura = test.altura;
        dto.peso = test.peso;

        const errors = await validate(dto);
        const fieldErrors = errors.filter(error => error.property === test.expectedError);

        expect(fieldErrors).toHaveLength(1);
      }
    });
  });

  describe('complete validation scenarios', () => {
    it('should pass with all valid fields', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 1.75;
      dto.peso = 70;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail with all invalid fields', async () => {
      const dto = new CalculoImcDto();
      dto.altura = -1;
      dto.peso = -1;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'altura')).toBe(true);
      expect(errors.some(error => error.property === 'peso')).toBe(true);
    });

    it('should handle decimal precision correctly', async () => {
      const dto = new CalculoImcDto();
      dto.altura = 1.755555; // many decimals
      dto.peso = 70.999999; // many decimals

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});