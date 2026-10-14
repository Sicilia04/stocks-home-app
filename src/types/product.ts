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
    // L'API exige la cle "category_id" en entree (ninja expose les FK sous
    // leur attname) ; en sortie le champ s'appelle "category".
    category_id: number;
    min_quantity: number;
    is_active: boolean;
}
