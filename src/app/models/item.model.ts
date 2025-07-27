export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}