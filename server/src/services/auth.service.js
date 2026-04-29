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
    { uid, email: data.email, username: userDoc.username },
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
    { uid: u.uid, email: u.email, username: u.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: { uid: u.uid, username: u.username, email: u.email, isUnder16: u.isUnder16 },
    idToken,
  };
};

module.exports = { register, login };
