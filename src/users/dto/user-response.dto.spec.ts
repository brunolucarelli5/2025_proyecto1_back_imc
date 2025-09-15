import { UserResponseDto } from './user-response.dto';

describe('UserResponseDto', () => {
  describe('Construction', () => {
    it('should create a valid UserResponseDto instance', () => {
      const dto = new UserResponseDto();
      dto.id = 1;
      dto.email = 'test@example.com';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      expect(dto).toBeDefined();
      expect(dto.id).toBe(1);
      expect(dto.email).toBe('test@example.com');
      expect(dto.firstName).toBe('Test');
      expect(dto.lastName).toBe('User');
    });

    it('should handle different data types correctly', () => {
      const dto = new UserResponseDto();
      dto.id = 999;
      dto.email = 'complex.email+tag@domain.co.uk';
      dto.firstName = 'María José';
      dto.lastName = "O'Connor-Smith";

      expect(dto.id).toBe(999);
      expect(dto.email).toBe('complex.email+tag@domain.co.uk');
      expect(dto.firstName).toBe('María José');
      expect(dto.lastName).toBe("O'Connor-Smith");
    });

    it('should have all required properties', () => {
      const dto = new UserResponseDto();

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('email');
      expect(dto).toHaveProperty('firstName');
      expect(dto).toHaveProperty('lastName');
    });
  });

  describe('Data integrity', () => {
    it('should maintain data when properties are set', () => {
      const dto = new UserResponseDto();
      const testData = {
        id: 42,
        email: 'maintaindata@test.com',
        firstName: 'Maintain',
        lastName: 'Data'
      };

      Object.assign(dto, testData);

      expect(dto.id).toBe(testData.id);
      expect(dto.email).toBe(testData.email);
      expect(dto.firstName).toBe(testData.firstName);
      expect(dto.lastName).toBe(testData.lastName);
    });

    it('should handle special characters in names', () => {
      const dto = new UserResponseDto();
      dto.id = 1;
      dto.email = 'special@example.com';
      dto.firstName = 'José María';
      dto.lastName = 'García-Pérez';

      expect(dto.firstName).toContain('é');
      expect(dto.firstName).toContain('í');
      expect(dto.lastName).toContain('-');
    });
  });

  describe('Object operations', () => {
    it('should serialize to JSON correctly', () => {
      const dto = new UserResponseDto();
      dto.id = 1;
      dto.email = 'json@example.com';
      dto.firstName = 'JSON';
      dto.lastName = 'Test';

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(1);
      expect(parsed.email).toBe('json@example.com');
      expect(parsed.firstName).toBe('JSON');
      expect(parsed.lastName).toBe('Test');
    });

    it('should be cloneable', () => {
      const original = new UserResponseDto();
      original.id = 1;
      original.email = 'clone@example.com';
      original.firstName = 'Clone';
      original.lastName = 'Test';

      const clone = Object.assign(new UserResponseDto(), original);

      expect(clone.id).toBe(original.id);
      expect(clone.email).toBe(original.email);
      expect(clone.firstName).toBe(original.firstName);
      expect(clone.lastName).toBe(original.lastName);
    });
  });
});