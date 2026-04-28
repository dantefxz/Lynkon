const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');

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
 *             required: [uid, email, birthDate]
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "abc123"
 *               email:
 *                 type: string
 *                 example: "user@email.com"
 *               birthDate:
 *                 type: string
 *                 example: "2000-06-15"
 *               username:
 *                 type: string
 *                 example: "NeonWolf#4823"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Campos inválidos o faltantes
 */
router.post('/register', ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login con Firebase ID Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: "eyJhbGci..."
 *     responses:
 *       200:
 *         description: Login exitoso
 *       404:
 *         description: Perfil no encontrado
 */
router.post('/login', ctrl.login);

module.exports = router;