import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { User, ChevronDown, LogOut } from "lucide-react";

export default function UserMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <div className="user-menu">
        <button
            className="user-menu-btn"
            onClick={() => setOpen(!open)}
        >
            <User size={20} />
            <ChevronDown size={16} />
        </button>

        {open && (
            <div className="user-dropdown">
            <button onClick={() => navigate("/perfil")}>
                Mi perfil
            </button>

            <button onClick={handleLogout}>
                <LogOut size={16} />
                Cerrar sesión
            </button>
            </div>
        )}
        </div>
    );
}