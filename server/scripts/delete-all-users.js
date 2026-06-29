require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { admin, db, auth } = require('../src/config/firebase');

async function deleteAllUsers() {
  console.log('Eliminando usuarios de Firebase Auth...');
  let deleted = 0;
  let nextPageToken;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    const uids = result.users.map(u => u.uid);

    if (uids.length > 0) {
      await auth.deleteUsers(uids);
      deleted += uids.length;
      console.log(`  Eliminados ${deleted} usuarios...`);
    }

    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`✓ ${deleted} usuarios eliminados de Firebase Auth`);

  console.log('Eliminando documentos de Firestore...');
  const snapshot = await db.collection('users').get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`✓ ${snapshot.size} documentos eliminados de Firestore`);

  console.log('Listo.');
  process.exit(0);
}

deleteAllUsers().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
