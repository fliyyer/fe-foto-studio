import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { AuthRole } from '../utils/auth';
import { getAuthRole, getAuthToken } from '../utils/auth';

interface ProtectedRouteProps {
  allowedRoles?: AuthRole[];
}

// Route guard for /admin/* paths.
const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps): JSX.Element => {
  const location = useLocation();
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token) {
    // Preserve attempted path for potential future use.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
