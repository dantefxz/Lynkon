const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { createMockFirestore } = require('./firestore-mock');

// Cargar serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('[ERROR] serviceAccountKey.json no encontrado en', serviceAccountPath);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log('[OK] serviceAccountKey.json cargado');
  console.log(`[INFO] Proyecto: ${serviceAccount.project_id}`);
} catch (err) {
  console.error('[ERROR] Error al parsear serviceAccountKey.json:', err.message);
  process.exit(1);
}

if (!admin.apps.length) {
  try {
    const config = {
      credential: admin.credential.cert(serviceAccount),
    };
    console.log('[INFO] Inicializando Firebase Admin SDK...');
    
    admin.initializeApp(config);
    console.log('[OK] Firebase Admin SDK inicializado correctamente');
  } catch (err) {
    console.error('[ERROR] Error al inicializar Firebase Admin SDK:', err.message);
    console.error('[STACK]', err.stack);
    process.exit(1);
  }
}

// Obtener referencias de Auth y Firestore
let auth, db;

try {
  auth = admin.auth();
  console.log('[OK] Firebase Auth inicializado');
} catch (err) {
  console.error('[ERROR] Error inicializando Auth:', err.message);
  process.exit(1);
}

try {
  db = admin.firestore();
  console.log('[OK] Firestore inicializado');
} catch (err) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[WARN] Firestore no disponible. Usando mock en memoria.');
    db = createMockFirestore();
  } else {
    throw err;
  }
}

module.exports = { admin, db, auth };
