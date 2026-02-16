import { Button, Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthEmail } from "../utils/auth";

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
    <Layout className="h-screen overflow-hidden bg-slate-100">
      <Sider
        theme="light"
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        className="h-screen overflow-y-auto border-r border-slate-200 bg-white"
      >
        <div className="px-4 py-5 text-lg font-bold text-slate-800">
          Admin Panel
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
        />
      </Sider>

      <Layout className="h-screen overflow-hidden bg-slate-100">
        <Header
          style={{
            background: colorBgContainer,
            borderBottom: "1px solid #e2e8f0",
          }}
          className="flex h-16 items-center justify-between px-4 md:px-6"
        >
          <span className="font-medium text-slate-700">
            Signed in as {email}
          </span>
          <Button type="primary" danger onClick={onLogout}>
            Logout
          </Button>
        </Header>

        <Content className="m-4 overflow-hidden md:m-6">
          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
            className="h-[calc(100vh-6.5rem)] overflow-y-auto p-5 md:p-8"
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
