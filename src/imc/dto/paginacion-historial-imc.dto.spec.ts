import { validate } from 'class-validator';
import { PaginacionHistorialImcDto } from './paginacion-historial-imc.dto';

describe('PaginacionHistorialImcDto', () => {
  describe('pag validation', () => {
    it('should use default value 1 when not provided', async () => {
      const dto = new PaginacionHistorialImcDto();

      expect(dto.pag).toBe(1);

      const errors = await validate(dto);
      const pagErrors = errors.filter(error => error.property === 'pag');

      expect(pagErrors).toHaveLength(0);
    });

    it('should pass with valid pag values', async () => {
      const validPages = [1, 2, 5, 10, 100, 1000];

      for (const pag of validPages) {
        const dto = new PaginacionHistorialImcDto();
        dto.pag = pag;

        const errors = await validate(dto);
        const pagErrors = errors.filter(error => error.property === 'pag');

        expect(pagErrors).toHaveLength(0);
      }
    });

    it('should fail with pag less than 1', async () => {
      const invalidPages = [0, -1, -10];

      for (const pag of invalidPages) {
        const dto = new PaginacionHistorialImcDto();
        dto.pag = pag;

        const errors = await validate(dto);
        const pagErrors = errors.filter(error => error.property === 'pag');

        expect(pagErrors).toHaveLength(1);
        expect(pagErrors[0].constraints).toHaveProperty('min');
      }
    });

    it('should fail with non-integer pag values', async () => {
      const invalidPages = [1.5, 2.7, 0.9];

      for (const pag of invalidPages) {
        const dto = new PaginacionHistorialImcDto();
        dto.pag = pag;

        const errors = await validate(dto);
        const pagErrors = errors.filter(error => error.property === 'pag');

        expect(pagErrors).toHaveLength(1);
        expect(pagErrors[0].constraints).toHaveProperty('isInt');
      }
    });
  });

  describe('mostrar validation', () => {
    it('should use default value 5 when not provided', async () => {
      const dto = new PaginacionHistorialImcDto();

      expect(dto.mostrar).toBe(5);

      const errors = await validate(dto);
      const mostrarErrors = errors.filter(error => error.property === 'mostrar');

      expect(mostrarErrors).toHaveLength(0);
    });

    it('should pass with valid mostrar values', async () => {
      const validSizes = [1, 5, 10, 25, 50, 100];

      for (const mostrar of validSizes) {
        const dto = new PaginacionHistorialImcDto();
        dto.mostrar = mostrar;

        const errors = await validate(dto);
        const mostrarErrors = errors.filter(error => error.property === 'mostrar');

        expect(mostrarErrors).toHaveLength(0);
      }
    });

    it('should fail with mostrar less than 1', async () => {
      const invalidSizes = [0, -1, -5];

      for (const mostrar of invalidSizes) {
        const dto = new PaginacionHistorialImcDto();
        dto.mostrar = mostrar;

        const errors = await validate(dto);
        const mostrarErrors = errors.filter(error => error.property === 'mostrar');

        expect(mostrarErrors).toHaveLength(1);
        expect(mostrarErrors[0].constraints).toHaveProperty('min');
      }
    });

    it('should fail with non-integer mostrar values', async () => {
      const invalidSizes = [1.5, 2.7, 0.9];

      for (const mostrar of invalidSizes) {
        const dto = new PaginacionHistorialImcDto();
        dto.mostrar = mostrar;

        const errors = await validate(dto);
        const mostrarErrors = errors.filter(error => error.property === 'mostrar');

        expect(mostrarErrors).toHaveLength(1);
        expect(mostrarErrors[0].constraints).toHaveProperty('isInt');
      }
    });
  });

  describe('sort field', () => {
    it('should be optional', async () => {
      const dto = new PaginacionHistorialImcDto();
      // sort is not set, should remain undefined

      expect(dto.sort).toBeUndefined();

      const errors = await validate(dto);
      const sortErrors = errors.filter(error => error.property === 'sort');

      expect(sortErrors).toHaveLength(0);
    });

    it('should accept string values', async () => {
      const dto = new PaginacionHistorialImcDto();
      dto.sort = 'asc';

      const errors = await validate(dto);
      const sortErrors = errors.filter(error => error.property === 'sort');

      expect(sortErrors).toHaveLength(0);
    });
  });

  describe('boundary value analysis', () => {
    it('should handle minimum valid values', async () => {
      const dto = new PaginacionHistorialImcDto();
      dto.pag = 1;
      dto.mostrar = 1;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle large valid values', async () => {
      const dto = new PaginacionHistorialImcDto();
      dto.pag = 9999;
      dto.mostrar = 1000;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject values just below minimum', async () => {
      const dto = new PaginacionHistorialImcDto();
      dto.pag = 0;
      dto.mostrar = 0;

      const errors = await validate(dto);

      expect(errors.length).toBe(2);
      expect(errors.some(error => error.property === 'pag')).toBe(true);
      expect(errors.some(error => error.property === 'mostrar')).toBe(true);
    });
  });

  describe('complete validation scenarios', () => {
    it('should pass with all default values', async () => {
      const dto = new PaginacionHistorialImcDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.pag).toBe(1);
      expect(dto.mostrar).toBe(5);
    });

    it('should pass with all custom valid values', async () => {
      const dto = new PaginacionHistorialImcDto();
      dto.pag = 3;
      dto.mostrar = 10;
      dto.sort = 'desc';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle mixed valid and invalid values', async () => {
      const dto = new PaginacionHistorialImcDto();
      dto.pag = -1; // invalid
      dto.mostrar = 10; // valid

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pag');
    });

    it('should handle type conversion correctly', async () => {
      const dto = new PaginacionHistorialImcDto();
      // Simulate what happens when Type() decorator converts strings to numbers
      dto.pag = parseInt('5');
      dto.mostrar = parseInt('15');

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.pag).toBe(5);
      expect(dto.mostrar).toBe(15);
    });
  });
});