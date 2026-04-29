const jwt = require('jsonwebtoken');

// Secret para validar JWTs (debe coincidir con el de auth.controller.js)
const JWT_SECRET = process.env.JWT_SECRET || 'lynkon-dev-secret-key-2026';

/**
 * Verifica el JWT en el header Authorization: Bearer <token>
 * Adjunta el usuario decodificado a req.user
 */
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Verifica que el usuario autenticado solo acceda a sus propios recursos.
 * Usar después de `authenticate` en rutas con :userId o :id.
 */
const authorizeOwner = (req, res, next) => {
  const paramId = req.params.userId || req.params.id;
  if (req.user.uid !== paramId) {
    return res.status(403).json({ error: 'Forbidden: cannot access another user\'s resources' });
  }
  next();
};

module.exports = { authenticate, authorizeOwner };
