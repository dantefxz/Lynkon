const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de perfiles y configuración de usuarios
 */

/**
 * @swagger
 * /users/me/profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario autenticado
 *       401:
 *         description: No autorizado
 */
router.get('/me/profile', authenticate, ctrl.getMyProfile);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Busca usuarios por username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: "Neon"
 *     responses:
 *       200:
 *         description: Lista de usuarios encontrados
 *       400:
 *         description: Query menor a 2 caracteres
 */
router.get('/search', authenticate, ctrl.searchUsers);

/**
 * @swagger
 * /users/{id}/profile:
 *   get:
 *     summary: Obtiene el perfil de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       404:
 *         description: Usuario no encontrado
 *   post:
 *     summary: Crea el perfil inicial del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 example: "Me encanta el gaming"
 *               avatarId:
 *                 type: string
 *                 example: "avatar_03"
 *               favoriteGames:
 *                 type: array
 *                 items:
 *                   type: object
 *                 example: [{ "gameId": "730", "name": "CS2", "platform": "steam" }]
 *     responses:
 *       201:
 *         description: Perfil creado
 *       400:
 *         description: Campos inválidos
 *   patch:
 *     summary: Edita el perfil del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               avatarId:
 *                 type: string
 *               favoriteGames:
 *                 type: array
 *                 items:
 *                   type: object
 *               skillTags:
 *                 type: object
 *                 example: { "730": "Gold" }
 *               featuredAchievements:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       400:
 *         description: Sin campos válidos o bio demasiado larga
 */
router.get('/:id/profile',   authenticate,                 ctrl.getProfile);
router.post('/:id/profile',  authenticate, authorizeOwner, ctrl.createProfile);
router.patch('/:id/profile', authenticate, authorizeOwner, ctrl.updateProfile);

/**
 * @swagger
 * /users/{id}/settings:
 *   get:
 *     summary: Obtiene la configuración del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuración del usuario
 *       404:
 *         description: Settings no encontrados
 *   post:
 *     summary: Inicializa la configuración del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: boolean
 *                 example: true
 *               privacy:
 *                 type: string
 *                 enum: [public, friends, private]
 *                 example: "public"
 *     responses:
 *       201:
 *         description: Settings creados
 *   patch:
 *     summary: Actualiza la configuración del usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: boolean
 *               privacy:
 *                 type: string
 *                 enum: [public, friends, private]
 *     responses:
 *       200:
 *         description: Settings actualizados
 *       400:
 *         description: Sin campos válidos
 */
router.get('/:id/settings',   authenticate, authorizeOwner, ctrl.getSettings);
router.post('/:id/settings',  authenticate, authorizeOwner, ctrl.createSettings);
router.patch('/:id/settings', authenticate, authorizeOwner, ctrl.updateSettings);

/**
 * @swagger
 * /users/{id}/recommendations:
 *   get:
 *     summary: Usuarios recomendados por juegos en común (solo +16 años)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuarios recomendados
 *       403:
 *         description: Solo disponible para usuarios de 16 años o más
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id/recommendations', authenticate, authorizeOwner, ctrl.getRecommendations);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina la cuenta del usuario y todos sus datos
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/:id', authenticate, authorizeOwner, ctrl.deleteUser);

module.exports = router;