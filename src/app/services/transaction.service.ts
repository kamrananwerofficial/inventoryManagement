import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Sale, Purchase, Transaction, TransactionType } from '../models/transaction.model';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = environment.apiUrl; // 🟡 like: http://localhost:5000/api

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}
  getPurchasesByDateRange(startDate: Date, endDate: Date): Observable<Purchase[]> {
  return this.http.get<Purchase[]>(`${this.apiUrl}/purchases/date-range?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
}
getTransactionsByDateRange(startDate: Date, endDate: Date,type:TransactionType): Observable<Transaction[]> {
  return this.http.get<Transaction[]>(`${this.apiUrl}/purchases/date-range?start=${startDate.toISOString()}&end=${endDate.toISOString()}&type=${type}`);
}

  // ✅ New: Create sale via backend
  createSale(sale: Omit<Sale, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/sales`, sale);
  }

  // ✅ New: Create purchase via backend
  createPurchase(purchase: Omit<Purchase, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/purchases`, purchase);
  }
getPurchaseById(purchaseId: string): Observable<Purchase> {
  return this.http.get<Purchase>(`${this.apiUrl}/purchases/${purchaseId}`);
}
getSaleById(saleId: string): Observable<Sale> {
  return this.http.get<Sale>(`${this.apiUrl}/sales/${saleId}`);
}
  // ✅ New: Create adjustment
createAdjustment(adjustment: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/items/adjustment`, {
    itemId: adjustment.itemId,
    quantity: adjustment.quantity,
    notes: adjustment.notes,
    date: adjustment.date
  });
}
getSales(): Observable<Sale[]> {
  return this.http.get<Sale[]>(`${this.apiUrl}/sales`);
}

getPurchases(): Observable<Purchase[]> {
  return this.http.get<Purchase[]>(`${this.apiUrl}/purchases`);
}

  // 🟡 Reports & other offline logic — optional to update later
  getDailySalesData(startDate: Date, endDate: Date): { date: string; totalSales: number; itemCount: number }[] {
    const sales = this.storageService.getSales().filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

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

    return Object.keys(dailyData).map(date => ({
      date,
      totalSales: dailyData[date].totalSales,
      itemCount: dailyData[date].itemCount
    }));
  }
}
