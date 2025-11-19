export interface Product {
    id: string;
    name: string;
    retailPrice: number;
    costPrice: number;
    quantity: number;
    description: string | null;
    category: string;
    updatedAt: string;
    createdAt: string;
}