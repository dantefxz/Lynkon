/**
 * Script para crear un usuario de prueba en Firebase y obtener su idToken
 * Uso: node create-test-user.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();

async function createTestUser() {
  try {
    const email = 'test@lynkon.dev';
    const password = 'Test123456';

    // Crear usuario
    const userRecord = await auth.createUser({
      email,
      password,
    });

    console.log('\n✅ Usuario creado exitosamente');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log(`👤 UID: ${userRecord.uid}`);

    // Generar idToken (válido por 1 hora)
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log(`\n🎫 Custom Token:\n${customToken}`);

    console.log('\n💡 Para obtener el idToken real, usa este custom token en el cliente Firebase.');
    console.log('📌 O usa directamente este endpoint para login (después de registrarte en la app):\n');
    console.log('POST http://localhost:3000/api/auth/login');
    console.log('Body: { "idToken": "<idToken de la app cliente>" }\n');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️  El usuario test@lynkon.dev ya existe');
      console.log('Usa las credenciales anteriores para testear\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  process.exit(0);
}

createTestUser();
