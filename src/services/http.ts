import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

// Central axios instance. Base URL targets your Laravel API host.
export const http = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Automatically attach auth header for every request when token exists.
http.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();

  if (authHeader) {
    config.headers.Authorization = authHeader;
  }

  return config;
});
