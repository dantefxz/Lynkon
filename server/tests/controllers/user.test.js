const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate:   (req, _res, next) => { req.user = { uid: 'user123', isUnder16: false }; next(); },
  authorizeOwner: (_req, _res, next) => next(),
  blockUnder16:   (_req, _res, next) => next(),
}));

const mockUser = {
  uid: 'user123', username: 'TestGamer', bio: 'Hello', avatarId: null,
  favoriteGames: [], featuredAchievements: [], skillTags: {}, platforms: [],
  email: 'test@test.com', isUnder16: false, birthDate: '2000-01-01', friends: [],
};

jest.mock('../../src/config/firebase', () => ({
  auth: { deleteUser: jest.fn().mockResolvedValue(true) },
  db: {
    collection: (col) => ({
      doc: (id) => ({
        get:    jest.fn().mockResolvedValue({ exists: true, data: () => mockUser }),
        update: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
        collection: () => ({
          doc: () => ({
            get:    jest.fn().mockResolvedValue({ exists: true, data: () => ({ notifications: true, privacy: 'public' }) }),
            set:    jest.fn().mockResolvedValue(true),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
          }),
        }),
      }),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get:   jest.fn().mockResolvedValue({
        docs: [{ id: 'user456', data: () => ({ uid: 'user456', username: 'OtherGamer', avatarId: null }) }],
      }),
    }),
  },
  admin: { apps: ['initialized'] },
}));

describe('GET /api/users/:id/profile', () => {
  it('200 devuelve el perfil', async () => {
    const res = await request(app).get('/api/users/user123/profile').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile).toHaveProperty('username', 'TestGamer');
  });
});

describe('PATCH /api/users/:id/profile', () => {
  it('200 actualiza la bio', async () => {
    const res = await request(app).patch('/api/users/user123/profile')
      .set('Authorization', 'Bearer token').send({ bio: 'Nueva bio' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Profile updated');
    expect(res.body).toHaveProperty('updated');
  });

  it('400 si la bio supera 300 caracteres', async () => {
    const res = await request(app).patch('/api/users/user123/profile')
      .set('Authorization', 'Bearer token').send({ bio: 'a'.repeat(301) });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si no se manda ningun campo valido', async () => {
    const res = await request(app).patch('/api/users/user123/profile')
      .set('Authorization', 'Bearer token').send({ campoInvalido: 'x' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('GET /api/users/search', () => {
  it('200 devuelve usuarios', async () => {
    const res = await request(app).get('/api/users/search?q=Test').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
  });

  it('400 si la query es menor a 2 caracteres', async () => {
    const res = await request(app).get('/api/users/search?q=T').set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/users/:id/settings', () => {
  it('200 devuelve settings', async () => {
    const res = await request(app).get('/api/users/user123/settings').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings).toHaveProperty('notifications');
  });
});
