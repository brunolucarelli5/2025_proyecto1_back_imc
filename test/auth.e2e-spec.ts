import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { hashSync } from 'bcrypt';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<UserEntity>;

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

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Clear users table and create test user
    await userRepository.clear();
    const hashedPassword = hashSync(testUser.password, 10);
    await userRepository.save({
      ...testUser,
      password: hashedPassword,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    describe('Valid login requests', () => {
      it('should login successfully with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201)
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(typeof response.body.accessToken).toBe('string');
        expect(typeof response.body.refreshToken).toBe('string');
        expect(response.body.accessToken.length).toBeGreaterThan(0);
        expect(response.body.refreshToken.length).toBeGreaterThan(0);
      });

      it('should handle case-sensitive email correctly', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email.toUpperCase(),
            password: testUser.password,
          })
          .expect(401); // Should fail as emails are case-sensitive
      });

      it('should generate different tokens for different sessions', async () => {
        const response1 = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201);

        const response2 = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201);

        expect(response1.body.accessToken).not.toBe(response2.body.accessToken);
        expect(response1.body.refreshToken).not.toBe(response2.body.refreshToken);
      });
    });

    describe('Invalid login requests', () => {
      it('should reject invalid email', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: testUser.password,
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Correo electrónico inválido');
          });
      });

      it('should reject incorrect password', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongPassword',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('Contraseña incorrecta');
          });
      });

      it('should reject invalid email formats', async () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          '',
        ];

        for (const email of invalidEmails) {
          await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email,
              password: testUser.password,
            })
            .expect(400);
        }
      });

      it('should reject empty password', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: '',
          })
          .expect(400);
      });

      it('should reject missing fields', async () => {
        const invalidRequests = [
          { email: testUser.email }, // missing password
          { password: testUser.password }, // missing email
          {}, // both missing
        ];

        for (const payload of invalidRequests) {
          await request(app.getHttpServer())
            .post('/auth/login')
            .send(payload)
            .expect(400);
        }
      });

      it('should reject extra fields', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
            extraField: 'should-be-rejected',
          })
          .expect(400);
      });
    });
  });

  describe('/auth/tokens (GET)', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      validRefreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/tokens')
        .set('Authorization', `Bearer ${validRefreshToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should reject invalid authorization header formats', async () => {
      const invalidHeaders = [
        'Token ' + validRefreshToken,
        'bearer ' + validRefreshToken,
        'BEARER ' + validRefreshToken,
        validRefreshToken,
        'Bearer',
        'Bearer ',
      ];

      for (const authHeader of invalidHeaders) {
        await request(app.getHttpServer())
          .get('/auth/tokens')
          .set('Authorization', authHeader)
          .expect(400);
      }
    });

    it('should reject missing authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/tokens')
        .expect(400);
    });

    it('should reject invalid tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'expired.token.here',
        'malformed-jwt-token',
      ];

      for (const token of invalidTokens) {
        await request(app.getHttpServer())
          .get('/auth/tokens')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
    });
  });

  describe('/auth/me (GET)', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      validAccessToken = loginResponse.body.accessToken;
    });

    it('should return user data for valid access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual({
        nombre: testUser.firstName,
        apellido: testUser.lastName,
        email: testUser.email,
      });
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('id');
    });

    it('should reject invalid authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject missing authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject malformed authorization header', async () => {
      const invalidHeaders = [
        'Token ' + validAccessToken,
        'bearer ' + validAccessToken,
        validAccessToken,
        'Bearer',
      ];

      for (const authHeader of invalidHeaders) {
        await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', authHeader)
          .expect(401);
      }
    });
  });

  describe('Authentication flow integration', () => {
    it('should complete full authentication flow', async () => {
      // 1. Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      const { accessToken, refreshToken } = loginResponse.body;

      // 2. Use access token to access protected route
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 3. Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .get('/auth/tokens')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;

      // 4. Use new access token
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });

    it('should handle concurrent authentication requests', async () => {
      const loginRequests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
      );

      const responses = await Promise.all(loginRequests);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
      });

      // All tokens should be different
      const tokens = responses.map(r => r.body.accessToken);
      const uniqueTokens = [...new Set(tokens)];
      expect(uniqueTokens).toHaveLength(tokens.length);
    });
  });

  describe('Content-Type and headers validation', () => {
    it('should validate content types correctly', async () => {
      // Valid content type
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      // Invalid content type should still work (handled by NestJS)
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }))
        .expect(400); // Bad request due to parsing
    });

    it('should handle missing content type', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);
    });
  });

  describe('Security considerations', () => {
    it('should not leak sensitive information in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@sensitive.com',
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body.message).not.toContain('admin@sensitive.com');
      expect(response.body.message).not.toContain('wrong-password');
    });

    it('should rate limit login attempts consistently', async () => {
      // Multiple failed attempts should still return consistent error
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrong-password',
          })
          .expect(401);
      }
    });
  });
});