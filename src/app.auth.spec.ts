import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { prisma } from './prisma/client';
import { AppModule } from './app.module';

jest.mock('./prisma/client', () => ({
  prisma: {
    admin: { findUnique: jest.fn() },
    contactMessage: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

const SECRET = 'wiring-test-secret-at-least-32-chars';

// Boots the real AppModule to check the guard, JWT config and global pipe work
// together over HTTP. Prisma is mocked, so no database is needed.
describe('Admin auth wiring (HTTP)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    process.env.ADMIN_JWT_SECRET = SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    token = await new JwtService({ secret: SECRET }).signAsync({
      sub: 'admin-1',
      email: 'admin@example.com',
    });
  });

  afterAll(async () => {
    await app.close();
    delete process.env.ADMIN_JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      isActive: true,
    });
    (prisma.contactMessage.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.contactMessage.count as jest.Mock).mockResolvedValue(0);
  });

  it('should reject the contact list without a token', async () => {
    await request(app.getHttpServer()).get('/api/v1/contacts').expect(401);
    expect(prisma.contactMessage.findMany).not.toHaveBeenCalled();
  });

  it('should reject the contact list with a forged token', async () => {
    const forged = await new JwtService({
      secret: 'another-secret-that-is-32-characters!',
    }).signAsync({ sub: 'admin-1', email: 'admin@example.com' });

    await request(app.getHttpServer())
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${forged}`)
      .expect(401);
  });

  it.each([
    ['patch', '/api/v1/contacts/c1'],
    ['delete', '/api/v1/contacts/c1'],
    ['get', '/api/v1/contacts/c1'],
    ['get', '/api/v1/auth/me'],
  ] as const)('should reject %s %s without a token', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });

  it('should return the contact list with a valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/contacts?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 5 });
  });

  it('should keep contact submission public', async () => {
    (prisma.contactMessage.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.contactMessage.create as jest.Mock).mockResolvedValue({
      id: 'c1',
    });

    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        message: 'Hello',
        applicationId: 'app-1',
      })
      .expect(201);
  });

  it('should validate the login body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
  });
});
