
import { Injectable } from '@angular/core';
import { Item } from '../models/item.model';
import { Transaction, Sale, Purchase } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ITEMS_KEY = 'inventory_items';
  private readonly TRANSACTIONS_KEY = 'inventory_transactions';
  private readonly SALES_KEY = 'inventory_sales';
  private readonly PURCHASES_KEY = 'inventory_purchases';

  constructor() {
    // Initialize storage if empty
    if (!localStorage.getItem(this.ITEMS_KEY)) {
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.TRANSACTIONS_KEY)) {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.SALES_KEY)) {
      localStorage.setItem(this.SALES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.PURCHASES_KEY)) {
      localStorage.setItem(this.PURCHASES_KEY, JSON.stringify([]));
    }
  }

  // Item methods
  getItems(): Item[] {
    return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
  }

  getItemById(id: string): Item | undefined {
    const items = this.getItems();
    return items.find(item => item.id === id);
  }

  saveItem(item: Item): void {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      items[existingIndex] = { ...item, updatedAt: new Date() };
    } else {
      // Add new item
      items.push({ ...item, createdAt: new Date(), updatedAt: new Date() });
    }
    
    localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
  }

  deleteItem(id: string): void {
    const items = this.getItems().filter(item => item.id !== id);
    localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
  }

  updateItemQuantity(itemId: string, quantityChange: number): boolean {
    const items = this.getItems();
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false;
    }
    
    const newQuantity = items[itemIndex].quantity + quantityChange;
    
    // Prevent negative inventory (unless it's an adjustment)
    if (newQuantity < 0) {
      return false;
    }
    
    items[itemIndex].quantity = newQuantity;
    items[itemIndex].updatedAt = new Date();
    
    localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
    return true;
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return JSON.parse(localStorage.getItem(this.TRANSACTIONS_KEY) || '[]');
  }

  saveTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
  }

  // Sales methods
  getSales(): Sale[] {
    return JSON.parse(localStorage.getItem(this.SALES_KEY) || '[]');
  }

  getSaleById(id: string): Sale | undefined {
    const sales = this.getSales();
    return sales.find(sale => sale.id === id);
  }

  saveSale(sale: Sale): void {
    const sales = this.getSales();
    sales.push(sale);
    localStorage.setItem(this.SALES_KEY, JSON.stringify(sales));
  }

  // Purchase methods
  getPurchases(): Purchase[] {
    return JSON.parse(localStorage.getItem(this.PURCHASES_KEY) || '[]');
  }

  getPurchaseById(id: string): Purchase | undefined {
    const purchases = this.getPurchases();
    return purchases.find(purchase => purchase.id === id);
  }

  savePurchase(purchase: Purchase): void {
    const purchases = this.getPurchases();
    purchases.push(purchase);
    localStorage.setItem(this.PURCHASES_KEY, JSON.stringify(purchases));
  }

  // Helper methods
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    localStorage.removeItem(this.ITEMS_KEY);
    localStorage.removeItem(this.TRANSACTIONS_KEY);
    localStorage.removeItem(this.SALES_KEY);
    localStorage.removeItem(this.PURCHASES_KEY);
    
    // Reinitialize empty storage
    localStorage.setItem(this.ITEMS_KEY, JSON.stringify([]));
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify([]));
    localStorage.setItem(this.SALES_KEY, JSON.stringify([]));
    localStorage.setItem(this.PURCHASES_KEY, JSON.stringify([]));
  }
}
