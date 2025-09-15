/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../src/users/entities/user.entity';
import { CalculoImc } from '../src/imc/entities/CalculoImc.entity';
import { Repository } from 'typeorm';
import { hashSync } from 'bcrypt';

describe('IMC Controller (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<UserEntity>;
  let imcRepository: Repository<CalculoImc>;
  let accessToken: string;

  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    imcRepository = moduleFixture.get<Repository<CalculoImc>>(getRepositoryToken(CalculoImc));

    // Configure validation pipe as in production
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Setup test data - Clear tables using query builder to avoid foreign key constraints
    await imcRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();

    const hashedPassword = hashSync(testUser.password, 10);
    await userRepository.save({
      ...testUser,
      password: hashedPassword,
    });

    // Get access token for authenticated requests
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/imc/calcular (POST)', () => {
    describe('Valid requests', () => {
      it('should calculate IMC for all weight categories', async () => {
        const testCases = [
          { altura: 1.75, peso: 50, expectedIMC: 16.33, expectedCategory: 'Bajo peso' },
          { altura: 1.75, peso: 70, expectedIMC: 22.86, expectedCategory: 'Normal' },
          { altura: 1.75, peso: 80, expectedIMC: 26.12, expectedCategory: 'Sobrepeso' },
          { altura: 1.75, peso: 100, expectedIMC: 32.65, expectedCategory: 'Obeso' }
        ];

        for (const { altura, peso, expectedIMC, expectedCategory } of testCases) {
          await request(app.getHttpServer())
            .post('/imc/calcular')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ altura, peso })
            .expect(201)
            .expect((res) => {
              expect(res.body).toHaveProperty('imc');
              expect(res.body).toHaveProperty('categoria');
              expect(res.body).toHaveProperty('id');
              expect(res.body).toHaveProperty('fecha_calculo');
              expect(res.body).toHaveProperty('user');
              expect(res.body.imc).toBeCloseTo(expectedIMC, 2);
              expect(res.body.categoria).toBe(expectedCategory);
              expect(res.body.user.firstName).toBe(testUser.firstName);
              expect(res.body.user.lastName).toBe(testUser.lastName);
              expect(res.body.user).not.toHaveProperty('password');
            });
        }
      });

      it('should handle extreme values and decimal precision', async () => {
        const extremeCases = [
          { altura: 0.01, peso: 0.01 }, // minimum values
          { altura: 2.99, peso: 499.99 }, // maximum values
          { altura: 1.823, peso: 75.5 } // decimal precision
        ];

        for (const { altura, peso } of extremeCases) {
          await request(app.getHttpServer())
            .post('/imc/calcular')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ altura, peso })
            .expect(201)
            .expect((res) => {
              expect(res.body).toHaveProperty('imc');
              expect(res.body).toHaveProperty('categoria');
              expect(res.body).toHaveProperty('id');
              expect(res.body).toHaveProperty('fecha_calculo');
              expect(res.body).toHaveProperty('user');
              expect(typeof res.body.imc).toBe('number');
              expect(typeof res.body.categoria).toBe('string');
            });
        }
      });
    });

    describe('Invalid requests - Validation errors', () => {
      it('should reject missing fields', async () => {
        const missingFieldCases = [
          { peso: 70 }, // missing altura
          { altura: 1.75 }, // missing peso
          {} // both missing
        ];

        for (const payload of missingFieldCases) {
          await request(app.getHttpServer())
            .post('/imc/calcular')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload)
            .expect(400)
            .expect((res) => {
              expect(res.body).toHaveProperty('message');
              expect(Array.isArray(res.body.message)).toBe(true);
            });
        }
      });

      it('should reject invalid altura values', async () => {
        const invalidAlturaTests = [
          { altura: 0, expectedMessage: 'La altura debe ser mayor que 0' },
          { altura: -1.5, expectedMessage: 'La altura debe ser mayor que 0' },
          { altura: 3.5, expectedMessage: 'La altura no puede ser mayor a 3 metros' }
        ];

        for (const { altura, expectedMessage } of invalidAlturaTests) {
          await request(app.getHttpServer())
            .post('/imc/calcular')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ altura, peso: 70 })
            .expect(400)
            .expect((res) => {
              expect(res.body.message).toContain(expectedMessage);
            });
        }
      });

      it('should reject invalid peso values', async () => {
        const invalidPesoTests = [
          { peso: 0, expectedMessage: 'El peso debe ser mayor que 0' },
          { peso: -50, expectedMessage: 'El peso debe ser mayor que 0' },
          { peso: 600, expectedMessage: 'El peso no puede ser mayor a 500 kg' }
        ];

        for (const { peso, expectedMessage } of invalidPesoTests) {
          await request(app.getHttpServer())
            .post('/imc/calcular')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ altura: 1.75, peso })
            .expect(400)
            .expect((res) => {
              expect(res.body.message).toContain(expectedMessage);
            });
        }
      });

      it('should reject invalid data types and extra fields', async () => {
        const invalidRequests = [
          { altura: 'invalid', peso: 70 }, // non-numeric altura
          { altura: 1.75, peso: 'invalid' }, // non-numeric peso
          { altura: 1.75, peso: 70, extraField: 'rejected' }, // extra fields
          { altura: -1, peso: -50 } // multiple errors
        ];

        for (const payload of invalidRequests) {
          await request(app.getHttpServer())
            .post('/imc/calcular')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload)
            .expect(400);
        }
      });
    });

    describe('Content-Type validation', () => {
      it('should validate content types correctly', async () => {
        // Valid content type
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Content-Type', 'application/json')
          .send({ altura: 1.75, peso: 70 })
          .expect(201);

        // Invalid content type
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Content-Type', 'text/plain')
          .send('altura=1.75&peso=70')
          .expect(400);
      });
    });

    describe('Boundary testing and precision', () => {
      it('should handle category boundaries and precision', async () => {
        // Test exact boundary (IMC = 18.5)
        const altura = Math.sqrt(70 / 18.5);
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ altura: Number(altura.toFixed(3)), peso: 70 })
          .expect(201)
          .expect((res) => {
            expect(res.body.categoria).toMatch(/Normal|Bajo peso/);
          });

        // Test extreme precision
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ altura: 1.7777777, peso: 70.123456 })
          .expect(201)
          .expect((res) => {
            expect(typeof res.body.imc).toBe('number');
            expect(res.body.imc).toBeGreaterThan(0);
          });
      });
    });

    describe('Response format consistency', () => {
      it('should return consistent response structure and content type', () => {
        return request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ altura: 1.75, peso: 70 })
          .expect(201)
          .expect('Content-Type', /json/)
          .expect((res) => {
            expect(res.body).toHaveProperty('imc');
            expect(res.body).toHaveProperty('categoria');
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('fecha_calculo');
            expect(res.body).toHaveProperty('user');
            expect(Object.keys(res.body)).toHaveLength(7);
            expect(typeof res.body.imc).toBe('number');
            expect(typeof res.body.categoria).toBe('string');
          });
      });
    });
  });

  describe('Authentication requirements', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/imc/calcular')
        .send({ altura: 1.75, peso: 70 })
        .expect(401);
    });

    it('should reject invalid authorization header', async () => {
      await request(app.getHttpServer())
        .post('/imc/calcular')
        .set('Authorization', 'Bearer invalid-token')
        .send({ altura: 1.75, peso: 70 })
        .expect(401);
    });

    it('should reject malformed authorization header', async () => {
      const invalidHeaders = [
        'Token ' + accessToken,
        'bearer ' + accessToken,
        accessToken,
        'Bearer',
      ];

      for (const authHeader of invalidHeaders) {
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', authHeader)
          .send({ altura: 1.75, peso: 70 })
          .expect(401);
      }
    });
  });

  describe('/imc/historial (GET)', () => {
    beforeEach(async () => {
      // Create some test IMC records
      const testData = [
        { altura: 1.75, peso: 70 },
        { altura: 1.80, peso: 80 },
        { altura: 1.65, peso: 60 },
      ];

      for (const data of testData) {
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(data);
      }
    });

    it('should return user IMC history', async () => {
      const response = await request(app.getHttpServer())
        .get('/imc/historial')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      response.body.forEach((record: any) => {
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('altura');
        expect(record).toHaveProperty('peso');
        expect(record).toHaveProperty('imc');
        expect(record).toHaveProperty('categoria');
        expect(record).toHaveProperty('fecha_calculo');
      });
    });

    it('should handle sort parameter', async () => {
      const ascResponse = await request(app.getHttpServer())
        .get('/imc/historial?sort=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const descResponse = await request(app.getHttpServer())
        .get('/imc/historial?sort=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(ascResponse.body).toHaveLength(3);
      expect(descResponse.body).toHaveLength(3);
    });

    it('should reject invalid sort parameter', async () => {
      await request(app.getHttpServer())
        .get('/imc/historial?sort=invalid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/imc/historial')
        .expect(401);
    });
  });

  describe('/imc/pag (GET)', () => {
    beforeEach(async () => {
      // Create test IMC records for pagination
      for (let i = 0; i < 15; i++) {
        await request(app.getHttpServer())
          .post('/imc/calcular')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ altura: 1.75, peso: 70 + i });
      }
    });

    it('should return paginated results', async () => {
      const response = await request(app.getHttpServer())
        .get('/imc/pag?pag=1&mostrar=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBe(15);
    });

    it('should handle different page sizes', async () => {
      const response1 = await request(app.getHttpServer())
        .get('/imc/pag?pag=1&mostrar=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/imc/pag?pag=2&mostrar=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body.data.length).toBe(10);
      expect(response2.body.data.length).toBe(5); // Remaining records
    });

    it('should handle sort parameter', async () => {
      await request(app.getHttpServer())
        .get('/imc/pag?pag=1&mostrar=5&sort=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/imc/pag?pag=1&mostrar=5&sort=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject invalid pagination parameters', async () => {
      const invalidRequests = [
        '/imc/pag?pag=0&mostrar=5', // Invalid page
        '/imc/pag?pag=1&mostrar=0', // Invalid size
        '/imc/pag?pag=-1&mostrar=5', // Negative page
        '/imc/pag?pag=1&mostrar=-5', // Negative size
      ];

      for (const path of invalidRequests) {
        await request(app.getHttpServer())
          .get(path)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/imc/pag?pag=1&mostrar=5')
        .expect(401);
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full IMC workflow', async () => {
      // 1. Calculate IMC
      const calculateResponse = await request(app.getHttpServer())
        .post('/imc/calcular')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ altura: 1.75, peso: 70 })
        .expect(201);

      expect(calculateResponse.body.imc).toBeCloseTo(22.86, 2);

      // 2. Get history
      const historyResponse = await request(app.getHttpServer())
        .get('/imc/historial')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(historyResponse.body.length).toBeGreaterThan(0);

      // 3. Get paginated results
      const paginatedResponse = await request(app.getHttpServer())
        .get('/imc/pag?pag=1&mostrar=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(paginatedResponse.body.data.length).toBeGreaterThan(0);
    });

    it('should handle multiple users separately', async () => {
      // Create second user
      const secondUser = {
        email: 'second@example.com',
        password: 'password123',
        firstName: 'Second',
        lastName: 'User'
      };

      await request(app.getHttpServer())
        .post('/users/register')
        .send(secondUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: secondUser.email,
          password: secondUser.password,
        });

      const secondUserToken = loginResponse.body.accessToken;

      // First user calculates IMC
      await request(app.getHttpServer())
        .post('/imc/calcular')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ altura: 1.75, peso: 70 });

      // Second user calculates IMC
      await request(app.getHttpServer())
        .post('/imc/calcular')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ altura: 1.80, peso: 80 });

      // Each user should see only their own history
      const firstUserHistory = await request(app.getHttpServer())
        .get('/imc/historial')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const secondUserHistory = await request(app.getHttpServer())
        .get('/imc/historial')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);

      expect(firstUserHistory.body.length).toBe(1);
      expect(secondUserHistory.body.length).toBe(1);
      expect(parseFloat(firstUserHistory.body[0].imc)).toBeCloseTo(22.86, 2);
      expect(parseFloat(secondUserHistory.body[0].imc)).toBeCloseTo(24.69, 2);
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for invalid HTTP methods and routes', async () => {
      const invalidRequests = [
        { method: 'get', path: '/imc/calcular' },
        { method: 'put', path: '/imc/calcular', body: { altura: 1.75, peso: 70 } },
        { method: 'delete', path: '/imc/calcular' },
        { method: 'post', path: '/imc/invalid', body: { altura: 1.75, peso: 70 } }
      ];

      for (const { method, path, body } of invalidRequests) {
        const req = request(app.getHttpServer())[method](path);
        if (body) {
          req.send(body);
          req.set('Authorization', `Bearer ${accessToken}`);
        }
        await req.expect(404);
      }
    });
  });
});
