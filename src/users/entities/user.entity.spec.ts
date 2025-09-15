import { UserEntity } from './user.entity';
import { CalculoImc } from '../../imc/entities/CalculoImc.entity';

describe('UserEntity', () => {
  describe('Construction', () => {
    it('should create a valid UserEntity instance', () => {
      const user = new UserEntity();
      user.id = 1;
      user.email = 'test@example.com';
      user.password = 'hashedPassword';
      user.firstName = 'Test';
      user.lastName = 'User';
      user.imcs = [];

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('hashedPassword');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.imcs).toEqual([]);
    });

    it('should handle different data types correctly', () => {
      const user = new UserEntity();
      user.id = 999;
      user.email = 'complex.email+tag@domain.co.uk';
      user.firstName = 'María José';
      user.lastName = "O'Connor-Smith";
      user.password = 'complex$Pa$$w0rd!';

      expect(user.id).toBe(999);
      expect(user.email).toBe('complex.email+tag@domain.co.uk');
      expect(user.firstName).toBe('María José');
      expect(user.lastName).toBe("O'Connor-Smith");
      expect(user.password).toBe('complex$Pa$$w0rd!');
    });

    it('should have all required properties', () => {
      const user = new UserEntity();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('imcs');
    });
  });

  describe('Relationships', () => {
    it('should handle IMC calculations relationship', () => {
      const user = new UserEntity();
      user.id = 1;
      user.email = 'test@example.com';
      user.firstName = 'Test';
      user.lastName = 'User';

      const mockImc = {
        id: 1,
        peso: 70,
        altura: 1.75,
        imc: 22.86,
        user: user,
      } as CalculoImc;

      user.imcs = [mockImc];

      expect(user.imcs).toHaveLength(1);
      expect(user.imcs[0]).toBe(mockImc);
      expect(user.imcs[0].user).toBe(user);
    });

    it('should handle empty IMC calculations array', () => {
      const user = new UserEntity();
      user.imcs = [];

      expect(user.imcs).toEqual([]);
      expect(user.imcs).toHaveLength(0);
    });

    it('should handle multiple IMC calculations', () => {
      const user = new UserEntity();
      user.id = 1;

      const mockImc1 = { id: 1, peso: 70, altura: 1.75, imc: 22.86, user } as CalculoImc;
      const mockImc2 = { id: 2, peso: 75, altura: 1.75, imc: 24.49, user } as CalculoImc;

      user.imcs = [mockImc1, mockImc2];

      expect(user.imcs).toHaveLength(2);
      expect(user.imcs[0]).toBe(mockImc1);
      expect(user.imcs[1]).toBe(mockImc2);
    });
  });

  describe('Data integrity', () => {
    it('should maintain data when properties are set', () => {
      const user = new UserEntity();
      const testData = {
        id: 42,
        email: 'maintaindata@test.com',
        password: 'hashedPassword123',
        firstName: 'Maintain',
        lastName: 'Data'
      };

      Object.assign(user, testData);

      expect(user.id).toBe(testData.id);
      expect(user.email).toBe(testData.email);
      expect(user.password).toBe(testData.password);
      expect(user.firstName).toBe(testData.firstName);
      expect(user.lastName).toBe(testData.lastName);
    });

    it('should handle special characters in properties', () => {
      const user = new UserEntity();
      user.id = 1;
      user.email = 'special+chars@example.com';
      user.firstName = 'José María';
      user.lastName = 'García-Pérez';
      user.password = 'P@$$w0rd!#$';

      expect(user.firstName).toContain('é');
      expect(user.firstName).toContain('í');
      expect(user.lastName).toContain('-');
      expect(user.password).toContain('$');
      expect(user.password).toContain('#');
    });
  });

  describe('Object operations', () => {
    it('should be serializable to JSON', () => {
      const user = new UserEntity();
      user.id = 1;
      user.email = 'json@example.com';
      user.firstName = 'JSON';
      user.lastName = 'Test';
      user.password = 'password123';
      user.imcs = [];

      const json = JSON.stringify(user);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(1);
      expect(parsed.email).toBe('json@example.com');
      expect(parsed.firstName).toBe('JSON');
      expect(parsed.lastName).toBe('Test');
      expect(parsed.password).toBe('password123');
      expect(parsed.imcs).toEqual([]);
    });

    it('should be cloneable', () => {
      const original = new UserEntity();
      original.id = 1;
      original.email = 'clone@example.com';
      original.firstName = 'Clone';
      original.lastName = 'Test';
      original.password = 'password123';
      original.imcs = [];

      const clone = Object.assign(new UserEntity(), original);

      expect(clone.id).toBe(original.id);
      expect(clone.email).toBe(original.email);
      expect(clone.firstName).toBe(original.firstName);
      expect(clone.lastName).toBe(original.lastName);
      expect(clone.password).toBe(original.password);
      expect(clone.imcs).toEqual(original.imcs);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined values gracefully', () => {
      const user = new UserEntity();

      expect(user.id).toBeUndefined();
      expect(user.email).toBeUndefined();
      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.password).toBeUndefined();
      expect(user.imcs).toBeUndefined();
    });

    it('should handle null assignments', () => {
      const user = new UserEntity();
      user.email = null as any;
      user.firstName = null as any;
      user.lastName = null as any;
      user.password = null as any;

      expect(user.email).toBeNull();
      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
      expect(user.password).toBeNull();
    });
  });
});