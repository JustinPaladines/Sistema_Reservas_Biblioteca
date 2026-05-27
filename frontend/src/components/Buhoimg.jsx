// src/components/Buhoimg.jsx
import LoginBuho from "../assets/buho_oficial.png";
import "../styles/buhoimg.css"; 

export default function Buhoimg() {
  return (
    <img
      src={LoginBuho}
      alt="Buho"
      className="buho-imagen" //clase de nuestro .css
    />
  );
}