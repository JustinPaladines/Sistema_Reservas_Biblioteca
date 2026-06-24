// src/components/Login.jsx
import LoginCard from "./LoginCard";
import Buhoimg from "./Buhoimg";
import "../styles/login.css"; 

function Login() {
  return (
    <div className="login-page-container">
      
      
      <div className="login-left" style={{ backgroundColor: "#F8FAFC" }}>
        <LoginCard />
      </div>
      
      <div className="login-right" style={{ backgroundColor: "#FFFFFF" }}>
        <Buhoimg />
      </div>

    </div>
  );
}

export default Login;