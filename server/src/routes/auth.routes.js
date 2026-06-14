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

module.exports = router;
