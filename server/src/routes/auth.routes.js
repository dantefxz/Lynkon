const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registro y login de usuarios
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, birthDate]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *               birthDate:
 *                 type: string
 *                 example: "2000-06-15"
 *               username:
 *                 type: string
 *                 example: "NeonWolf#4823"
 *               authProvider:
 *                 type: string
 *                 enum: [email, google]
 *                 example: "email"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Campos inválidos o faltantes
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login con email y contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', ctrl.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Envía un código numérico de 6 dígitos al email del usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Código enviado (respuesta genérica por seguridad)
 *       400:
 *         description: Email inválido o faltante
 */
router.post('/forgot-password', ctrl.forgotPassword);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     summary: Verifica que el código de 6 dígitos sea válido y no haya expirado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               code:
 *                 type: string
 *                 example: "482910"
 *     responses:
 *       200:
 *         description: Código válido
 *       400:
 *         description: Código inválido o expirado
 */
router.post('/verify-reset-code', ctrl.verifyResetCode);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Restablece la contraseña usando el código numérico recibido por email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               code:
 *                 type: string
 *                 example: "482910"
 *               newPassword:
 *                 type: string
 *                 example: "NewPass99"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Código inválido/expirado o contraseña no cumple requisitos
 */
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
