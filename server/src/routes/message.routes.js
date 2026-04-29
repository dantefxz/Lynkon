const router = require('express').Router();
const ctrl   = require('../controllers/message.controller');
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Chat de texto entre amigos (solo texto, sin imágenes ni audio)
 */

/**
 * @swagger
 * /messages/me:
 *   get:
 *     summary: Lista las conversaciones activas del usuario
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones con último mensaje y no leídos
 *   post:
 *     summary: Envía un mensaje de texto a un amigo
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toUserId, text]
 *             properties:
 *               toUserId:
 *                 type: string
 *                 example: "uid_del_amigo"
 *               text:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Hey, jugamos una partida?"
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *       400:
 *         description: Texto vacío o demasiado largo
 *       403:
 *         description: Solo podés mensajear a tus amigos
 *   delete:
 *     summary: Elimina una conversación (solo para el solicitante)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [friendId]
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "uid_del_amigo"
 *     responses:
 *       200:
 *         description: Conversación eliminada
 */
router.get('/me',    authenticate, ctrl.getConversations);
router.post('/me',   authenticate, ctrl.sendMessage);
router.delete('/me', authenticate, ctrl.deleteConversation);

/**
 * @swagger
 * /messages/me/{friendId}:
 *   get:
 *     summary: Historial de mensajes entre el usuario autenticado y un amigo
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         example: "2026-04-01T12:00:00.000Z"
 *     responses:
 *       200:
 *         description: Lista de mensajes ordenados por fecha
 */
router.get('/me/:friendId',   authenticate, ctrl.getMessages);

/**
 * @swagger
 * /messages/me/{messageId}:
 *   patch:
 *     summary: Marca un mensaje como leído
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [friendId]
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "uid_del_amigo"
 *     responses:
 *       200:
 *         description: Mensaje marcado como leído
 */
router.patch('/me/:messageId', authenticate, ctrl.markAsRead);

module.exports = router;