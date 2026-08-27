// src/api/user.ts
import axios from "./axiosInstance";
import {User} from "../types/user";

export async function getMe() {
    return axios.get<User>('/users/me/');
}

export async function getUser(userId: string) {
    return axios.get<User>(`/users/${userId}/`);
}
