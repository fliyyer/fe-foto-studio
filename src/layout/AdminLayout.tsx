import { Button, Image, Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthEmail } from "../utils/auth";
import Logo from "../images/logo.png";

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
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

// Main admin shell with sidebar navigation and logout action.
const AdminLayout = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = getAuthEmail();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const onLogout = (): void => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <Layout className="h-screen overflow-hidden bg-brand-teal/5">
      <Sider
        theme="light"
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        className="h-screen overflow-y-auto border-r border-brand-black/10 bg-gradient-to-b from-white to-brand-teal/10"
      >
        <div className="mb-4 border-b border-brand-black/10 px-3 py-2">
          <div className="mb-2 rounded-xl bg-brand-yellow/80 px-2 py-1 text-center text-xs font-bold uppercase tracking-wide text-brand-black">
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

      <Layout className="h-screen overflow-hidden bg-brand-teal/5">
        <Header
          style={{
            background:
              "linear-gradient(90deg, rgba(0,191,195,0.16) 0%, rgba(255,211,59,0.26) 60%, rgba(255,34,115,0.14) 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
          className="flex h-16 items-center justify-between px-4 md:px-6"
        >
          <span className="font-medium text-brand-black/80">
            Signed in as {email}
          </span>
          <Button type="primary" danger onClick={onLogout} className="!border-none">
            Logout
          </Button>
        </Header>

        <Content className="m-4 overflow-hidden md:m-6">
          <div
            style={{
              background: `${colorBgContainer}`,
              borderRadius: borderRadiusLG,
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
            className="h-[calc(100vh-6.5rem)] overflow-y-auto bg-white/95 p-5 md:p-8"
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
