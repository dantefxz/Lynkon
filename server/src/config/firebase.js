const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { createMockFirestore } = require('./firestore-mock');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    console.log('[OK] Firebase: config cargada desde env');
  } catch (err) {
    console.error('[ERROR] Error al parsear FIREBASE_SERVICE_ACCOUNT:', err.message);
  }
}

if (!serviceAccount) {
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('[OK] Firebase: serviceAccountKey.json cargado desde archivo');
    } catch (err) {
      console.error('[ERROR] Error al parsear serviceAccountKey.json:', err.message);
    }
  }
}

if (!serviceAccount) {
  console.error('[ERROR] No se encontraron credenciales de Firebase (ni archivo ni variable).');
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
}

if (!admin.apps.length && serviceAccount) {
  try {
    console.log('[INFO] Inicializando Firebase Admin SDK...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[OK] Firebase Admin SDK inicializado correctamente');
  } catch (err) {
    console.error('[ERROR] Error al inicializar Firebase Admin SDK:', err.message);
    process.exit(1);
  }
}

let auth, db;

try {
  auth = admin.auth();
  console.log('[OK] Firebase Auth inicializado');
} catch (err) {
  console.error('[ERROR] Error inicializando Auth:', err.message);
}

try {
  db = admin.firestore();
  console.log('[OK] Firestore inicializado');
} catch (err) {
  if (process.env.NODE_ENV === 'development' || !serviceAccount) {
    console.warn('[WARN] Firestore no disponible. Usando mock en memoria.');
    db = createMockFirestore();
  } else {
    console.error('[ERROR] Fallo crítico en Firestore:', err.message);
  }
}

module.exports = { admin, db, auth };
