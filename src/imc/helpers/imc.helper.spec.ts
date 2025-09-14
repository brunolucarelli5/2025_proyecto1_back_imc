import { calcularIMC, calcularIMCRedondeado, redondearIMC } from './imc.helper';

describe('IMC Helper Functions', () => {
  describe('calcularIMC', () => {
    it('should calculate correct IMC for normal values', () => {
      expect(calcularIMC(70, 1.75)).toBeCloseTo(22.86, 2);
      expect(calcularIMC(80, 1.80)).toBeCloseTo(24.69, 2);
      expect(calcularIMC(60, 1.65)).toBeCloseTo(22.04, 2);
    });

    it('should handle edge case values correctly', () => {
      expect(calcularIMC(0.01, 0.01)).toBe(100);
      expect(calcularIMC(499.99, 2.99)).toBeCloseTo(55.93, 2);
      expect(calcularIMC(1, 1)).toBe(1);
    });

    it('should calculate different BMI categories', () => {
      // Bajo peso
      expect(calcularIMC(45, 1.75)).toBeCloseTo(14.69, 2);
      // Normal
      expect(calcularIMC(65, 1.70)).toBeCloseTo(22.49, 2);
      // Sobrepeso
      expect(calcularIMC(85, 1.75)).toBeCloseTo(27.76, 2);
      // Obeso
      expect(calcularIMC(100, 1.70)).toBeCloseTo(34.60, 2);
    });

    it('should maintain precision with decimal values', () => {
      expect(calcularIMC(70.5, 1.755)).toBeCloseTo(22.89, 2);
      expect(calcularIMC(68.23, 1.678)).toBeCloseTo(24.23, 2);
    });
  });

  describe('calcularIMCRedondeado', () => {
    it('should round to specified decimal places', () => {
      expect(calcularIMCRedondeado(70, 1.75, 0)).toBe(23);
      expect(calcularIMCRedondeado(70, 1.75, 1)).toBe(22.9);
      expect(calcularIMCRedondeado(70, 1.75, 2)).toBe(22.86);
      expect(calcularIMCRedondeado(70, 1.75, 3)).toBe(22.857);
    });

    it('should handle rounding edge cases', () => {
      expect(calcularIMCRedondeado(70.5, 1.755, 2)).toBe(22.89);
      expect(calcularIMCRedondeado(80.75, 1.825, 1)).toBe(24.2);
    });

    it('should work with extreme values', () => {
      expect(calcularIMCRedondeado(0.01, 0.01, 0)).toBe(100);
      expect(calcularIMCRedondeado(499.99, 2.99, 2)).toBe(55.93);
    });
  });

  describe('redondearIMC', () => {
    it('should round IMC values to specified decimals', () => {
      expect(redondearIMC(22.857142857, 0)).toBe(23);
      expect(redondearIMC(22.857142857, 1)).toBe(22.9);
      expect(redondearIMC(22.857142857, 2)).toBe(22.86);
      expect(redondearIMC(22.857142857, 3)).toBe(22.857);
    });

    it('should handle banker\'s rounding correctly', () => {
      expect(redondearIMC(22.5, 0)).toBe(23);
      expect(redondearIMC(23.5, 0)).toBe(24);
      expect(redondearIMC(22.125, 2)).toBe(22.13);
    });

    it('should work with edge values', () => {
      expect(redondearIMC(0, 2)).toBe(0);
      expect(redondearIMC(100, 2)).toBe(100);
      expect(redondearIMC(55.895456, 2)).toBe(55.9);
    });
  });
});