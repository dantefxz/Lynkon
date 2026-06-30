const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate:   (req, _res, next) => { req.user = { uid: 'user123' }; next(); },
  authorizeOwner: (_req, _res, next) => next(),
  blockUnder16:   (_req, _res, next) => next(),
}));

jest.mock('../../src/config/firebase', () => ({
  auth:  {},
  db: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get:    jest.fn().mockResolvedValue({ exists: true, data: () => ({ platforms: [] }) }),
        update: jest.fn().mockResolvedValue(true),
      }),
    }),
  },
  admin: { apps: ['initialized'] },
}));

jest.mock('../../src/services/platform-auth.service', () => ({
  getSteamAuthUrl:   jest.fn().mockReturnValue('https://steamcommunity.com/openid/login?...'),
  verifySteamCallback: jest.fn().mockResolvedValue('76561198000000001'),
  getXboxAuthUrl:    jest.fn().mockReturnValue('https://login.microsoftonline.com/...'),
  verifyXboxCallback:  jest.fn().mockResolvedValue('xuid_123'),
  verifyStateToken:  jest.fn().mockReturnValue({ uid: 'user123', redirectUri: null }),
  buildDeepLink:     jest.fn().mockReturnValue('lynkon://platform-linked?platform=steam&success=true'),
}));

const platformAuthService = require('../../src/services/platform-auth.service');

describe('POST /api/platforms/auth/steam/init', () => {
  it('200 devuelve authUrl de Steam', async () => {
    const res = await request(app).post('/api/platforms/auth/steam/init')
      .set('Authorization', 'Bearer token')
      .send({ redirectUri: 'lynkon://callback' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('authUrl');
    expect(res.body.authUrl).toContain('steamcommunity');
  });

  it('500 si el servicio lanza error', async () => {
    platformAuthService.getSteamAuthUrl.mockImplementationOnce(() => { throw new Error('Config error'); });
    const res = await request(app).post('/api/platforms/auth/steam/init')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.status).toBe(500);
  });
});

describe('GET /api/platforms/auth/steam/callback', () => {
  it('200 devuelve página HTML con deep link', async () => {
    const res = await request(app)
      .get('/api/platforms/auth/steam/callback?state=eyJ1aWQiOiJ1c2VyMTIzIn0');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('lynkon://');
  });

  it('200 devuelve página HTML aunque falle la verificación', async () => {
    platformAuthService.verifyStateToken.mockImplementationOnce(() => { throw new Error('Invalid state'); });
    const res = await request(app)
      .get('/api/platforms/auth/steam/callback?state=invalido');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

describe('POST /api/platforms/auth/xbox/init', () => {
  it('503 si no está configurado MICROSOFT_CLIENT_ID', async () => {
    delete process.env.MICROSOFT_CLIENT_ID;
    const res = await request(app).post('/api/platforms/auth/xbox/init')
      .set('Authorization', 'Bearer token')
      .send({ redirectUri: 'lynkon://callback' });
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('error');
  });

  it('200 devuelve authUrl de Xbox si el env está configurado', async () => {
    process.env.MICROSOFT_CLIENT_ID = 'test-client-id';
    const res = await request(app).post('/api/platforms/auth/xbox/init')
      .set('Authorization', 'Bearer token')
      .send({ redirectUri: 'lynkon://callback' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('authUrl');
    delete process.env.MICROSOFT_CLIENT_ID;
  });
});

describe('GET /api/platforms/auth/xbox/callback', () => {
  it('200 devuelve página HTML en flujo exitoso', async () => {
    const res = await request(app)
      .get('/api/platforms/auth/xbox/callback?code=auth_code&state=valid_state');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('lynkon://');
  });

  it('200 devuelve página HTML si hay error OAuth', async () => {
    const res = await request(app)
      .get('/api/platforms/auth/xbox/callback?error=access_denied&error_description=User+denied&state=valid_state');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});
