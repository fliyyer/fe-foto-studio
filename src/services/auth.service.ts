import { http } from './http';

export interface LoginRequest {
  email: string;
  password: string;
}

interface LoginApiResponse {
  token_type?: string;
  token?: string;
  access_token?: string;
  user?: {
    email?: string;
    role?: string;
  };
  data?: {
    token_type?: string;
    token?: string;
    access_token?: string;
    user?: {
      email?: string;
      role?: string;
    };
  };
  role?: string;
  message?: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: string;
  email?: string;
  role: 'admin' | 'cashier';
}

// Login call to POST /auth/login
export const loginRequest = async (payload: LoginRequest): Promise<LoginResult> => {
  const { data } = await http.post<LoginApiResponse>('/auth/login', payload);

  // Support common response shapes from different backend implementations.
  const accessToken = data.token ?? data.access_token ?? data.data?.token ?? data.data?.access_token;
  const tokenType = data.token_type ?? data.data?.token_type ?? 'Bearer';
  const email = data.user?.email ?? data.data?.user?.email;
  const role = data.user?.role ?? data.data?.user?.role ?? data.role ?? 'admin';

  if (!accessToken) {
    throw new Error('Login response does not include a token.');
  }

  return {
    accessToken,
    tokenType,
    email,
    role: role === 'cashier' ? 'cashier' : 'admin',
  };
};
