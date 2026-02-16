import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Users from './pages/Users';
import { getAuthToken } from './utils/auth';

// Route tree:
// - /login is public
// - /admin/* is protected and wrapped by ProtectedRoute
// - unknown paths redirect based on auth state
const App = (): JSX.Element => {
  const token = getAuthToken();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? '/admin/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
};

export default App;
