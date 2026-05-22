import ProtectedRoute from "./ProtectedRoute";

function AdminRoute({ children }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}

export default AdminRoute;
