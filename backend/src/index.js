// punto de entrada del servidor, esucha peticiones

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const verificarSupabaseToken = require('./authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// ruta protegida, Solo si el token es válido, se ejecuta lo de adentro
app.get('/api/usuarios', verificarSupabaseToken, (req, res) => {
    res.json({ 
        mensaje: 'Usuario autenticado correctamente',
        usuario: {
            id: req.usuario.id,
            email: req.usuario.email
    }
});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Servidor de autenticación en puerto ${PORT}`));