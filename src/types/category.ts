export interface Category {
    id: number;
    name: string;
    slug: string | null;
}

export interface CategoryWriteInput {
    name: string;
}
