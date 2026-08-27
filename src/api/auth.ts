// src/api/auth.ts
import axios from "./axiosInstance";

export async function getToken(username: string, password: string) {
  // Retourne le token JWT
  return axios.post("/token/pair", { username, password });
}