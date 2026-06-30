const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate:   (req, _res, next) => { req.user = { uid: 'user123', isUnder16: false }; next(); },
  authorizeOwner: (_req, _res, next) => next(),
  blockUnder16:   (_req, _res, next) => next(),
}));

const mockFavorites    = [{ gameId: '730', name: 'CS2', platform: 'steam' }];
const mockSettingsData = { notifications: true, privacy: 'public' };

jest.mock('../../src/config/firebase', () => {
  const makeSettingsDoc = () => ({
    get:    jest.fn().mockResolvedValue({ exists: true, data: () => mockSettingsData }),
    set:    jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
  });
  return {
    auth:  { deleteUser: jest.fn().mockResolvedValue(true) },
    db: {
      collection: (col) => ({
        doc: (id) => ({
          get:    jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              uid: 'user123', username: 'TestGamer', email: 'test@test.com',
              favoriteGames: mockFavorites, profileGames: [], platforms: [],
              friends: [], isOnline: false, isUnder16: false,
            }),
          }),
          update: jest.fn().mockResolvedValue(true),
          delete: jest.fn().mockResolvedValue(true),
          collection: () => ({ doc: makeSettingsDoc }),
        }),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get:   jest.fn().mockResolvedValue({ docs: [] }),
      }),
    },
    admin: { apps: ['initialized'] },
  };
});

