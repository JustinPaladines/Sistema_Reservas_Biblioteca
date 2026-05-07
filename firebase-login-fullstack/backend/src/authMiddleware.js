const { admin } = require('./firebaseAdmin');

async function verificarFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;

    if (!token) {
      return res.status(401).json({ mensaje: 'Token requerido' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido', detalle: error.message });
  }
}

module.exports = verificarFirebaseToken;
