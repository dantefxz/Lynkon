const router = require('express').Router();
const ctrl   = require('../controllers/friend.controller');
const { authenticate, authorizeOwner, blockUnder16 } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Sistema de amigos y solicitudes de amistad
 */

/**
 * @swagger
 * /friends/me:
 *   get:
 *     summary: Lista los amigos del usuario autenticado
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de amigos con perfil básico
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', authenticate, blockUnder16, ctrl.getFriends);

/**
 * @swagger
 * /friends/me/requests:
 *   get:
 *     summary: Solicitudes de amistad pendientes recibidas
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes pendientes
 *   post:
 *     summary: Envía una solicitud de amistad
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 example: "uid_del_otro_usuario"
 *     responses:
 *       201:
 *         description: Solicitud enviada
 *       400:
 *         description: No podés enviarte una solicitud a vos mismo
 *       409:
 *         description: Ya son amigos o solicitud ya enviada
 */
router.get('/me/requests',  authenticate, blockUnder16, ctrl.getFriendRequests);
router.post('/me/requests', authenticate, blockUnder16, ctrl.sendFriendRequest);

/**
 * @swagger
 * /friends/me/requests/{requestId}:
 *   patch:
 *     summary: Acepta o rechaza una solicitud de amistad
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "abc123xyz"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Solicitud procesada
 *       400:
 *         description: Action inválida
 *       403:
 *         description: La solicitud no fue enviada a este usuario
 *       409:
 *         description: Solicitud ya procesada
 */

router.patch('/me/requests/:requestId', authenticate, blockUnder16, ctrl.respondToRequest);

/**
 * @swagger
 * /friends/me/{friendId}:
 *   delete:
 *     summary: Elimina un amigo de la lista
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Amigo eliminado
 */
router.delete('/me/:friendId', authenticate, blockUnder16, ctrl.removeFriend);

module.exports = router;