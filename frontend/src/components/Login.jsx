import { useState } from "react";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const manejarSubmit = (e) => {
    e.preventDefault();
    console.log("Correo:", correo);
    console.log("Password:", password);
  };

  return (
    <form onSubmit={manejarSubmit}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Ingresar</button>
    </form>
  );
}

export default Login;