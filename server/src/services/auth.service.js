const { db, auth } = require('../config/firebase');
const { generateUsername } = require('../utils/username.utils');
const jwt  = require('jsonwebtoken');
const axios = require('axios');
const { Resend } = require('resend');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'lynkon-dev-secret-key-2026';

// ─── Register ─────────────────────────────────────────────────────────────────
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

// ─── Login ────────────────────────────────────────────────────────────────────
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

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@'))
    throw Object.assign(new Error('A valid email is required'), { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  const snap = await db.collection('users').where('email', '==', normalizedEmail).limit(1).get();

  // always return the same response to avoid user enumeration
  if (snap.empty)
    return { message: 'If that email exists, a reset code has been sent.' };

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  await db.collection('passwordResetCodes').doc(normalizedEmail).set({
    code,
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Lynkon <onboarding@resend.dev>',
      to: normalizedEmail,
      subject: 'Tu código para restablecer contraseña — Lynkon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: #7c3aed; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LYNKON</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #a78bfa; margin-top: 0;">Restablecer contraseña</h2>
            <p style="color: #9ca3af; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Ingresá el siguiente código en la app:
            </p>
            <div style="background: #1a1a2e; border: 2px solid #7c3aed; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #a78bfa; font-family: monospace;">
                ${code}
              </span>
            </div>
            <p style="color: #6b7280; font-size: 13px;">
              ⏱ Este código expira en <strong style="color: #9ca3af;">15 minutos</strong>.
            </p>
            <p style="color: #6b7280; font-size: 13px;">
              Si no solicitaste esto, podés ignorar este email. Tu contraseña no será cambiada.
            </p>
          </div>
          <div style="background: #1a1a1a; padding: 16px; text-align: center;">
            <p style="color: #4b5563; font-size: 12px; margin: 0;">© 2026 Lynkon. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Error sending reset email:', err.message);
    throw Object.assign(new Error('Could not send reset email. Please try again later.'), { status: 500 });
  }

  return { message: 'If that email exists, a reset code has been sent.' };
};

// ─── Verify Code ──────────────────────────────────────────────────────────────
const verifyResetCode = async (email, code) => {
  if (!email || !code)
    throw Object.assign(new Error('email and code are required'), { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  const doc = await db.collection('passwordResetCodes').doc(normalizedEmail).get();

  if (!doc.exists)
    throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

  const data = doc.data();

  if (data.used)
    throw Object.assign(new Error('This code has already been used'), { status: 400 });

  if (new Date() > new Date(data.expiresAt))
    throw Object.assign(new Error('Code has expired. Request a new one.'), { status: 400 });

  if (data.code !== code.trim())
    throw Object.assign(new Error('Invalid code'), { status: 400 });

  return { message: 'Code verified successfully' };
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (email, code, newPassword) => {
  if (!email)       throw Object.assign(new Error('email is required'), { status: 400 });
  if (!code)        throw Object.assign(new Error('code is required'), { status: 400 });
  if (!newPassword) throw Object.assign(new Error('newPassword is required'), { status: 400 });

  const letterCount = (newPassword.match(/[a-zA-Z]/g) || []).length;
  const numberCount = (newPassword.match(/[0-9]/g) || []).length;
  const errors = [];
  if (letterCount < 6) errors.push('password must contain at least 6 letters');
  if (numberCount < 2) errors.push('password must contain at least 2 numbers');
  if (newPassword.length < 8) errors.push('password must be at least 8 characters');
  if (errors.length) throw Object.assign(new Error(errors.join(', ')), { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  const doc = await db.collection('passwordResetCodes').doc(normalizedEmail).get();

  if (!doc.exists)
    throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

  const data = doc.data();

  if (data.used)
    throw Object.assign(new Error('This code has already been used'), { status: 400 });

  if (new Date() > new Date(data.expiresAt))
    throw Object.assign(new Error('Code has expired. Request a new one.'), { status: 400 });

  if (data.code !== code.trim())
    throw Object.assign(new Error('Invalid code'), { status: 400 });

  const snap = await db.collection('users').where('email', '==', normalizedEmail).limit(1).get();
  if (snap.empty)
    throw Object.assign(new Error('User not found'), { status: 404 });

  const uid = snap.docs[0].data().uid;

  await auth.updateUser(uid, { password: newPassword });
  await db.collection('passwordResetCodes').doc(normalizedEmail).update({ used: true });

  return { message: 'Password updated successfully' };
};

module.exports = { register, login, forgotPassword, verifyResetCode, resetPassword };
