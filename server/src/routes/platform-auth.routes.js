const express  = require('express');
const router   = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  steamInit, steamCallback,
  xboxInit,  xboxCallback,
} = require('../controllers/platform-auth.controller');

/**
 * @swagger
 * /platforms/auth/steam/init:
 *   post:
 *     summary: Inicia el flujo de autenticación con Steam (OpenID 2.0)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: URL de redirección a Steam
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl: { type: string }
 */
router.post('/steam/init', authenticate, steamInit);

/**
 * @swagger
 * /platforms/auth/steam/callback:
 *   get:
 *     summary: Callback de Steam OpenID — redirige al deep link de la app
 *     parameters:
 *       - in: query
 *         name: state
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect al deep link lynkon://platform-linked
 */
router.get('/steam/callback', steamCallback);

/**
 * @swagger
 * /platforms/auth/xbox/init:
 *   post:
 *     summary: Inicia el flujo OAuth de Xbox (Microsoft Identity)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: URL de redirección a Microsoft
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl: { type: string }
 */
router.post('/xbox/init', authenticate, xboxInit);

/**
 * @swagger
 * /platforms/auth/xbox/callback:
 *   get:
 *     summary: Callback de Microsoft OAuth — redirige al deep link de la app
 *     parameters:
 *       - in: query
 *         name: code
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect al deep link lynkon://platform-linked
 */
router.get('/xbox/callback', xboxCallback);

module.exports = router;