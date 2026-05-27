const { db, auth } = require('../config/firebase');
const { generateUsername } = require('../utils/username.utils');
const jwt  = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'lynkon-dev-secret-key-2026';

const register = async (data) => {
  let userRecord;
  try {
    userRecord = await auth.createUser({ email: data.email, password: data.password });
  } catch (err) {
    if (err.code === 'auth/email-already-exists')
      throw Object.assign(new Error('Email already registered'), { status: 409 });
    throw err;
  }

  const uid   = userRecord.uid;
  const birth = new Date(data.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  const userDoc = {
    uid,
    email:         data.email,
    username:      data.username || generateUsername(),
    birthDate:     data.birthDate,
    age,
    isUnder16:     age < 16,
    authProvider:  data.authProvider,
    bio:           '',
    avatarId:      null,
    favoriteGames:        [],
    featuredAchievements: [],
    skillTags:            {},
    platforms:     [],
    friends:       [],
    createdAt:     new Date().toISOString(),
  };

  await db.collection('users').doc(uid).set(userDoc);

  const idToken = jwt.sign(
    { uid, email: data.email, username: userDoc.username, isUnder16: userDoc.isUnder16 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: { uid, username: userDoc.username, email: userDoc.email, isUnder16: userDoc.isUnder16 },
    idToken,
  };
};

const login = async (email, password) => {
  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
  if (!FIREBASE_API_KEY)
    throw Object.assign(new Error('Server misconfiguration: missing FIREBASE_API_KEY'), { status: 500 });

  let firebaseUser;
  try {
    const firebaseRes = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true }
    );
    firebaseUser = firebaseRes.data;
  } catch (err) {
    const code = err.response?.data?.error?.message;
    if (['INVALID_PASSWORD', 'EMAIL_NOT_FOUND', 'INVALID_LOGIN_CREDENTIALS', 'USER_DISABLED'].includes(code))
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    throw err;
  }

  const userSnap = await db.collection('users').doc(firebaseUser.localId).get();
  if (!userSnap.exists)
    throw Object.assign(new Error('User profile not found. Complete registration first.'), { status: 404 });

  const u = userSnap.data();
  const idToken = jwt.sign(
    { uid: u.uid, email: u.email, username: u.username, isUnder16: u.isUnder16 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: { uid: u.uid, username: u.username, email: u.email, isUnder16: u.isUnder16 },
    idToken,
  };
};

module.exports = { register, login };

const forgotPassword = async (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@'))
    throw Object.assign(new Error('A valid email is required'), { status: 400 });

  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
  if (!FIREBASE_API_KEY)
    throw Object.assign(new Error('Server misconfiguration: missing FIREBASE_API_KEY'), { status: 500 });

  // Verificamos que el email exista en nuestra DB antes de llamar a Firebase
  const snap = await db.collection('users').where('email', '==', email.trim().toLowerCase()).limit(1).get();
  if (snap.empty)
    // Por seguridad respondemos igual si el email no existe (evitar user enumeration)
    return { message: 'If that email exists, a reset link has been sent.' };

  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      { requestType: 'PASSWORD_RESET', email: email.trim().toLowerCase() }
    );
  } catch (err) {
    const code = err.response?.data?.error?.message;
    if (code === 'EMAIL_NOT_FOUND') {
      // Silencioso por seguridad
      return { message: 'If that email exists, a reset link has been sent.' };
    }
    throw err;
  }

  return { message: 'If that email exists, a reset link has been sent.' };
};

const resetPassword = async (oobCode, newPassword) => {
  if (!oobCode)      throw Object.assign(new Error('oobCode is required'), { status: 400 });
  if (!newPassword)  throw Object.assign(new Error('newPassword is required'), { status: 400 });

  const letterCount = (newPassword.match(/[a-zA-Z]/g) || []).length;
  const numberCount = (newPassword.match(/[0-9]/g) || []).length;
  const errors = [];
  if (letterCount < 6) errors.push('password must contain at least 6 letters');
  if (numberCount < 2) errors.push('password must contain at least 2 numbers');
  if (newPassword.length < 8) errors.push('password must be at least 8 characters');
  if (errors.length) throw Object.assign(new Error(errors.join(', ')), { status: 400 });

  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
  if (!FIREBASE_API_KEY)
    throw Object.assign(new Error('Server misconfiguration: missing FIREBASE_API_KEY'), { status: 500 });

  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`,
      { oobCode, newPassword }
    );
  } catch (err) {
    const code = err.response?.data?.error?.message;
    if (['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE'].includes(code))
      throw Object.assign(new Error('Reset code is invalid or has expired'), { status: 400 });
    throw err;
  }

  return { message: 'Password updated successfully' };
};

module.exports = { register, login, forgotPassword, resetPassword };
