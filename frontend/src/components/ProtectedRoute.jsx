import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const ProtectedRoute = ({ allowedRoles }) => {
const [loading, setLoading] = useState(true);
const [userRole, setUserRole] = useState(null);
const [authenticated, setAuthenticated] = useState(false);

   useEffect(() => {
      const verificarUsuario = async () => {
         const {
         data: { user },
         } = await supabase.auth.getUser();

         if (!user) {
         setAuthenticated(false);
         setLoading(false);
         return;
         }

         setAuthenticated(true);

         const { data, error } = await supabase
         .from("usuarios")
         .select("rol")
         .eq("id", user.id)
         .single();

         if (!error && data) {
         setUserRole(data.rol);
         }

         setLoading(false);
      };

      verificarUsuario();
   }, []);

   if (loading) {
      return <p>Cargando...</p>;
   }

   if (!authenticated) {
      return <Navigate to="/login" replace />;
   }

   if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
   }

   return <Outlet />;
   };

export default ProtectedRoute;