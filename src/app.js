const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const platformRoutes = require('./routes/platform.routes');
const friendRoutes   = require('./routes/friend.routes');
const messageRoutes  = require('./routes/message.routes');

const app = express();

// ─── Middlewares globales ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Swagger ─────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/friends',   friendRoutes);
app.use('/api/messages',  messageRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', project: 'Lynkon API', version: '1.0.0' })
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler global ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;