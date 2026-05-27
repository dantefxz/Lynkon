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
 *         description: Lista de plataformas soportadas (steam, psn, xbox)
 */
router.get('/supported', authenticate, ctrl.getSupportedPlatforms);

/**
 * @swagger
 * /platforms/me:
 *   get:
 *     summary: Plataformas vinculadas del usuario autenticado
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plataformas vinculadas
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', authenticate, ctrl.getLinkedPlatforms);

/**
 * @swagger
 * /platforms/me/link:
 *   post:
 *     summary: Vincula una plataforma al usuario autenticado
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [steam, psn, xbox]
 *                 example: "steam"
 *               platformUserId:
 *                 type: string
 *                 description: steamId / xuid / npssoToken según la plataforma
 *                 example: "76561198xxxxxxxxx"
 *     responses:
 *       201:
 *         description: Plataforma vinculada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Plataforma ya vinculada
 */
router.post('/me/link', authenticate, ctrl.linkPlatform);

/**
 * @swagger
 * /platforms/me/{platform}:
 *   delete:
 *     summary: Desvincula una plataforma del usuario autenticado
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox]
 *     responses:
 *       200:
 *         description: Plataforma desvinculada
 *       404:
 *         description: Plataforma no vinculada
 */
router.delete('/me/:platform', authenticate, ctrl.unlinkPlatform);

/**
 * @swagger
 * /platforms/me/{platform}/stats:
 *   get:
 *     summary: Estadísticas del usuario autenticado en una plataforma
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox]
 *     responses:
 *       200:
 *         description: Estadísticas de la plataforma
 *       404:
 *         description: Plataforma no vinculada
 */
router.get('/me/:platform/stats', authenticate, ctrl.getPlatformStats);

/**
 * @swagger
 * /platforms/me/{platform}/games:
 *   get:
 *     summary: Lista de juegos del usuario autenticado en una plataforma
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox]
 *     responses:
 *       200:
 *         description: Lista de juegos
 *       404:
 *         description: Plataforma no vinculada
 */
router.get('/me/:platform/games', authenticate, ctrl.getPlatformGames);

/**
 * @swagger
 * /platforms/me/{platform}/achievements:
 *   get:
 *     summary: Logros del usuario autenticado en una plataforma
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox]
 *     responses:
 *       200:
 *         description: Lista de logros
 *       404:
 *         description: Plataforma no vinculada
 */
router.get('/me/:platform/achievements', authenticate, ctrl.getPlatformAchievements);


/**
 * @swagger
 * /platforms/me/visibility:
 *   get:
 *     summary: Obtiene el mapa de visibilidad de todos los juegos del usuario
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Mapa de visibilidades — ej. steam_730: { platform, gameId, hidden }"
 */
router.get('/me/visibility', authenticate, ctrl.getGameVisibility);

/**
 * @swagger
 * /platforms/me/{platform}/games/{gameId}/visibility:
 *   patch:
 *     summary: Alterna la visibilidad de un juego en el perfil público
 *     tags: [Platforms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [steam, psn, xbox]
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del juego en la plataforma (ej. "730" para CS2 en Steam)
 *     responses:
 *       200:
 *         description: Visibilidad actualizada. Devuelve el nuevo estado { hidden }
 *       400:
 *         description: Plataforma no soportada o gameId faltante
 */
router.patch('/me/:platform/games/:gameId/visibility', authenticate, ctrl.toggleGameVisibility);

module.exports = router;
