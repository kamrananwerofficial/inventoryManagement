
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction, TransactionType, Sale, SaleItem, Purchase, PurchaseItem } from '../models/transaction.model';
import { StorageService } from './storage.service';
import { ItemService } from './item.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private salesSubject = new BehaviorSubject<Sale[]>([]);
  private purchasesSubject = new BehaviorSubject<Purchase[]>([]);

  public transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();
  public sales$: Observable<Sale[]> = this.salesSubject.asObservable();
  public purchases$: Observable<Purchase[]> = this.purchasesSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private itemService: ItemService
  ) {
    this.loadTransactions();
    this.loadSales();
    this.loadPurchases();
  }

  private loadTransactions(): void {
    const transactions = this.storageService.getTransactions();
    this.transactionsSubject.next(transactions);
  }

  private loadSales(): void {
    const sales = this.storageService.getSales();
    this.salesSubject.next(sales);
  }

  private loadPurchases(): void {
    const purchases = this.storageService.getPurchases();
    this.purchasesSubject.next(purchases);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  getSales(): Observable<Sale[]> {
    return this.sales$;
  }

  getPurchases(): Observable<Purchase[]> {
    return this.purchases$;
  }

  getSaleById(id: string): Sale | undefined {
    return this.storageService.getSaleById(id);
  }

  getPurchaseById(id: string): Purchase | undefined {
    return this.storageService.getPurchaseById(id);
  }

  // Create a new sale
  createSale(sale: Omit<Sale, 'id'>): boolean {
    // Check if we have enough stock for all items
    for (const item of sale.items) {
      const inventoryItem = this.itemService.getItemById(item.itemId);
      if (!inventoryItem || inventoryItem.quantity < item.quantity) {
        return false; // Not enough stock
      }
    }

    // Create the sale record
    const newSale: Sale = {
      ...sale,
      id: this.storageService.generateId()
    };
    
    this.storageService.saveSale(newSale);
    
    // Update inventory quantities and create transaction records
    for (const item of sale.items) {
      // Reduce inventory
      this.itemService.updateItemQuantity(item.itemId, -item.quantity);
      
      // Create transaction record
      const transaction: Transaction = {
        id: this.storageService.generateId(),
        type: TransactionType.SALE,
        date: sale.date,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalPrice,
        reference: sale.reference,
        notes: sale.notes
      };
      
      this.storageService.saveTransaction(transaction);
    }
    
    this.loadTransactions();
    this.loadSales();
    return true;
  }

  // Create a new purchase
  createPurchase(purchase: Omit<Purchase, 'id'>): void {
    // Create the purchase record
    const newPurchase: Purchase = {
      ...purchase,
      id: this.storageService.generateId()
    };
    
    this.storageService.savePurchase(newPurchase);
    
    // Update inventory quantities and create transaction records
    for (const item of purchase.items) {
      // Increase inventory
      this.itemService.updateItemQuantity(item.itemId, item.quantity);
      
      // Create transaction record
      const transaction: Transaction = {
        id: this.storageService.generateId(),
        type: TransactionType.PURCHASE,
        date: purchase.date,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.costPrice,
        totalAmount: item.totalPrice,
        reference: purchase.reference,
        notes: purchase.notes
      };
      
      this.storageService.saveTransaction(transaction);
    }
    
    this.loadTransactions();
    this.loadPurchases();
  }

  // Create inventory adjustment
  createAdjustment(adjustment: Omit<Transaction, 'id' | 'type'>): boolean {
    // Check if adjustment would result in negative inventory
    if (adjustment.quantity < 0) {
      const item = this.itemService.getItemById(adjustment.itemId);
      if (!item || item.quantity + adjustment.quantity < 0) {
        return false; // Would result in negative inventory
      }
    }

    // Update inventory
    this.itemService.updateItemQuantity(adjustment.itemId, adjustment.quantity);
    
    // Create transaction record
    const transaction: Transaction = {
      ...adjustment,
      id: this.storageService.generateId(),
      type: TransactionType.ADJUSTMENT
    };
    
    this.storageService.saveTransaction(transaction);
    this.loadTransactions();
    return true;
  }

  // Get daily sales data for reports
  getDailySalesData(startDate: Date, endDate: Date): { date: string; totalSales: number; itemCount: number }[] {
    const sales = this.storageService.getSales().filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Group sales by date
    const dailyData: { [date: string]: { totalSales: number; itemCount: number } } = {};
    
    sales.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { totalSales: 0, itemCount: 0 };
      }
      
      dailyData[dateStr].totalSales += sale.totalAmount;
      sale.items.forEach(item => {
        dailyData[dateStr].itemCount += item.quantity;
      });
    });
    
    // Convert to array format for charts
    return Object.keys(dailyData).map(date => ({
      date,
      totalSales: dailyData[date].totalSales,
      itemCount: dailyData[date].itemCount
    }));
  }

  // Get transactions by date range
  getTransactionsByDateRange(startDate: Date, endDate: Date): Transaction[] {
    return this.storageService.getTransactions().filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // Get sales by date range
  getSalesByDateRange(startDate: Date, endDate: Date): Sale[] {
    return this.storageService.getSales().filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  // Get purchases by date range
  getPurchasesByDateRange(startDate: Date, endDate: Date): Purchase[] {
    return this.storageService.getPurchases().filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
  }
}
