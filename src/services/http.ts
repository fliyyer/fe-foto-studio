import axios from "axios";
import { getAuthHeader } from "../utils/auth";

const defaultApiBaseUrl = "http://127.0.0.1:8000/api";

// Central API config. Can be overridden using VITE_API_BASE_URL.
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  defaultApiBaseUrl;

// API origin derived from base url, used to resolve relative asset paths.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveApiAssetUrl = (path: string | null): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Laravel local disk absolute path:
  // /home/.../storage/app/public/studios/file.jpg -> /storage/studios/file.jpg
  const normalizedPath = path.replace(/\\/g, "/");
  const marker = "/storage/app/public/";
  const markerIndex = normalizedPath.indexOf(marker);
  if (markerIndex !== -1) {
    const relativeFile = normalizedPath.slice(markerIndex + marker.length);
    return `${API_ORIGIN}/storage/${relativeFile}`;
  }

  if (normalizedPath.startsWith("public/")) {
    return `${API_ORIGIN}/storage/${normalizedPath.slice("public/".length)}`;
  }

  if (normalizedPath.startsWith("/")) return `${API_ORIGIN}${normalizedPath}`;
  if (normalizedPath.startsWith("storage/"))
    return `${API_ORIGIN}/${normalizedPath}`;
  return `${API_ORIGIN}/storage/${normalizedPath}`;
};

// Central axios instance. Base URL targets your API host.
export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
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
