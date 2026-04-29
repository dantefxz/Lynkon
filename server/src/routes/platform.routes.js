const router = require('express').Router();
const ctrl   = require('../controllers/platform.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Platforms
 *   description: Vinculación y consulta de plataformas de videojuegos
 */

/**
 * @swagger
 * /platforms/supported:
 *   get:
 *     summary: Lista las plataformas disponibles para vincular
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plataformas soportadas (steam, psn, xbox, riot)
 */
router.get('/supported', authenticate, ctrl.getSupportedPlatforms);

/**
 * @swagger
 * /platforms/{userId}:
 *   get:
 *     summary: Plataformas vinculadas del usuario
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de plataformas vinculadas
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:userId', authenticate, ctrl.getLinkedPlatforms);

/**
 * @swagger
 * /platforms/{userId}/link:
 *   post:
 *     summary: Vincula una plataforma al usuario
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platform, platformUserId]
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [steam, psn, xbox, riot]
 *                 example: "steam"
 *               platformUserId:
 *                 type: string
 *                 description: steamId / puuid / xuid / npssoToken según la plataforma
 *                 example: "76561198xxxxxxxxx"
 *     responses:
 *       201:
 *         description: Plataforma vinculada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Plataforma ya vinculada
 */
router.post('/:userId/link', authenticate, authorizeOwner, ctrl.linkPlatform);

/**
 * @swagger
 * /platforms/{userId}/{platform}:
 *   delete:
 *     summary: Desvincula una plataforma del usuario
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox, riot]
 *     responses:
 *       200:
 *         description: Plataforma desvinculada
 *       404:
 *         description: Plataforma no vinculada
 */
router.delete('/:userId/:platform', authenticate, authorizeOwner, ctrl.unlinkPlatform);

/**
 * @swagger
 * /platforms/{userId}/{platform}/stats:
 *   get:
 *     summary: Estadísticas del usuario en una plataforma
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox, riot]
 *     responses:
 *       200:
 *         description: Estadísticas de la plataforma
 *       404:
 *         description: Plataforma no vinculada
 */
router.get('/:userId/:platform/stats', authenticate, ctrl.getPlatformStats);

/**
 * @swagger
 * /platforms/{userId}/{platform}/games:
 *   get:
 *     summary: Lista de juegos del usuario en una plataforma
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox, riot]
 *     responses:
 *       200:
 *         description: Lista de juegos
 *       404:
 *         description: Plataforma no vinculada
 */
router.get('/:userId/:platform/games', authenticate, ctrl.getPlatformGames);

/**
 * @swagger
 * /platforms/{userId}/{platform}/achievements:
 *   get:
 *     summary: Logros del usuario en una plataforma
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox, riot]
 *     responses:
 *       200:
 *         description: Lista de logros
 *       404:
 *         description: Plataforma no vinculada
 */
router.get('/:userId/:platform/achievements', authenticate, ctrl.getPlatformAchievements);

module.exports = router;