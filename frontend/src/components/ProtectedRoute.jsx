import {Navigate, Outlet} from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) =>{
    const user = {
        isAuthenticated: true,
        rol: "bibliotecario"
    };
     if(!user.isAuthenticated){
        // si no esta logueado, se envía al login
        return<Navigate to="/login" replace />;
     }
     if(!allowedRoles.includes(user.rol)){
        //si esta logueado, pero intent ingresar a un rol que no le pertenece
        return <Navigate to="/unauthorized" replace />;
     }

     return <Outlet/>;
};

export default ProtectedRoute;