import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Model } from 'mongoose';
import { hashSync } from 'bcrypt';

describe('Users Controller (e2e)', () => {
  let app: INestApplication<App>;
  let userModel: Model<User>;
  let accessToken: string;

  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123',
    firstName: 'Test',
    lastName: 'User'
  };

  const newUser = {
    email: 'newuser@example.com',
    password: 'newPassword123',
    firstName: 'New',
    lastName: 'User'
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Clear users collection and create test user
    await userModel.deleteMany({});
    const hashedPassword = hashSync(testUser.password, 10);
    await userModel.create({
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

  describe('/users/register (POST)', () => {
    describe('Valid registration requests', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/register')
          .send(newUser)
          .expect(201)
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email', newUser.email);
        expect(response.body).toHaveProperty('firstName', newUser.firstName);
        expect(response.body).toHaveProperty('lastName', newUser.lastName);
        expect(response.body).not.toHaveProperty('password');
      });

      it('should hash the password before storing', async () => {
        await request(app.getHttpServer())
          .post('/users/register')
          .send(newUser)
          .expect(201);

        const savedUser = await userModel.findOne({ email: newUser.email });
        expect(savedUser).toBeDefined();
        expect(savedUser!.password).not.toBe(newUser.password);
        expect(savedUser!.password.length).toBeGreaterThan(20); // Bcrypt hash length
      });

      it('should handle complex valid data', async () => {
        const complexUser = {
          email: 'user.name+tag@domain-name.co.uk',
          password: 'MySecurePassword!@#123',
          firstName: 'María José',
          lastName: 'González-Pérez',
        };

        const response = await request(app.getHttpServer())
          .post('/users/register')
          .send(complexUser)
          .expect(201);

        expect(response.body.email).toBe(complexUser.email);
        expect(response.body.firstName).toBe(complexUser.firstName);
        expect(response.body.lastName).toBe(complexUser.lastName);
      });

      it('should handle minimal valid names', async () => {
        const minimalUser = {
          email: 'minimal@test.com',
          password: 'password',
          firstName: 'A',
          lastName: 'B',
        };

        await request(app.getHttpServer())
          .post('/users/register')
          .send(minimalUser)
          .expect(201);
      });
    });

    describe('Invalid registration requests', () => {
      it('should reject duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/users/register')
          .send({
            ...newUser,
            email: testUser.email, // Already exists
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Ya existe un usuario con ese email');
          });
      });

      it('should reject invalid email formats', async () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user..name@example.com',
          '',
        ];

        for (const email of invalidEmails) {
          await request(app.getHttpServer())
            .post('/users/register')
            .send({
              ...newUser,
              email,
            })
            .expect(400);
        }
      });

      it('should reject empty or missing fields', async () => {
        const invalidRequests = [
          { ...newUser, email: '' },
          { ...newUser, password: '' },
          { ...newUser, firstName: '' },
          { ...newUser, lastName: '' },
          { password: newUser.password, firstName: newUser.firstName, lastName: newUser.lastName }, // missing email
          { email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName }, // missing password
          { email: newUser.email, password: newUser.password, lastName: newUser.lastName }, // missing firstName
          { email: newUser.email, password: newUser.password, firstName: newUser.firstName }, // missing lastName
          {}, // all missing
        ];

        for (const payload of invalidRequests) {
          await request(app.getHttpServer())
            .post('/users/register')
            .send(payload)
            .expect(400);
        }
      });

      it('should reject invalid data types', async () => {
        const invalidTypes = [
          { ...newUser, email: 123 },
          { ...newUser, password: true },
          { ...newUser, firstName: [] },
          { ...newUser, lastName: {} },
        ];

        for (const payload of invalidTypes) {
          await request(app.getHttpServer())
            .post('/users/register')
            .send(payload)
            .expect(400);
        }
      });

      it('should reject extra fields', async () => {
        await request(app.getHttpServer())
          .post('/users/register')
          .send({
            ...newUser,
            extraField: 'should-be-rejected',
          })
          .expect(400);
      });
    });
  });

  describe('/users (GET)', () => {
    it('should return all users for authenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should reject invalid authorization header', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return multiple users if they exist', async () => {
      // Register another user
      await request(app.getHttpServer())
        .post('/users/register')
        .send(newUser);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });

  describe('/users/:id (PATCH)', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await userModel.findOne({ email: testUser.email });
      userId = user!.id;
    });

    describe('Valid update requests', () => {
      it('should update user successfully with partial data', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
        };

        const response = await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
          .expect(200)
          .expect('Content-Type', /json/);

        expect(response.body.firstName).toBe(updateData.firstName);
        expect(response.body.lastName).toBe(updateData.lastName);
        expect(response.body.email).toBe(testUser.email); // Unchanged
      });

      it('should update only email', async () => {
        const updateData = { email: 'updated@example.com' };

        const response = await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.email).toBe(updateData.email);
        expect(response.body.firstName).toBe(testUser.firstName); // Unchanged
      });

      it('should update password and hash it', async () => {
        const updateData = { password: 'newPassword123' };

        await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
          .expect(200);

        const updatedUser = await userModel.findById(userId);
        expect(updatedUser!.password).not.toBe(updateData.password);
        expect(updatedUser!.password).not.toBe(testUser.password);
      });

      it('should handle empty update object', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(200);
      });
    });

    describe('Invalid update requests', () => {
      it('should reject unauthenticated requests', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .send({ firstName: 'Updated' })
          .expect(401);
      });

      it('should reject invalid user ID', async () => {
        await request(app.getHttpServer())
          .patch('/users/999')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ firstName: 'Updated' })
          .expect(404);
      });

      it('should reject invalid ID format', async () => {
        await request(app.getHttpServer())
          .patch('/users/invalid')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ firstName: 'Updated' })
          .expect(400); // ParseIntPipe validation
      });

      it('should reject invalid email format', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ email: 'invalid-email' })
          .expect(400);
      });

      it('should reject invalid data types', async () => {
        const invalidUpdates = [
          { firstName: 123 },
          { lastName: true },
          { email: [] },
          { password: {} },
        ];

        for (const update of invalidUpdates) {
          await request(app.getHttpServer())
            .patch(`/users/${userId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(update)
            .expect(400);
        }
      });

      it('should reject extra fields', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            firstName: 'Valid',
            extraField: 'invalid',
          })
          .expect(400);
      });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a separate user to delete
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send(newUser);

      userId = registerResponse.body.id;
    });

    it('should delete user successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(`Usuario ID N°${userId} eliminado`);

      // Verify user is actually deleted
      const deletedUser = await userModel.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(401);
    });

    it('should reject invalid user ID', async () => {
      await request(app.getHttpServer())
        .delete('/users/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject invalid ID format', async () => {
      await request(app.getHttpServer())
        .delete('/users/invalid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should handle attempting to delete same user twice', async () => {
      // First deletion
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Second deletion should fail
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Content-Type and headers validation', () => {
    it('should validate content types correctly', async () => {
      // Valid content type
      await request(app.getHttpServer())
        .post('/users/register')
        .set('Content-Type', 'application/json')
        .send(newUser)
        .expect(201);

      // Invalid content type should still be handled
      await request(app.getHttpServer())
        .post('/users/register')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(newUser))
        .expect(400);
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full user lifecycle', async () => {
      // 1. Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send(newUser)
        .expect(201);

      const userId = registerResponse.body.id;

      // 2. Login with new user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(201);

      const newUserToken = loginResponse.body.accessToken;

      // 3. Update user information
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({ firstName: 'UpdatedName' })
        .expect(200);

      // 4. Verify user appears in users list
      const usersResponse = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(usersResponse.body.length).toBe(2);

      // 5. Delete user
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 6. Verify user is deleted
      const finalUsersResponse = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(finalUsersResponse.body.length).toBe(1);
    });

    it('should handle concurrent user operations', async () => {
      const users = [
        { email: 'user1@test.com', password: 'pass1', firstName: 'User1', lastName: 'Test1' },
        { email: 'user2@test.com', password: 'pass2', firstName: 'User2', lastName: 'Test2' },
        { email: 'user3@test.com', password: 'pass3', firstName: 'User3', lastName: 'Test3' },
      ];

      const registerPromises = users.map(user =>
        request(app.getHttpServer())
          .post('/users/register')
          .send(user)
      );

      const responses = await Promise.all(registerPromises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.email).toBe(users[index].email);
      });

      // Verify all users are in database
      const allUsers = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allUsers.body.length).toBe(4); // 3 new + 1 original
    });
  });

  describe('Security considerations', () => {
    it('should not expose passwords in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send(newUser)
        .expect(201);

      expect(response.body).not.toHaveProperty('password');

      const usersResponse = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      usersResponse.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should require authentication for protected routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/users' },
        { method: 'patch', path: '/users/1', body: { firstName: 'Test' } },
        { method: 'delete', path: '/users/1' },
      ];

      for (const route of protectedRoutes) {
        const req = request(app.getHttpServer())[route.method](route.path);
        if (route.body) req.send(route.body);
        await req.expect(401);
      }
    });
  });
});