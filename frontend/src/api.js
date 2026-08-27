import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api$/, "");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ks_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;