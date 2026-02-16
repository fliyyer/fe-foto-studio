import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

// Route guard for /admin/* paths.
const ProtectedRoute = (): JSX.Element => {
  const location = useLocation();
  const token = getAuthToken();

  if (!token) {
    // Preserve attempted path for potential future use.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
