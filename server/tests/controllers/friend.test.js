const request = require('supertest');
const app     = require('../../src/app');

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate:   (req, _res, next) => { req.user = { uid: 'user123', isUnder16: false }; next(); },
  authorizeOwner: (_req, _res, next) => next(),
  blockUnder16:   (_req, _res, next) => next(),
}));

jest.mock('../../src/config/firebase', () => ({
  auth: { deleteUser: jest.fn().mockResolvedValue(true) },
  db: {
    collection: () => ({
      doc: () => ({
        get:    jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        set:    jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
      }),
      where:   jest.fn().mockReturnThis(),
      limit:   jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get:     jest.fn().mockResolvedValue({ docs: [], empty: true }),
    }),
  },
  admin: { apps: ['initialized'] },
}));

jest.mock('../../src/services/friend.service', () => ({
  getFriends: jest.fn().mockResolvedValue([
    { uid: 'user456', username: 'OtherGamer', avatarId: 'avatar_01' },
  ]),
  getFriendRequests: jest.fn().mockResolvedValue([
    { requestId: 'req123', fromUserId: 'user789', username: 'ThirdGamer', avatarId: 'avatar_02' },
  ]),
  sendFriendRequest: jest.fn().mockResolvedValue('req456'),
  respondToRequest:  jest.fn().mockResolvedValue(undefined),
  removeFriend:      jest.fn().mockResolvedValue(undefined),
}));

// ─── GET /api/friends/me ──────────────────────────────────────────────────────
describe('GET /api/friends/me', () => {
  it('200 devuelve la lista de amigos', async () => {
    const res = await request(app).get('/api/friends/me').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('friends');
    expect(Array.isArray(res.body.friends)).toBe(true);
  });

  it('devuelve un array con el formato correcto', async () => {
    const res = await request(app).get('/api/friends/me').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.friends)).toBe(true);
    expect(res.body.friends[0]).toHaveProperty('uid');
    expect(res.body.friends[0]).toHaveProperty('username');
  });
});

// ─── GET /api/friends/me/requests ────────────────────────────────────────────
describe('GET /api/friends/me/requests', () => {
  it('200 devuelve las solicitudes pendientes', async () => {
    const res = await request(app).get('/api/friends/me/requests').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('requests');
    expect(Array.isArray(res.body.requests)).toBe(true);
  });
});

// ─── POST /api/friends/me/requests ───────────────────────────────────────────
describe('POST /api/friends/me/requests', () => {
  it('201 envía solicitud de amistad', async () => {
    const res = await request(app)
      .post('/api/friends/me/requests')
      .set('Authorization', 'Bearer token')
      .send({ targetUserId: 'user456' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Friend request sent');
    expect(res.body).toHaveProperty('requestId');
  });

  it('400 si no se envía targetUserId', async () => {
    const res = await request(app)
      .post('/api/friends/me/requests')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si el usuario se envía solicitud a sí mismo', async () => {
    const res = await request(app)
      .post('/api/friends/me/requests')
      .set('Authorization', 'Bearer token')
      .send({ targetUserId: 'user123' }); // mismo uid que el autenticado
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatch(/yourself/i);
  });
});

// ─── PATCH /api/friends/me/requests/:requestId ───────────────────────────────
describe('PATCH /api/friends/me/requests/:requestId', () => {
  it('200 acepta una solicitud (action: true)', async () => {
    const res = await request(app)
      .patch('/api/friends/me/requests/req123')
      .set('Authorization', 'Bearer token')
      .send({ action: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Friend request accepted');
  });

  it('200 rechaza una solicitud (action: false)', async () => {
    const res = await request(app)
      .patch('/api/friends/me/requests/req123')
      .set('Authorization', 'Bearer token')
      .send({ action: false });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Friend request rejected');
  });

  it('400 si action no es booleano', async () => {
    const res = await request(app)
      .patch('/api/friends/me/requests/req123')
      .set('Authorization', 'Bearer token')
      .send({ action: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si action no se envía', async () => {
    const res = await request(app)
      .patch('/api/friends/me/requests/req123')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/friends/me/:friendId ────────────────────────────────────────
describe('DELETE /api/friends/me/:friendId', () => {
  it('200 elimina un amigo', async () => {
    const res = await request(app)
      .delete('/api/friends/me/user456')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Friend removed');
  });
});
