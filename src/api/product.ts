// src/api/product.ts
import axios from "./axiosInstance";
import {Product, ProductWriteInput} from "../types/product";

export async function listProducts() {
    return axios.get<Product[]>('/stock/products/');
}

export async function getProduct(productId: number) {
    return axios.get<Product>(`/stock/products/${productId}/`);
}

export async function createProduct(payload: ProductWriteInput) {
    return axios.post<Product>('/stock/products/', payload);
}

export async function updateProduct(productId: number, payload: ProductWriteInput) {
    return axios.patch<Product>(`/stock/products/${productId}/`, payload);
}

export async function deleteProduct(productId: number) {
    // django-ninja returns 204 No Content
    return axios.delete(`/stock/products/${productId}/`);
}
