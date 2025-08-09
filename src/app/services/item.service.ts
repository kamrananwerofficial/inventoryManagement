import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = 'http://localhost:5000/api/items'; // 🔁 yahan apna backend base URL daalo

  constructor(private http: HttpClient) {}
headerSubject = new Subject<any[]>();
  getItems(): Observable<Item[]> {
    this.http.get<Item[]>(`${this.apiUrl}/dashboard`).subscribe(items => {
      const lowStockCount = items.filter(item => item.quantity <= item.reorderLevel)
        this.headerSubject.next(lowStockCount)
    });
    return this.http.get<Item[]>(`${this.apiUrl}/dashboard`);
  }

  getItemById(id: any): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  addItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item);
  }

  updateItem(item: Item): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${item.id}`, item);
  }

  deleteItem(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
updateItemQuantity(itemId: string, quantityChange: number): Observable<Item> {
  return this.http.patch<Item>(`${this.apiUrl}/items/${itemId}/update-quantity`, {
    quantityChange: quantityChange
  });
}
  // 👇 Ye functions tab banenge jab backend pe bhi implementation ho:
  // getItemsByCategory(), getLowStockItems(), searchItems(), updateItemQuantity() etc.
}
