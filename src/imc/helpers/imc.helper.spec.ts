import { calcularIMC, calcularIMCRedondeado, redondearIMC } from './imc.helper';

describe('IMC Helper Functions', () => {
  describe('calcularIMC', () => {
    describe('normal cases', () => {
      it('should calculate IMC correctly for normal values', () => {
        expect(calcularIMC(70, 1.75)).toBeCloseTo(22.86, 2);
        expect(calcularIMC(60, 1.65)).toBeCloseTo(22.04, 2);
        expect(calcularIMC(80, 1.80)).toBeCloseTo(24.69, 2);
      });

      it('should handle decimal weights and heights', () => {
        expect(calcularIMC(65.5, 1.72)).toBeCloseTo(22.14, 2);
        expect(calcularIMC(70.2, 1.78)).toBeCloseTo(22.16, 2);
      });
    });

    describe('boundary values', () => {
      it('should handle minimum valid values', () => {
        expect(calcularIMC(0.01, 0.01)).toBe(100);
        expect(calcularIMC(1, 1)).toBe(1);
      });

      it('should handle maximum valid values', () => {
        expect(calcularIMC(499.99, 2.99)).toBeCloseTo(55.93, 1);
        expect(calcularIMC(500, 3)).toBeCloseTo(55.56, 2);
      });

      it('should handle very low IMC values', () => {
        expect(calcularIMC(30, 2.5)).toBeCloseTo(4.8, 1);
      });

      it('should handle very high IMC values', () => {
        expect(calcularIMC(200, 1.5)).toBeCloseTo(88.89, 2);
      });
    });

    describe('mathematical edge cases', () => {
      it('should handle very small heights correctly', () => {
        expect(calcularIMC(70, 0.1)).toBeCloseTo(7000, 0);
        expect(calcularIMC(50, 0.5)).toBe(200);
      });

      it('should handle large weights with small heights', () => {
        expect(calcularIMC(100, 0.8)).toBeCloseTo(156.25, 1);
      });
    });
  });

  describe('calcularIMCRedondeado', () => {
    it('should calculate and round IMC to specified decimals', () => {
      expect(calcularIMCRedondeado(70, 1.75, 2)).toBe(22.86);
      expect(calcularIMCRedondeado(70, 1.75, 1)).toBe(22.9);
      expect(calcularIMCRedondeado(70, 1.75, 0)).toBe(23);
    });

    it('should handle different decimal places', () => {
      expect(calcularIMCRedondeado(65.5, 1.72, 3)).toBeCloseTo(22.139, 2);
      expect(calcularIMCRedondeado(65.5, 1.72, 4)).toBeCloseTo(22.14, 1);
    });

    it('should handle rounding edge cases', () => {
      expect(calcularIMCRedondeado(77.77, 1.777, 2)).toBeCloseTo(24.63, 1);
      expect(calcularIMCRedondeado(66.66, 1.666, 1)).toBe(24.0);
    });
  });

  describe('redondearIMC', () => {
    it('should round IMC values correctly', () => {
      expect(redondearIMC(22.857142857142858, 2)).toBe(22.86);
      expect(redondearIMC(24.693877551020408, 2)).toBe(24.69);
      expect(redondearIMC(22.040816326530613, 2)).toBe(22.04);
    });

    it('should handle different decimal places', () => {
      expect(redondearIMC(22.857142857142858, 1)).toBe(22.9);
      expect(redondearIMC(22.857142857142858, 0)).toBe(23);
      expect(redondearIMC(22.857142857142858, 3)).toBe(22.857);
    });

    it('should handle values that don\'t need rounding', () => {
      expect(redondearIMC(25.0, 2)).toBe(25);
      expect(redondearIMC(24.5, 1)).toBe(24.5);
    });

    it('should handle rounding edge cases', () => {
      expect(redondearIMC(24.995, 2)).toBe(25.00);
      expect(redondearIMC(24.994, 2)).toBe(24.99);
      expect(redondearIMC(0.995, 2)).toBe(1.00);
    });

    it('should handle negative decimals parameter gracefully', () => {
      expect(redondearIMC(22.857142857142858, 0)).toBe(23);
    });
  });

  describe('integration scenarios', () => {
    it('should produce consistent results between direct and rounded calculations', () => {
      const peso = 75;
      const altura = 1.80;
      const decimales = 2;

      const directCalc = redondearIMC(calcularIMC(peso, altura), decimales);
      const roundedCalc = calcularIMCRedondeado(peso, altura, decimales);

      expect(directCalc).toBe(roundedCalc);
    });

    it('should handle real-world IMC categories', () => {
      // Bajo peso (< 18.5)
      expect(calcularIMC(45, 1.70)).toBeCloseTo(15.57, 2);

      // Normal (18.5 - 24.9)
      expect(calcularIMC(65, 1.70)).toBeCloseTo(22.49, 2);

      // Sobrepeso (25 - 29.9)
      expect(calcularIMC(80, 1.70)).toBeCloseTo(27.68, 2);

      // Obeso (≥ 30)
      expect(calcularIMC(95, 1.70)).toBeCloseTo(32.87, 2);
    });
  });
});