import { promedio, desviacion, contarCategorias } from './dashboard.helper';

describe('Dashboard Helper Functions', () => {
  describe('promedio', () => {
    it('should calculate average correctly for positive numbers', () => {
      expect(promedio([1, 2, 3, 4, 5])).toBe(3);
      expect(promedio([10, 20, 30])).toBe(20);
      expect(promedio([25.5, 30.2, 18.7])).toBe(24.8);
    });

    it('should handle single element array', () => {
      expect(promedio([42])).toBe(42);
      expect(promedio([0])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(promedio([])).toBe(0);
    });

    it('should handle decimal results with 2 decimal places', () => {
      expect(promedio([1, 2, 3])).toBe(2);
      expect(promedio([1, 2, 2])).toBe(1.67);
    });
  });

  describe('desviacion', () => {
    it('should calculate standard deviation correctly', () => {
      expect(desviacion([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
      expect(desviacion([1, 2, 3, 4, 5])).toBe(1.41);
    });

    it('should handle single element array', () => {
      expect(desviacion([5])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(desviacion([])).toBe(0);
    });

    it('should handle identical values', () => {
      expect(desviacion([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('contarCategorias', () => {
    it('should count categories correctly', () => {
      const categorias = ['Bajo peso', 'Normal', 'Sobrepeso', 'Obeso', 'Normal', 'Bajo peso'];
      const resultado = contarCategorias(categorias);

      expect(resultado.cantBajoPeso).toBe(2);
      expect(resultado.cantNormal).toBe(2);
      expect(resultado.cantSobrepeso).toBe(1);
      expect(resultado.cantObeso).toBe(1);
    });

    it('should handle empty array', () => {
      const resultado = contarCategorias([]);

      expect(resultado.cantBajoPeso).toBe(0);
      expect(resultado.cantNormal).toBe(0);
      expect(resultado.cantSobrepeso).toBe(0);
      expect(resultado.cantObeso).toBe(0);
    });

    it('should handle single category', () => {
      const resultado = contarCategorias(['Normal']);

      expect(resultado.cantBajoPeso).toBe(0);
      expect(resultado.cantNormal).toBe(1);
      expect(resultado.cantSobrepeso).toBe(0);
      expect(resultado.cantObeso).toBe(0);
    });
  });
});