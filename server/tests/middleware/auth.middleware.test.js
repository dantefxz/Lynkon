const jwt = require('jsonwebtoken');

const mockUpdate = jest.fn().mockResolvedValue(true);
jest.mock('../../src/config/firebase', () => ({
  db: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockUpdate }),
    }),
  },
  admin: { apps: ['initialized'] },
}));

const { authenticate, authorizeOwner, blockUnder16 } = require('../../src/middleware/auth.middleware');

const JWT_SECRET = 'lynkon-dev-secret-key-2026';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate', () => {
  it('401 si no hay header Authorization', async () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401 si el header no empieza con Bearer', async () => {
    const req  = { headers: { authorization: 'Basic abc123' } };
    const res  = mockRes();
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('llama next y setea req.user con token válido', async () => {
    const token = jwt.sign({ uid: 'user123' }, JWT_SECRET);
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    const next  = jest.fn();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toHaveProperty('uid', 'user123');
  });

  it('401 con token inválido / expirado', async () => {
    const req  = { headers: { authorization: 'Bearer token.invalido.abc' } };
    const res  = mockRes();
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorizeOwner', () => {
  it('llama next si req.user.uid coincide con params.userId', () => {
    const req  = { user: { uid: 'user123' }, params: { userId: 'user123' } };
    const res  = mockRes();
    const next = jest.fn();
    authorizeOwner(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('llama next si req.user.uid coincide con params.id', () => {
    const req  = { user: { uid: 'user123' }, params: { id: 'user123' } };
    const res  = mockRes();
    const next = jest.fn();
    authorizeOwner(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('403 si el uid no coincide con el parámetro de ruta', () => {
    const req  = { user: { uid: 'user123' }, params: { userId: 'otro-user' } };
    const res  = mockRes();
    const next = jest.fn();
    authorizeOwner(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('blockUnder16', () => {
  it('403 si el usuario es menor de 16', () => {
    const req  = { user: { isUnder16: true } };
    const res  = mockRes();
    const next = jest.fn();
    blockUnder16(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('llama next si el usuario tiene 16 o más', () => {
    const req  = { user: { isUnder16: false } };
    const res  = mockRes();
    const next = jest.fn();
    blockUnder16(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('llama next si isUnder16 no está definido', () => {
    const req  = { user: {} };
    const res  = mockRes();
    const next = jest.fn();
    blockUnder16(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
