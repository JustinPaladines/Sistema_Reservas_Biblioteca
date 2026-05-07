require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabaseAdmin } = require('./supabaseClients');
const verificarSupabaseToken = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ mensaje: 'API Supabase funcionando' }));

app.get('/api/perfil', verificarSupabaseToken, (req, res) => {
  res.json({ id: req.usuario.id, email: req.usuario.email });
});

app.get('/api/productos', verificarSupabaseToken, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('productos')
    .select('*')
    .eq('user_id', req.usuario.id)
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ mensaje: 'Error al listar productos', detalle: error.message });
  res.json(data);
});

app.post('/api/productos', verificarSupabaseToken, async (req, res) => {
  const { nombre, categoria, precio, stock } = req.body;

  if (!nombre || !categoria || precio === undefined || stock === undefined) {
    return res.status(400).json({ mensaje: 'Nombre, categoría, precio y stock son obligatorios' });
  }

  const nuevo = {
    nombre,
    categoria,
    precio: Number(precio),
    stock: Number(stock),
    user_id: req.usuario.id,
    email_usuario: req.usuario.email,
  };

  const { data, error } = await supabaseAdmin
    .from('productos')
    .insert([nuevo])
    .select()
    .single();

  if (error) return res.status(500).json({ mensaje: 'Error al crear producto', detalle: error.message });
  res.status(201).json(data);
});

app.put('/api/productos/:id', verificarSupabaseToken, async (req, res) => {
  const cambios = { ...req.body, actualizado_en: new Date().toISOString() };
  if (cambios.precio !== undefined) cambios.precio = Number(cambios.precio);
  if (cambios.stock !== undefined) cambios.stock = Number(cambios.stock);
  delete cambios.user_id;
  delete cambios.email_usuario;

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update(cambios)
    .eq('id', req.params.id)
    .eq('user_id', req.usuario.id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ mensaje: 'Producto no encontrado o no autorizado', detalle: error?.message });
  res.json(data);
});

app.delete('/api/productos/:id', verificarSupabaseToken, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('productos')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.usuario.id);

  if (error) return res.status(500).json({ mensaje: 'Error al eliminar producto', detalle: error.message });
  res.json({ mensaje: 'Producto eliminado' });
});

app.listen(PORT, () => console.log(`API Supabase en http://localhost:${PORT}`));
