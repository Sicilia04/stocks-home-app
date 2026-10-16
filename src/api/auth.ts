// src/api/auth.ts
import axios from "./axiosInstance";

export async function getToken(username: string, password: string) {
  // Returns the JWT token
  return axios.post("/token/pair", { username, password });
}