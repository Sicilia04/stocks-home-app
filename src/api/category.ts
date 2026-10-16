// src/api/category.ts
import axios from "./axiosInstance";
import {Category, CategoryWriteInput} from "../types/category";

export async function listCategories() {
    return axios.get<Category[]>('/stock/categories/');
}

export async function getCategory(categoryId: number) {
    return axios.get<Category>(`/stock/categories/${categoryId}/`);
}

export async function createCategory(payload: CategoryWriteInput) {
    return axios.post<Category>('/stock/categories/', payload);
}

export async function updateCategory(categoryId: number, payload: CategoryWriteInput) {
    return axios.patch<Category>(`/stock/categories/${categoryId}/`, payload);
}

export async function deleteCategory(categoryId: number) {
    // django-ninja returns 204 No Content
    return axios.delete(`/stock/categories/${categoryId}/`);
}
