export type MovementKind = 'in' | 'out';

export interface StockMovementWriteInput {
    // The API expects the key "product_id" on input (ninja exposes FKs by
    // their attname); on output the field is named "product".
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
