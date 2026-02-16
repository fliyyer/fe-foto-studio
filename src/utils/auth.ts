export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_EMAIL_KEY = 'auth_email';

// Helpers keep localStorage access centralized and typed.
export const getAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

export const getAuthEmail = (): string => localStorage.getItem(AUTH_EMAIL_KEY) ?? 'User';

export const setAuthSession = (token: string, email: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_EMAIL_KEY, email);
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
};
