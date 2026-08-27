// src/api/axiosInstance.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {API_BASE} from "../config/env";

const TOKEN_KEY = 'userToken';

// Création d'une instance Axios
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajoute automatiquement le token JWT à chaque requête si présent
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

// Gestion des 401 : on notifie un handler externe (le AuthContext) pour purger la session
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
