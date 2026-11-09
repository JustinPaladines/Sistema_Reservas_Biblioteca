// src/pages/VistaModulo.jsx
//es un archivo temporal, agregado simplemente para inidcar la funcion y las rutas protegidas de los perfiles
import { useParams, useNavigate } from 'react-router-dom';

const VistaModulo = () => {
  const { nombreModulo } = useParams(); // Captura el nombre desde la URL
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h2>hola estas es el dashboard de {nombreModulo}</h2>
      <br />
      <button 
        onClick={() => navigate(-1)} 
        style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        Volver al Dashboard
      </button>
    </div>
  );
};

export default VistaModulo;