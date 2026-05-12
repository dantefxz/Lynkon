const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/config/firebase', () => ({
  auth: {
    getUser:       jest.fn().mockResolvedValue({ uid: 'user123' }),
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'user123' }),
    deleteUser:    jest.fn().mockResolvedValue(true),
  },
  db: {
    collection: () => ({
      doc: () => ({
        set:    jest.fn().mockResolvedValue(true),
        get:    jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid: 'user123', username: 'TestGamer', email: 'test@test.com', isUnder16: false }),
        }),
        update: jest.fn().mockResolvedValue(true),
      }),
    }),
  },
  admin: { apps: ['initialized'] },
}));

describe('POST /api/auth/register', () => {
  it('400 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si password tiene menos de 6 letras', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com', password: 'Pass12', birthDate: '2000-01-01' });
    expect(res.status).toBe(400);
  });

  it('400 si password tiene menos de 2 numeros', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com', password: 'Password1', birthDate: '2000-01-01' });
    expect(res.status).toBe(400);
  });

  it('400 si birthDate es inválida', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com', password: 'SecurePass123', birthDate: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('201 con datos válidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com', password: 'SecurePass123', birthDate: '2000-06-15', username: 'TestGamer',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
  });
});

describe('POST /api/auth/login', () => {
  it('400 si faltan email o password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('200 con credenciales válidas', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'SecurePass123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
