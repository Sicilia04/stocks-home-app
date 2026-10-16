export interface Product {
    id: number;
    name: string;
    barcode: string;
    category: number;
    category_name: string;
    quantity: number;
    min_quantity: number;
    is_active: boolean;
    is_low_stock: boolean;
}

export interface ProductWriteInput {
    name: string;
    barcode: string;
    // The API expects the key "category_id" on input (ninja exposes FKs by
    // their attname); on output the field is named "category".
    category_id: number;
    min_quantity: number;
    is_active: boolean;
}
