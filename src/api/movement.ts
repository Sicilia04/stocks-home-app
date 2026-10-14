import axios from "./axiosInstance";
import {StockMovement, StockMovementWriteInput} from "../types/movement";

export async function listMovements() {
    return axios.get<StockMovement[]>('/stock/movements/');
}

export async function getMovement(movementId: number) {
    return axios.get<StockMovement>(`/stock/movements/${movementId}/`);
}

export async function createMovement(payload: StockMovementWriteInput) {
    return axios.post<StockMovement>('/stock/movements/', payload);
}