jest.mock('../../src/services/user.service', () => ({
  getMyProfile:       jest.fn().mockResolvedValue({ uid: 'user123', username: 'TestGamer' }),
  getProfile:         jest.fn().mockResolvedValue({ uid: 'user123', username: 'TestGamer' }),
  updateProfile:      jest.fn().mockResolvedValue({ bio: 'Updated' }),
  createProfile:      jest.fn().mockResolvedValue({ uid: 'user123' }),
  getSettings:        jest.fn().mockResolvedValue({ notifications: true, privacy: 'public' }),
  updateSettings:     jest.fn().mockResolvedValue({ notifications: false, privacy: 'private' }),
  createSettings:     jest.fn().mockResolvedValue({ notifications: true, privacy: 'public' }),
  searchUsers:        jest.fn().mockResolvedValue([]),
  deleteUser:         jest.fn().mockResolvedValue(true),
  getFavoriteGames:   jest.fn().mockResolvedValue([{ gameId: '730', name: 'CS2', platform: 'steam' }]),
  addFavoriteGame:    jest.fn().mockResolvedValue({ gameId: '730', name: 'CS2', platform: 'steam' }),
  removeFavoriteGame: jest.fn().mockResolvedValue({ removed: 1 }),
  getProfileGames:    jest.fn().mockResolvedValue([]),
  addProfileGame:     jest.fn().mockResolvedValue({ gameId: '1', name: 'Fortnite', platform: 'psn' }),
  removeProfileGame:  jest.fn().mockResolvedValue({ removed: 1 }),
  setOnlineStatus:    jest.fn().mockResolvedValue(undefined),
  setSkillTag:        jest.fn().mockResolvedValue(undefined),
  getRecommendations: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/steam.service', () => ({ getGames: jest.fn().mockResolvedValue([]) }));
jest.mock('../../src/services/psn.service',   () => ({}));
jest.mock('../../src/services/xbox.service',  () => ({}));

const userService = require('../../src/services/user.service');

describe('GET /api/users/me/profile', () => {
  it('200 devuelve el perfil propio', async () => {
    const res = await request(app).get('/api/users/me/profile').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile).toHaveProperty('uid', 'user123');
  });

  it('404 si el servicio lanza error con status', async () => {
    userService.getMyProfile.mockRejectedValueOnce(Object.assign(new Error('Not found'), { status: 404 }));
    const res = await request(app).get('/api/users/me/profile').set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/users/me/status', () => {
  it('200 actualiza el estado online', async () => {
    const res = await request(app).patch('/api/users/me/status')
      .set('Authorization', 'Bearer token').send({ isOnline: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Status updated');
  });

  it('400 si isOnline no es boolean', async () => {
    const res = await request(app).patch('/api/users/me/status')
      .set('Authorization', 'Bearer token').send({ isOnline: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/users/:id/settings', () => {
  it('200 actualiza las settings', async () => {
    const res = await request(app).patch('/api/users/user123/settings')
      .set('Authorization', 'Bearer token').send({ notifications: false, privacy: 'private' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Settings updated');
  });

  it('400 si privacy tiene valor inválido', async () => {
    const res = await request(app).patch('/api/users/user123/settings')
      .set('Authorization', 'Bearer token').send({ privacy: 'invalido' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('POST /api/users/:id/settings', () => {
  it('201 crea settings con defaults', async () => {
    const res = await request(app).post('/api/users/user123/settings')
      .set('Authorization', 'Bearer token').send({});
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Settings created');
  });
});

describe('GET /api/users/:id/favorites', () => {
  it('200 devuelve los juegos favoritos', async () => {
    const res = await request(app).get('/api/users/user123/favorites').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('favoriteGames');
    expect(Array.isArray(res.body.favoriteGames)).toBe(true);
  });
});

describe('POST /api/users/:id/favorites', () => {
  it('201 agrega un juego a favoritos', async () => {
    const res = await request(app).post('/api/users/user123/favorites')
      .set('Authorization', 'Bearer token')
      .send({ gameId: '730', name: 'CS2', platform: 'steam' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Game added to favorites');
    expect(res.body).toHaveProperty('game');
  });

  it('400 si falta gameId', async () => {
    const res = await request(app).post('/api/users/user123/favorites')
      .set('Authorization', 'Bearer token')
      .send({ name: 'CS2', platform: 'steam' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si la plataforma es inválida', async () => {
    const res = await request(app).post('/api/users/user123/favorites')
      .set('Authorization', 'Bearer token')
      .send({ gameId: '730', name: 'CS2', platform: 'nintendo' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('DELETE /api/users/:id/favorites/:gameId', () => {
  it('200 elimina un juego de favoritos', async () => {
    const res = await request(app).delete('/api/users/user123/favorites/730')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Game removed from favorites');
  });
});

describe('GET /api/users/:id/profile-games', () => {
  it('200 devuelve los profile games', async () => {
    const res = await request(app).get('/api/users/user123/profile-games').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profileGames');
  });
});

describe('POST /api/users/:id/profile-games', () => {
  it('201 agrega un profile game', async () => {
    const res = await request(app).post('/api/users/user123/profile-games')
      .set('Authorization', 'Bearer token')
      .send({ gameId: '1', name: 'Fortnite', platform: 'psn' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Game added to profile');
  });

  it('400 si falta name', async () => {
    const res = await request(app).post('/api/users/user123/profile-games')
      .set('Authorization', 'Bearer token')
      .send({ gameId: '1', platform: 'psn' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id/profile-games/:gameId', () => {
  it('200 elimina un profile game', async () => {
    const res = await request(app).delete('/api/users/user123/profile-games/1')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Game removed from profile');
  });
});

describe('PATCH /api/users/:id/skills/:gameId', () => {
  it('200 actualiza el skill tag', async () => {
    const res = await request(app).patch('/api/users/user123/skills/730')
      .set('Authorization', 'Bearer token')
      .send({ level: 'advanced' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Skill tag updated');
  });

  it('400 si el nivel es inválido', async () => {
    const res = await request(app).patch('/api/users/user123/skills/730')
      .set('Authorization', 'Bearer token')
      .send({ level: 'pro' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('200 si level es null (elimina el tag)', async () => {
    const res = await request(app).patch('/api/users/user123/skills/730')
      .set('Authorization', 'Bearer token')
      .send({ level: null });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/users/:id/recommendations', () => {
  it('200 devuelve recomendaciones', async () => {
    const res = await request(app).get('/api/users/user123/recommendations').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
  });
});
