import { Button, Image, Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthEmail, getAuthRole } from "../utils/auth";
import Logo from "../images/logo.png";

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const adminMenuItems: MenuItem[] = [
  {
    key: "/admin/dashboard",
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: "/admin/bookings",
    label: <Link to="/admin/bookings">Bookings</Link>,
  },
  {
    key: "/admin/payments",
    label: <Link to="/admin/payments">Payments</Link>,
  },
  {
    key: "/admin/vouchers",
    label: <Link to="/admin/vouchers">Vouchers</Link>,
  },
  {
    key: "/admin/studios",
    label: <Link to="/admin/studios">Studios</Link>,
  },
  {
    key: "/admin/packages",
    label: <Link to="/admin/packages">Packages</Link>,
  },
  {
    key: "/admin/addons",
    label: <Link to="/admin/addons">Add-ons</Link>,
  },
];

const cashierMenuItems: MenuItem[] = adminMenuItems.filter((item) =>
  ["/admin/dashboard", "/admin/bookings", "/admin/payments"].includes(
    item?.key?.toString() ?? "",
  ),
);

// Main admin shell with sidebar navigation and logout action.
const AdminLayout = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = getAuthEmail();
  const role = getAuthRole();
  const menuItems = role === "cashier" ? cashierMenuItems : adminMenuItems;

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onLogout = (): void => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <Layout className="h-screen overflow-hidden bg-brand-yellow/20">
      <Sider
        theme="light"
        width={280}
        breakpoint="lg"
        collapsedWidth="0"
        className="h-screen overflow-y-auto border-r-4 border-brand-black"
      >
        <div className="mb-4 border-b-4 border-brand-black px-3 py-2">
          <div className="mb-2 border-2 border-brand-black bg-brand-yellow px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-brand-black shadow-[4px_4px_0_#000]">
            Equinox Admin
          </div>
          <div className="flex items-center justify-center">
            <Image
              preview={false}
              src={Logo}
              width={150}
              alt="Logo"
              className="inline-block "
            />
          </div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
        />
      </Sider>

      <Layout className="h-screen overflow-hidden bg-brand-yellow/20">
        <Header
          style={{
            background: "#ff2273",
            borderBottom: "4px solid #000000",
          }}
          className="flex h-16 items-center justify-between px-4 md:px-6"
        >
          <span className="font-bold text-brand-white">
            Signed in as {email}
          </span>
          <Button
            type="primary"
            danger
            onClick={onLogout}
            className="!border-none"
          >
            Logout
          </Button>
        </Header>

        <Content className="m-4 overflow-hidden md:m-6">
          <div
            style={{
              background: `${colorBgContainer}`,
              borderRadius: borderRadiusLG,
              border: "3px solid #000000",
            }}
            className="h-[calc(100vh-6.5rem)] overflow-y-auto bg-white p-5 shadow-[8px_8px_0_#000] md:p-8"
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
