import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || (isAdmin ? "/dashboard" : "/products");

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default PublicOnlyRoute;
