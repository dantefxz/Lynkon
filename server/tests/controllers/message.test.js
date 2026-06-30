const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate:   (req, _res, next) => { req.user = { uid: 'user123', isUnder16: false }; next(); },
  authorizeOwner: (_req, _res, next) => next(),
  blockUnder16:   (_req, _res, next) => next(),
}));

jest.mock('../../src/config/firebase', () => ({
  auth:  {},
  db:    { collection: jest.fn() },
  admin: { apps: ['initialized'] },
}));

jest.mock('../../src/services/message.service', () => ({
  getConversations:     jest.fn().mockResolvedValue([{ conversationId: 'c1', with: { uid: 'u2' } }]),
  getMessages:          jest.fn().mockResolvedValue([{ messageId: 'm1', text: 'Hola' }]),
  sendMessage:          jest.fn().mockResolvedValue('msg-id-123'),
  markAsRead:           jest.fn().mockResolvedValue(undefined),
  markConversationRead: jest.fn().mockResolvedValue(undefined),
  deleteConversation:   jest.fn().mockResolvedValue(undefined),
}));

const messageService = require('../../src/services/message.service');

describe('GET /api/messages/me', () => {
  it('200 devuelve conversaciones', async () => {
    const res = await request(app).get('/api/messages/me').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('conversations');
    expect(Array.isArray(res.body.conversations)).toBe(true);
  });

  it('500 si el servicio falla', async () => {
    messageService.getConversations.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/messages/me').set('Authorization', 'Bearer token');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/messages/me/:friendId', () => {
  it('200 devuelve mensajes', async () => {
    const res = await request(app).get('/api/messages/me/friend456').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messages');
    expect(Array.isArray(res.body.messages)).toBe(true);
  });
});

describe('POST /api/messages/me', () => {
  it('201 envía un mensaje con datos válidos', async () => {
    const res = await request(app).post('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ toUserId: 'friend456', text: 'Jugamos una partida?' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('messageId', 'msg-id-123');
    expect(res.body).toHaveProperty('message', 'Message sent');
  });

  it('400 si falta text', async () => {
    const res = await request(app).post('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ toUserId: 'friend456' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si falta toUserId', async () => {
    const res = await request(app).post('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ text: 'Hola!' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 si text está vacío', async () => {
    const res = await request(app).post('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ toUserId: 'friend456', text: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('403 si el destinatario no es amigo', async () => {
    messageService.sendMessage.mockRejectedValueOnce(
      Object.assign(new Error('You can only message your friends'), { status: 403 }),
    );
    const res = await request(app).post('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ toUserId: 'stranger', text: 'Hola!' });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/messages/me/:friendId/read', () => {
  it('200 marca la conversación como leída', async () => {
    const res = await request(app).patch('/api/messages/me/friend456/read')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Conversation marked as read');
  });

  it('500 si el servicio falla', async () => {
    messageService.markConversationRead.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).patch('/api/messages/me/friend456/read')
      .set('Authorization', 'Bearer token');
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/messages/me/:messageId', () => {
  it('200 marca el mensaje como leído', async () => {
    const res = await request(app).patch('/api/messages/me/msg-id-123')
      .set('Authorization', 'Bearer token')
      .send({ friendId: 'friend456' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Marked as read');
  });

  it('400 si falta friendId', async () => {
    const res = await request(app).patch('/api/messages/me/msg-id-123')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('DELETE /api/messages/me', () => {
  it('200 elimina la conversación', async () => {
    const res = await request(app).delete('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ friendId: 'friend456' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Conversation deleted');
  });

  it('400 si falta friendId', async () => {
    const res = await request(app).delete('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('500 si el servicio falla', async () => {
    messageService.deleteConversation.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).delete('/api/messages/me')
      .set('Authorization', 'Bearer token')
      .send({ friendId: 'friend456' });
    expect(res.status).toBe(500);
  });
});
