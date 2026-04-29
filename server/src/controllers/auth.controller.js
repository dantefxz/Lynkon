const { db, auth } = require('../config/firebase');
const { parseRegisterDTO, parseLoginDTO } = require('../dtos/auth.dto');
const { generateUsername } = require('../utils/username.utils');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Secret para firmar JWTs (en producción, usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'lynkon-dev-secret-key-2026';

/**
 * POST /api/auth/register
 * Crea un usuario en Firebase Auth y su perfil en Firestore
 * Retorna el idToken para autenticación inmediata
 */
const register = async (req, res, next) => {
  try {
    const { data, errors } = parseRegisterDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    console.log('[INFO] Creando usuario:', data.email);

    // Crear usuario en Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
      });
      console.log('[OK] Usuario creado en Firebase Auth:', userRecord.uid);
    } catch (err) {
      console.error('[ERROR] Error creating user in Firebase Auth:', err.code, err.message);
      if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Email already registered' });
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;

    // Calcular edad
    const birth = new Date(data.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    const userDoc = {
      uid,
      email: data.email,
      username:     data.username || generateUsername(),
      birthDate:    data.birthDate,
      age,
      isUnder16:    age < 16,
      authProvider: data.authProvider,
      bio:          '',
      avatarId:     null,
      favoriteGames:        [],
      featuredAchievements: [],
      skillTags:            {},
      platforms:    [],
      friends:      [],
      createdAt:    new Date().toISOString(),
    };

    // Persistir perfil en Firestore
    await db.collection('users').doc(uid).set(userDoc);

    // Generar JWT firmado por el servidor
    const idToken = jwt.sign(
      { uid, email: data.email, username: userDoc.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: { uid, username: userDoc.username, email: userDoc.email, isUnder16: userDoc.isUnder16 },
      idToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Valida las credenciales usando Firebase Auth REST API y devuelve un JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ errors: ['email and password are required'] });
    }

    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      console.error('[ERROR] FIREBASE_API_KEY no está definida en .env');
      return res.status(500).json({ error: 'Server misconfiguration: missing FIREBASE_API_KEY' });
    }

    // Validar credenciales via Firebase Auth REST API (única forma server-side de verificar password)
    let firebaseUser;
    try {
      const firebaseRes = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        { email, password, returnSecureToken: true }
      );
      firebaseUser = firebaseRes.data;
    } catch (err) {
      const code = err.response?.data?.error?.message;
      console.warn('[WARN] Firebase login error:', code);
      if (
        code === 'INVALID_PASSWORD' ||
        code === 'EMAIL_NOT_FOUND' ||
        code === 'INVALID_LOGIN_CREDENTIALS' ||
        code === 'USER_DISABLED'
      ) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      throw err;
    }

    // Verificar que el perfil en Firestore existe
    const userSnap = await db.collection('users').doc(firebaseUser.localId).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found. Complete registration first.' });
    }

    const u = userSnap.data();

    // Generar JWT firmado por el servidor
    const idToken = jwt.sign(
      { uid: u.uid, email: u.email, username: u.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: { uid: u.uid, username: u.username, email: u.email, isUnder16: u.isUnder16 },
      idToken,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };