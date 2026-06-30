const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate:   (req, _res, next) => { req.user = { uid: 'user123', isUnder16: false }; next(); },
  authorizeOwner: (_req, _res, next) => next(),
  blockUnder16:   (_req, _res, next) => next(),
}));

const linkedPlatforms = [{ platform: 'steam', platformUserId: '76561198000000001', linkedAt: '2026-01-01' }];

const makeVisibilityDoc = (hidden = false) => ({
  get:  jest.fn().mockResolvedValue({ exists: true, data: () => ({ hidden, platform: 'steam', gameId: '730' }) }),
  set:  jest.fn().mockResolvedValue(true),
});

const makeVisibilityCollection = () => ({
  doc:  jest.fn().mockImplementation(() => makeVisibilityDoc()),
  get:  jest.fn().mockResolvedValue({
    docs: [{ data: () => ({ platform: 'steam', gameId: '730', hidden: false }) }],
  }),
});

jest.mock('../../src/config/firebase', () => ({
  auth:  {},
  db: {
    collection: jest.fn().mockImplementation(() => ({
      doc: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: 'user123', platforms: linkedPlatforms,
            favoriteGames: [{ gameId: '730', platform: 'steam' }],
            profileGames:  [],
          }),
        }),
        update:     jest.fn().mockResolvedValue(true),
        collection: jest.fn().mockImplementation(() => makeVisibilityCollection()),
      })),
    })),
  },
  admin: { apps: ['initialized'] },
}));

jest.mock('../../src/services/steam.service', () => ({
  resolveId:          jest.fn().mockResolvedValue('76561198000000001'),
  getStats:           jest.fn().mockResolvedValue({ level: 42 }),
  getGames:           jest.fn().mockResolvedValue([{ gameId: '730', name: 'CS2', playtimeHours: 100 }]),
  getAchievements:    jest.fn().mockResolvedValue([]),
  getGameAchievements: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/psn.service', () => ({
  getStats:           jest.fn().mockResolvedValue({ trophies: 50 }),
  getGames:           jest.fn().mockResolvedValue([]),
  getAchievements:    jest.fn().mockResolvedValue([]),
  getGameAchievements: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/xbox.service', () => ({
  getStats:           jest.fn().mockResolvedValue({ gamerscore: 5000 }),
  getGames:           jest.fn().mockResolvedValue([]),
  getAchievements:    jest.fn().mockResolvedValue([]),
  getGameAchievements: jest.fn().mockResolvedValue([]),
}));

describe('GET /api/platforms/supported', () => {
  it('200 devuelve la lista de plataformas', async () => {
    const res = await request(app).get('/api/platforms/supported').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('platforms');
    expect(res.body.platforms.map((p) => p.id)).toEqual(expect.arrayContaining(['steam', 'psn', 'xbox']));
  });
});

describe('GET /api/platforms/me', () => {
  it('200 devuelve las plataformas vinculadas', async () => {
    const res = await request(app).get('/api/platforms/me').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('platforms');
    expect(Array.isArray(res.body.platforms)).toBe(true);
  });
});

describe('POST /api/platforms/me/link', () => {
  it('409 si la plataforma ya está vinculada', async () => {
    const res = await request(app).post('/api/platforms/me/link')
      .set('Authorization', 'Bearer token')
      .send({ platform: 'steam', platformUserId: '76561198000000001' });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('400 si falta platform', async () => {
    const res = await request(app).post('/api/platforms/me/link')
      .set('Authorization', 'Bearer token')
      .send({ platformUserId: 'abc123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si falta platformUserId', async () => {
    const res = await request(app).post('/api/platforms/me/link')
      .set('Authorization', 'Bearer token')
      .send({ platform: 'psn' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si platform es inválida', async () => {
    const res = await request(app).post('/api/platforms/me/link')
      .set('Authorization', 'Bearer token')
      .send({ platform: 'nintendo', platformUserId: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('DELETE /api/platforms/me/:platform', () => {
  it('200 desvincula steam', async () => {
    const res = await request(app).delete('/api/platforms/me/steam')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('404 si la plataforma no está vinculada', async () => {
    const res = await request(app).delete('/api/platforms/me/psn')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/platforms/me/:platform/stats', () => {
  it('200 devuelve stats de steam', async () => {
    const res = await request(app).get('/api/platforms/me/steam/stats')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body).toHaveProperty('platform', 'steam');
  });

  it('400 si la plataforma no existe', async () => {
    const res = await request(app).get('/api/platforms/me/nintendo/stats')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/platforms/me/:platform/games', () => {
  it('200 devuelve juegos de steam', async () => {
    const res = await request(app).get('/api/platforms/me/steam/games')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('games');
    expect(res.body).toHaveProperty('platform', 'steam');
  });

  it('400 si la plataforma es inválida', async () => {
    const res = await request(app).get('/api/platforms/me/nintendo/games')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/platforms/me/:platform/achievements', () => {
  it('200 devuelve achievements', async () => {
    const res = await request(app).get('/api/platforms/me/steam/achievements')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('achievements');
  });

  it('400 si la plataforma es inválida', async () => {
    const res = await request(app).get('/api/platforms/me/invalid/achievements')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/platforms/me/:platform/sync', () => {
  it('200 sincroniza steam', async () => {
    const res = await request(app).post('/api/platforms/me/steam/sync')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('platform', 'steam');
  });

  it('400 si la plataforma es inválida', async () => {
    const res = await request(app).post('/api/platforms/me/invalid/sync')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/platforms/me/visibility', () => {
  it('200 devuelve el mapa de visibilidad', async () => {
    const res = await request(app).get('/api/platforms/me/visibility')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('visibility');
  });
});

describe('PATCH /api/platforms/me/:platform/games/:gameId/visibility', () => {
  it('200 alterna la visibilidad de un juego', async () => {
    const res = await request(app).patch('/api/platforms/me/steam/games/730/visibility')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hidden');
    expect(res.body).toHaveProperty('platform', 'steam');
  });

  it('400 si la plataforma es inválida', async () => {
    const res = await request(app).patch('/api/platforms/me/invalid/games/730/visibility')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/platforms/me/:platform/games/:gameId/achievements', () => {
  it('200 devuelve achievements de un juego', async () => {
    const res = await request(app).get('/api/platforms/me/steam/games/730/achievements')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('achievements');
  });

  it('400 si la plataforma es inválida', async () => {
    const res = await request(app).get('/api/platforms/me/invalid/games/730/achievements')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(400);
  });
});
