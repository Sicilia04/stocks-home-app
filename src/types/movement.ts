export type MovementKind = 'in' | 'out';

export interface StockMovementWriteInput {
    // L'API exige la cle "product_id" en entree (ninja expose les FK sous
    // leur attname) ; en sortie le champ s'appelle "product".
    product_id: number;
    kind: MovementKind;
    quantity: number;
}

export interface StockMovement {
    id: number;
    product: number;
    user: number;
    kind: MovementKind;
    quantity: number;
    created: string;
}
