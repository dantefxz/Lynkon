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

  it('400 si birthDate es inválida', async () => {
    const res = await request(app).post('/api/auth/register').send({ uid: 'u1', email: 'a@a.com', birthDate: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('201 con datos válidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      uid: 'user123', email: 'test@test.com', birthDate: '2000-06-15', username: 'TestGamer',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('uid', 'user123');
  });
});

describe('POST /api/auth/login', () => {
  it('400 si falta idToken', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('200 con idToken válido', async () => {
    const res = await request(app).post('/api/auth/login').send({ idToken: 'valid-token' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
  });
});
