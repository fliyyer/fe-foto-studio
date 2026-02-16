import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layout/AdminLayout";
import Addons from "./pages/Addons";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Packages from "./pages/Packages";
import { getAuthToken } from "./utils/auth";
import Studios from "./pages/Studios";

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
          <Route path="bookings" element={<Bookings />} />
          <Route path="studios" element={<Studios />} />
          <Route path="packages" element={<Packages />} />
          <Route path="addons" element={<Addons />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={token ? "/admin/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

export default App;
