import { http } from './http';

export interface LoginRequest {
  email: string;
  password: string;
}

interface LoginApiResponse {
  token?: string;
  access_token?: string;
  data?: {
    token?: string;
    access_token?: string;
  };
  message?: string;
}

// Login call to POST /auth/login
export const loginRequest = async (payload: LoginRequest): Promise<string> => {
  const { data } = await http.post<LoginApiResponse>('/auth/login', payload);

  // Support common response shapes from different backend implementations.
  const token = data.token ?? data.access_token ?? data.data?.token ?? data.data?.access_token;

  if (!token) {
    throw new Error('Login response does not include a token.');
  }

  return token;
};
