const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const platformRoutes     = require('./routes/platform.routes');
const platformAuthRoutes = require('./routes/platform-auth.routes');
const friendRoutes   = require('./routes/friend.routes');
const messageRoutes  = require('./routes/message.routes');
const app = express();


// ─── Middlewares globales ─────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors()); 
app.use(helmet({ contentSecurityPolicy: false }));

app.use(morgan('dev'));
app.use(express.json());
// ─── Swagger ─────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/platforms/auth', platformAuthRoutes);
app.use('/api/friends',   friendRoutes);
app.use('/api/messages',  messageRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', project: 'Lynkon API', version: '1.0.0' })
);

// ─── Debug: test Firebase ────────────────────────────────────────────────────
app.get('/api/debug/firebase', async (_req, res) => {
  try {
    const { auth } = require('./config/firebase'); 
    await auth.getUser('check-connection-123');
    
    res.json({ status: 'Firebase OK', message: 'Conexión establecida correctamente' });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.json({ 
        status: 'Firebase OK', 
        message: 'Conexión exitosa (el usuario no existe, pero Firebase respondió)' 
      });
    }
    res.status(500).json({ 
      status: 'Firebase Error', 
      error: err.message, 
      code: err.code 
    });
  }
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler global ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
