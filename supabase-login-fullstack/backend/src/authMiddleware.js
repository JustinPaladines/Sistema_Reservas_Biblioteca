const { supabaseAuth } = require('./supabaseClients');

async function verificarSupabaseToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;

  if (!token) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ mensaje: 'Token inválido', detalle: error?.message });
  }

  req.usuario = data.user;
  next();
}

module.exports = verificarSupabaseToken;
