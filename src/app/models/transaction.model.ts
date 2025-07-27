
export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: Date;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reference: string;
  notes: string;
}

export interface Sale {
  id: string;
  date: Date;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Purchase {
  id: string;
  date: Date;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  reference: string;
  notes: string;
}

export interface PurchaseItem {
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number;
  totalPrice: number;
}
