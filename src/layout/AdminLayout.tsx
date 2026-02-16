import { Button, Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthEmail } from '../utils/auth';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/admin/dashboard',
    label: <Link to="/admin/dashboard">Dashboard</Link>,
  },
  {
    key: '/admin/users',
    label: <Link to="/admin/users">Users</Link>,
  },
  {
    key: '/admin/settings',
    label: <Link to="/admin/settings">Settings</Link>,
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
    navigate('/login', { replace: true });
  };

  return (
    <Layout className="min-h-screen">
      <Sider breakpoint="lg" collapsedWidth="0" className="!bg-brand-black">
        <div className="px-4 py-5 text-lg font-bold text-brand-white">Admin Panel</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="!bg-brand-black"
        />
      </Sider>

      <Layout>
        <Header
          style={{ background: colorBgContainer }}
          className="flex items-center justify-between px-4 md:px-6"
        >
          <span className="font-medium text-brand-black">Signed in as {email}</span>
          <Button type="primary" danger onClick={onLogout}>
            Logout
          </Button>
        </Header>

        <Content className="m-4 md:m-6">
          <div
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
            className="min-h-[280px] p-5 md:p-8"
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
