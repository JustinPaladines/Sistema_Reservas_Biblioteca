import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import "../styles/perfil.css";

export default function ChatIA() {
  const navigate = useNavigate();

  return (
    <div className="perfil-pagina-container" style={{ padding: "30px", display: "block", minHeight: "auto" }}>
      
      <div className="top-bar ">
        <button onClick={() => navigate("/estudiante/dashboard")}>
          Regresar
        </button>
      </div>


      <ChatBox />

    </div>
  );
}