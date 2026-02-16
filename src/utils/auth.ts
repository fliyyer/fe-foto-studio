export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_TOKEN_TYPE_KEY = 'auth_token_type';
export const AUTH_EMAIL_KEY = 'auth_email';

// Helpers keep localStorage access centralized and typed.
export const getAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);
export const getAuthTokenType = (): string => localStorage.getItem(AUTH_TOKEN_TYPE_KEY) ?? 'Bearer';

export const getAuthEmail = (): string => localStorage.getItem(AUTH_EMAIL_KEY) ?? 'User';

export const getAuthHeader = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;

  // Backward-compatible: if token already contains scheme, use it directly.
  if (token.includes(' ')) return token;

  const tokenType = getAuthTokenType();
  return `${tokenType} ${token}`;
};

export const setAuthSession = (token: string, email: string, tokenType = 'Bearer'): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_TOKEN_TYPE_KEY, tokenType);
  localStorage.setItem(AUTH_EMAIL_KEY, email);
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_TYPE_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
};
