import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layout/AdminLayout";
import Addons from "./pages/Addons";
import Bookings from "./pages/Bookings";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import OrderCheckout from "./pages/OrderCheckout";
import OrderPackageDetail from "./pages/OrderPackageDetail";
import OrderPackageSelection from "./pages/OrderPackageSelection";
import OrderStudioSelection from "./pages/OrderStudioSelection";
import Payments from "./pages/Payments";
import Packages from "./pages/Packages";
import Vouchers from "./pages/Vouchers";
import { getAuthToken } from "./utils/auth";
import Studios from "./pages/Studios";

const APP_NAME = "Equinox Self Studio";

const resolvePageTitle = (pathname: string): string => {
  if (pathname === "/" || pathname === "/order") return "Pilih Studio";
  if (pathname === "/order/packages") return "Pilih Paket";
  if (/^\/order\/studios\/\d+\/packages\/\d+$/.test(pathname)) {
    return "Detail Paket";
  }
  if (/^\/order\/studios\/\d+\/packages\/\d+\/checkout$/.test(pathname)) {
    return "Checkout";
  }
  if (pathname === "/login") return "Login Admin";
  if (pathname === "/admin/dashboard") return "Dashboard";
  if (pathname === "/admin/bookings") return "Bookings";
  if (pathname === "/admin/payments") return "Payments";
  if (pathname === "/admin/vouchers") return "Vouchers";
  if (pathname === "/admin/studios") return "Studios";
  if (pathname === "/admin/packages") return "Packages";
  if (pathname === "/admin/addons") return "Add-ons";

  return "Admin Panel";
};

// Route tree:
// - /login is public
// - /admin/* is protected and wrapped by ProtectedRoute
// - unknown paths redirect based on auth state
const App = (): JSX.Element => {
  const token = getAuthToken();
  const location = useLocation();

  useEffect(() => {
    const pageTitle = resolvePageTitle(location.pathname);
    document.title = `${pageTitle} | ${APP_NAME}`;
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<OrderStudioSelection />} />
      <Route path="/order" element={<OrderStudioSelection />} />
      <Route path="/order/packages" element={<OrderPackageSelection />} />
      <Route
        path="/order/studios/:studioId/packages/:packageId"
        element={<OrderPackageDetail />}
      />
      <Route
        path="/order/studios/:studioId/packages/:packageId/checkout"
        element={<OrderCheckout />}
      />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="studios" element={<Studios />} />
          <Route path="packages" element={<Packages />} />
          <Route path="addons" element={<Addons />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? "/admin/dashboard" : "/"} replace />}
      />
    </Routes>
  );
};

export default App;
