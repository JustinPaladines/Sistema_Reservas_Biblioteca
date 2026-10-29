import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  // obtener datos almacenados después del login
   const token = localStorage.getItem("token");
   const userString = localStorage.getItem("user");

   // si no hay token o usuario volver al login
   if (!token || !userString) {
      return <Navigate to="/login" replace />;
   }

   let user;

   try {
      user = JSON.parse(userString);
   } catch (error) {
      // Si el JSON está corrupto, limpiar almacenamiento
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return <Navigate to="/login" replace />;
   }

   // verificar que el usuario tenga rol
   if (!user?.rol) {
      return <Navigate to="/login" replace />;
   }

   // verificar permisos
   if (!allowedRoles.includes(user.rol)) {
      return <Navigate to="/unauthorized" replace />;
   }

   // todo correcto
   return <Outlet />;
};

export default ProtectedRoute;