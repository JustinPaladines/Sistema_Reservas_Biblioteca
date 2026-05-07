const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.error('No se encontró backend/serviceAccountKey.json o el archivo es inválido.');
  console.error('Descárgalo desde Firebase Console > Project settings > Service accounts.');
  process.exit(1);
}

const db = admin.firestore();

module.exports = { admin, db };
