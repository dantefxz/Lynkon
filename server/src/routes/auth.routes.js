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
 *         description: Usuario registrado exitosamente. Devuelve idToken para uso inmediato
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
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login exitoso. Devuelve idToken y datos del usuario
 *       401:
 *         description: Credenciales inválidas
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/login', ctrl.login);

module.exports = router;