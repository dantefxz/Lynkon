const { db, auth } = require('../config/firebase');
const { parseRegisterDTO, parseLoginDTO } = require('../dtos/auth.dto');
const { generateUsername } = require('../utils/username.utils');

/**
 * POST /api/auth/register
 * El cliente crea el usuario en Firebase Auth y luego llama a este endpoint
 * para persistir el perfil en Firestore.
 */
const register = async (req, res, next) => {
  try {
    const { data, errors } = parseRegisterDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    // Verificar que el UID pertenece a un usuario real de Firebase Auth
    await auth.getUser(data.uid);

    // Calcular edad
    const birth = new Date(data.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    const userDoc = {
      uid:          data.uid,
      email:        data.email,
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

    await db.collection('users').doc(data.uid).set(userDoc);

    return res.status(201).json({
      message: 'User registered successfully',
      user: { uid: userDoc.uid, username: userDoc.username, isUnder16: userDoc.isUnder16 },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Valida el idToken del cliente y devuelve datos básicos del perfil.
 */
const login = async (req, res, next) => {
  try {
    const { data, errors } = parseLoginDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const decoded  = await auth.verifyIdToken(data.idToken);
    const userSnap = await db.collection('users').doc(decoded.uid).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User profile not found. Complete registration first.' });
    }

    const u = userSnap.data();
    return res.status(200).json({
      message: 'Login successful',
      user: { uid: u.uid, username: u.username, email: u.email, isUnder16: u.isUnder16 },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
