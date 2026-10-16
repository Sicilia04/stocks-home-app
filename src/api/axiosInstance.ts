// src/api/axiosInstance.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {API_BASE} from "../config/env";

const TOKEN_KEY = 'userToken';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the JWT token to every request if present
axiosInstance.interceptors.request.use(
    async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 handling: notify an external handler (the AuthContext) to purge the session
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
