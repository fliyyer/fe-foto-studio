import { Navigate, useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography, message } from "antd";
import axios from "axios";
import type { LoginValues } from "../types/auth";
import { getAuthToken, setAuthSession } from "../utils/auth";
import { loginRequest } from "../services/auth.service";

const { Title, Text } = Typography;

// Login page with antd validation and mock auth flow.
const Login = (): JSX.Element => {
  const navigate = useNavigate();
  const token = getAuthToken();

  // Keep authenticated users out of the login page.
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onFinish = async (values: LoginValues): Promise<void> => {
    try {
      // Real API login call using axios to your endpoint.
      const tokenFromApi = await loginRequest(values);
      setAuthSession(tokenFromApi, values.email);
      message.success("Login berhasil.");
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage =
          (error.response?.data as { message?: string } | undefined)?.message ??
          "Login gagal. Periksa email/password.";
        message.error(apiMessage);
        return;
      }

      message.error(
        (error as Error).message || "Terjadi kesalahan saat login.",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e6ffff_0%,#ffffff_60%)] px-4">
      <Card className="w-full max-w-md shadow-lg">
        <Title level={3} className="!mb-1 !text-brand-black">
          Welcome Back
        </Title>
        <Text className="!mb-6 block !text-brand-black/70">
          Sign in to access the admin panel.
        </Text>

        <Form<LoginValues>
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input placeholder="admin@example.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item className="!mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              className="!h-10 !font-semibold"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
