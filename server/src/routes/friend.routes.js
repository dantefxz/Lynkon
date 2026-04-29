const router = require('express').Router();
const ctrl   = require('../controllers/friend.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Sistema de amigos y solicitudes de amistad
 */

/**
 * @swagger
 * /friends/{userId}:
 *   get:
 *     summary: Lista los amigos del usuario
 *     tags: [Friends]
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
 *         description: Lista de amigos con perfil básico
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:userId', authenticate, ctrl.getFriends);

/**
 * @swagger
 * /friends/{userId}/requests:
 *   get:
 *     summary: Solicitudes de amistad pendientes recibidas
 *     tags: [Friends]
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
 *         description: Lista de solicitudes pendientes
 *   post:
 *     summary: Envía una solicitud de amistad
 *     tags: [Friends]
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
router.get('/:userId/requests',  authenticate, authorizeOwner, ctrl.getFriendRequests);
router.post('/:userId/requests', authenticate, authorizeOwner, ctrl.sendFriendRequest);

/**
 * @swagger
 * /friends/{userId}/requests/{requestId}:
 *   patch:
 *     summary: Acepta o rechaza una solicitud de amistad
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *                 example: "accept"
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
router.patch('/:userId/requests/:requestId', authenticate, authorizeOwner, ctrl.respondToRequest);

/**
 * @swagger
 * /friends/{userId}/{friendId}:
 *   delete:
 *     summary: Elimina un amigo de la lista
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Amigo eliminado
 */
router.delete('/:userId/:friendId', authenticate, authorizeOwner, ctrl.removeFriend);

module.exports = router;