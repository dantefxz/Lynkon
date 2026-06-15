const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/config/firebase', () => ({
  auth: {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
  db: {
    collection: () => ({
      doc: () => ({
        set:    jest.fn().mockResolvedValue(true),
        get:    jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        update: jest.fn().mockResolvedValue(true),
      }),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get:   jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    }),
  },
  admin: { apps: ['initialized'] },
}));

jest.mock('../../src/services/auth.service', () => ({
  register: jest.fn().mockResolvedValue({
    user:    { uid: 'user123', username: 'TestGamer', email: 'test@test.com', isUnder16: false, avatarId: 'avatar_01' },
    idToken: 'jwt-token-123',
  }),
  login: jest.fn().mockResolvedValue({
    user:    { uid: 'user123', username: 'TestGamer', email: 'test@test.com', isUnder16: false, avatarId: 'avatar_01' },
    idToken: 'jwt-token-123',
  }),
  forgotPassword: jest.fn().mockResolvedValue({
    message: 'If that email exists, a reset link has been sent.',
  }),
}));

const authService = require('../../src/services/auth.service');

// ─── Register ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('400 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si password tiene menos de 6 letras', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'a@a.com', password: 'Pass12', birthDate: '2000-01-01' });
    expect(res.status).toBe(400);
  });

  it('400 si password tiene menos de 2 numeros', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'a@a.com', password: 'Password1', birthDate: '2000-01-01' });
    expect(res.status).toBe(400);
  });

  it('400 si birthDate es inválida', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'a@a.com', password: 'SecurePass123', birthDate: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('201 con datos válidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@test.com', password: 'SecurePass123', birthDate: '2000-06-15', username: 'TestGamer',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
  });

  it('409 si el email ya está registrado', async () => {
    authService.register.mockRejectedValueOnce(
      Object.assign(new Error('Email already registered'), { status: 409 })
    );
    const res = await request(app).post('/api/auth/register').send({
      email: 'existing@test.com', password: 'SecurePass123', birthDate: '2000-06-15',
    });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('400 si faltan email o password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('200 con credenciales válidas', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'SecurePass123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('idToken');
  });

  it('401 si las credenciales son inválidas', async () => {
    authService.login.mockRejectedValueOnce(
      Object.assign(new Error('Invalid email or password'), { status: 401 })
    );
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'WrongPass123' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('400 si no se envía email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  it('400 si el servicio rechaza el email inválido', async () => {
    authService.forgotPassword.mockRejectedValueOnce(
      Object.assign(new Error('A valid email is required'), { status: 400 })
    );
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'no-es-un-email' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('200 con email válido — siempre responde igual por seguridad', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@test.com' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('200 aunque el email no exista (no revela si el usuario está registrado)', async () => {
    authService.forgotPassword.mockResolvedValueOnce({ message: 'If that email exists, a reset link has been sent.' });
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'noexiste@test.com' });
    expect(res.status).toBe(200);
  });
});
